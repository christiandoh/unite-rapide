import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from loguru import logger


class ImageProcessor:
    def preprocess(self, image_path: str) -> np.ndarray:
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Impossible de lire l'image: {image_path}")

        img = self._resize_if_needed(img)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, h=30)
        enhanced = self._enhance_contrast(denoised)
        thresholded = self._adaptive_threshold(enhanced)
        final = self._sharpen(thresholded)

        logger.debug(f"Image prétraitée: {image_path}")
        return final

    def _resize_if_needed(self, img: np.ndarray, max_size: int = 1920) -> np.ndarray:
        h, w = img.shape[:2]
        if max(h, w) > max_size:
            scale = max_size / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        return img

    def _enhance_contrast(self, img: np.ndarray) -> np.ndarray:
        pil_img = Image.fromarray(img)
        enhancer = ImageEnhance.Contrast(pil_img)
        enhanced = enhancer.enhance(1.5)
        return np.array(enhanced)

    def _adaptive_threshold(self, img: np.ndarray) -> np.ndarray:
        return cv2.adaptiveThreshold(
            img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )

    def _sharpen(self, img: np.ndarray) -> np.ndarray:
        kernel = np.array([[-1, -1, -1],
                           [-1, 9, -1],
                           [-1, -1, -1]])
        return cv2.filter2D(img, -1, kernel)

    def extract_wave_region(self, image_path: str) -> np.ndarray:
        img = cv2.imread(image_path)
        h, w = img.shape[:2]
        roi = img[int(h * 0.15):int(h * 0.85), int(w * 0.1):int(w * 0.9)]
        return roi
