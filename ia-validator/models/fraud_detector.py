import cv2
import numpy as np
import imagehash
from PIL import Image, UnidentifiedImageError
from loguru import logger
from datetime import datetime, timedelta

try:
    from skimage import metrics as skmetrics
    HAS_SKIMAGE = True
except ImportError:
    HAS_SKIMAGE = False


class FraudDetector:
    def __init__(self):
        self.recent_hashes = []

    async def analyze(self, image_path: str) -> dict:
        results = {
            "ela_score": 0.0,
            "duplicate_detected": False,
            "exif_anomaly": False,
            "details": {},
        }

        try:
            results["ela_score"] = self._ela_analysis(image_path)
            results["duplicate_detected"] = self._check_duplicate(image_path)
            results["exif_anomaly"] = self._check_exif(image_path)

            risk_score = 0.0
            if results["ela_score"] > 0.3:
                risk_score += 0.4
            if results["duplicate_detected"]:
                risk_score += 0.5
            if results["exif_anomaly"]:
                risk_score += 0.2

            results["risk_score"] = round(min(risk_score, 1.0), 2)
            results["clean"] = risk_score < 0.3

        except Exception as e:
            logger.error(f"Erreur analyse fraude: {e}")
            results["error"] = str(e)
            results["clean"] = False

        return results

    def _ela_analysis(self, image_path: str, quality: int = 90) -> float:
        try:
            img = Image.open(image_path).convert("RGB")
            temp_path = image_path + ".ela_temp.jpg"
            img.save(temp_path, "JPEG", quality=quality)
            compressed = Image.open(temp_path)
            diff = self._image_difference(img, compressed)
            import os
            os.remove(temp_path)
            return round(float(diff), 4)
        except Exception as e:
            logger.warning(f"ELA analysis failed: {e}")
            return 0.0

    def _image_difference(self, img1: Image.Image, img2: Image.Image) -> float:
        arr1 = np.array(img1, dtype=np.float32)
        arr2 = np.array(img2, dtype=np.float32)
        if arr1.shape != arr2.shape:
            return 0.0
        diff = np.mean(np.abs(arr1 - arr2)) / 255.0
        return diff

    def _check_duplicate(self, image_path: str) -> bool:
        try:
            img = Image.open(image_path)
            phash = imagehash.phash(img)

            now = datetime.now()
            self.recent_hashes = [
                (h, t) for h, t in self.recent_hashes
                if now - t < timedelta(hours=24)
            ]

            for h, _ in self.recent_hashes:
                if h - phash < 5:
                    logger.warning(f"Image dupliquée détectée (hash diff: {h - phash})")
                    return True

            self.recent_hashes.append((phash, now))
            return False
        except Exception as e:
            logger.warning(f"Duplicate check failed: {e}")
            return False

    def _check_exif(self, image_path: str) -> bool:
        try:
            from PIL import Image
            img = Image.open(image_path)
            exif = img._getexif()
            if exif is None:
                return True
            return False
        except Exception:
            return True
