import uuid
import json
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import httpx
from loguru import logger
import redis as redis_lib

from config import (
    UPLOAD_DIR, CONFIDENCE_THRESHOLD, DECISION_THRESHOLDS,
    REDIS_URL, SUPPORTED_EXTENSIONS, MAX_IMAGE_SIZE,
)
from services.image_processor import ImageProcessor
from models.ocr_extractor import OCRExtractor
from models.fraud_detector import FraudDetector
from services.confidence import ConfidenceCalculator

app = FastAPI(title="IA Validator USSD", version="1.0.0")

image_processor = ImageProcessor()
ocr_extractor = OCRExtractor()
fraud_detector = FraudDetector()
confidence_calculator = ConfidenceCalculator()

try:
    redis_client = redis_lib.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
    logger.info("Redis connecté")
except Exception as e:
    logger.warning(f"Redis non disponible: {e}")
    redis_client = None

UPLOAD_DIR = Path(UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROOFS_DIR = UPLOAD_DIR / "proofs"
PROOFS_DIR.mkdir(exist_ok=True)

@app.on_event("startup")
async def startup():
    logger.info("Service IA Validateur démarré")

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "threshold": CONFIDENCE_THRESHOLD,
    }

@app.post("/validate/payment")
async def validate_payment(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    commande_id: str = Form(...),
    expected_amount: float = Form(...),
    expected_phone: str = Form(...),
):
    ext = Path(image.filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(400, f"Format non supporté: {ext}")

    contents = await image.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(400, "Image trop volumineuse (max 10MB)")

    image_id = str(uuid.uuid4())
    image_path = PROOFS_DIR / f"{image_id}{ext}"

    with open(image_path, "wb") as f:
        f.write(contents)

    logger.info(f"Image sauvegardée: {image_path} (commande: {commande_id})")

    background_tasks.add_task(cleanup_temp, image_path)

    try:
        level1 = await validate_image_structure(image_path)
        if not level1["valid"]:
            return rejection_response(level1["reason"], commande_id)

        processed = image_processor.preprocess(str(image_path))
        extracted = await ocr_extractor.extract(processed)

        coherence = check_coherence(extracted, expected_amount, expected_phone)
        fraud_analysis = await fraud_detector.analyze(str(image_path))

        final_score = confidence_calculator.calculate(
            level1, extracted, coherence, fraud_analysis
        )

        decision = make_decision(final_score)

        result = {
            "status": decision,
            "confidence_score": round(final_score, 2),
            "extracted_data": extracted,
            "validation_details": {
                "level1_structure": level1,
                "level2_ocr": extracted,
                "level3_coherence": coherence,
                "level4_fraud": fraud_analysis,
            },
            "flags": generate_flags(fraud_analysis),
            "commande_id": commande_id,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if redis_client:
            redis_client.setex(
                f"validation:{commande_id}",
                3600,
                json.dumps(result, default=str),
            )

        logger.info(f"Validation terminée: {decision} (score: {final_score:.2f})")
        return result

    except Exception as e:
        logger.error(f"Erreur validation: {e}")
        raise HTTPException(500, f"Erreur lors de la validation: {str(e)}")

@app.get("/validate/status/{commande_id}")
async def get_validation_status(commande_id: str):
    if redis_client:
        cached = redis_client.get(f"validation:{commande_id}")
        if cached:
            return json.loads(cached)
    return {"status": "not_found", "commande_id": commande_id}

async def validate_image_structure(image_path: Path) -> dict:
    from PIL import Image
    try:
        img = Image.open(image_path)
        width, height = img.size
        aspect_ratio = width / height

        return {
            "valid": True,
            "width": width,
            "height": height,
            "aspect_ratio": round(aspect_ratio, 2),
            "format": img.format,
            "mode": img.mode,
            "size_kb": round(image_path.stat().st_size / 1024, 2),
        }
    except Exception as e:
        return {"valid": False, "reason": f"Image invalide: {str(e)}"}

def check_coherence(extracted: dict, expected_amount: float, expected_phone: str) -> dict:
    checks = []
    score = 1.0

    if extracted.get("montant"):
        try:
            amount = float(extracted["montant"].replace(" ", "").replace(",", "."))
            diff = abs(amount - expected_amount)
            if diff > 10:
                score -= 0.3
                checks.append(f"Montant différent: attendu={expected_amount}, trouvé={amount}")
            else:
                checks.append("Montant correspond")
        except (ValueError, TypeError):
            score -= 0.2
            checks.append("Montant non parseable")

    if extracted.get("numero_destinataire"):
        if expected_phone in extracted["numero_destinataire"]:
            checks.append("Numéro destinataire correspond")
        else:
            score -= 0.2
            checks.append("Numéro destinataire différent")

    if extracted.get("statut"):
        if extracted["statut"].lower() in ["réussi", "reussi", "succès", "succes", "success"]:
            checks.append("Transaction réussie")
        else:
            score -= 0.4
            checks.append(f"Statut transaction: {extracted['statut']}")

    return {"score": round(max(0, score), 2), "checks": checks}

def make_decision(score: float) -> str:
    if score >= DECISION_THRESHOLDS["auto_validate"]:
        return "valide_auto"
    elif score >= DECISION_THRESHOLDS["manual_review"]:
        return "a_reviser"
    else:
        return "rejete"

def generate_flags(fraud_analysis: dict) -> list:
    flags = []
    if fraud_analysis.get("ela_score", 0) > 0.3:
        flags.append("modification_detectee")
    if fraud_analysis.get("duplicate_detected", False):
        flags.append("image_deja_utilisee")
    if fraud_analysis.get("exif_anomaly", False):
        flags.append("metadonnees_modifiees")
    return flags

def rejection_response(reason: str, commande_id: str) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={
            "status": "rejected",
            "reason": reason,
            "commande_id": commande_id,
        },
    )

def cleanup_temp(path: Path):
    try:
        if path.exists():
            path.unlink()
            logger.debug(f"Nettoyage: {path}")
    except Exception as e:
        logger.warning(f"Erreur nettoyage {path}: {e}")
