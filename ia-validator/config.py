import os
from dotenv import load_dotenv

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "/app/ml_models")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.85"))
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
REDIS_URL = os.getenv("REDIS_URL", "redis://:change_me@redis:6379")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

DECISION_THRESHOLDS = {
    "auto_validate": 0.90,
    "manual_review": 0.70,
    "auto_reject": 0.50,
}

WAVE_MERCHANT_NAME = os.getenv("WAVE_MERCHANT_NAME", "Wave")
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".heif"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024
