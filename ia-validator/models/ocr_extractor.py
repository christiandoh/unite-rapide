import re
import numpy as np
import pytesseract
from loguru import logger


class OCRExtractor:
    async def extract(self, image: np.ndarray) -> dict:
        try:
            full_text = pytesseract.image_to_string(image, lang="fra+eng")
            confidence_data = pytesseract.image_to_data(image, lang="fra+eng", output_type=pytesseract.Output.DICT)
            confidences = [int(c) for c in confidence_data["conf"] if c != "-1"]
            avg_confidence = sum(confidences) / len(confidences) / 100.0 if confidences else 0.0

            return {
                "montant": self._extract_amount(full_text),
                "numero_destinataire": self._extract_phone(full_text),
                "reference": self._extract_reference(full_text),
                "date_heure": self._extract_datetime(full_text),
                "statut": self._extract_status(full_text),
                "nom_marchand": self._extract_merchant(full_text),
                "full_text": full_text.strip(),
                "confidence": round(avg_confidence, 2),
            }
        except Exception as e:
            logger.error(f"Erreur OCR: {e}")
            return {
                "montant": None,
                "numero_destinataire": None,
                "reference": None,
                "date_heure": None,
                "statut": None,
                "nom_marchand": None,
                "full_text": "",
                "confidence": 0,
            }

    def _extract_amount(self, text: str) -> str | None:
        patterns = [
            r'(\d[\d\s]*\.?\d*)\s*(?:F\s*CFA|FCFA|CFA|F)\b',
            r'(?:montant|total|prix)\s*[:\-]?\s*(\d[\d\s]*\.?\d*)',
            r'(\d[\d\s]*\.?\d*)\s*(?:XOF|Francs?)',
        ]
        for pat in patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_phone(self, text: str) -> str | None:
        patterns = [
            r'(?:\+225|00225)?\s*(0[7|5|1]\d{8})',
            r'(?:destinataire|bénéficiaire|client|à)\s*[:\-]?\s*(?:\+225|00225)?\s*(0[7|5|1]\d{8})',
            r'(?:\+225|00225)?\s*(0[7|5|1]\d{2}\s?\d{2}\s?\d{2}\s?\d{2})',
        ]
        for pat in patterns:
            match = re.search(pat, text)
            if match:
                return match.group(1).replace(" ", "")
        return None

    def _extract_reference(self, text: str) -> str | None:
        patterns = [
            r'USSD-\d{8}-[A-Z0-9]{6}',
            r'(?:réf|ref|reference|transaction)[\s:]*([A-Z0-9-]{8,20})',
        ]
        for pat in patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                return match.group(0)
        return None

    def _extract_datetime(self, text: str) -> str | None:
        patterns = [
            r'\d{2}/\d{2}/\d{4}\s*\d{2}:\d{2}',
            r'\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}',
        ]
        for pat in patterns:
            match = re.search(pat, text)
            if match:
                return match.group(0)
        return None

    def _extract_status(self, text: str) -> str | None:
        success = re.search(
            r'(réussi|reussi|succès|succes|success|confirmé|confirme)',
            text, re.IGNORECASE
        )
        failed = re.search(
            r'(échoué|echoue|échec|echec|refusé|refuse|failed)',
            text, re.IGNORECASE
        )
        if success:
            return "Réussi"
        if failed:
            return "Échoué"
        return None

    def _extract_merchant(self, text: str) -> str | None:
        lines = text.split("\n")
        for line in lines[:5]:
            stripped = line.strip()
            if stripped and len(stripped) > 3 and not re.search(r'\d', stripped):
                return stripped
        return None
