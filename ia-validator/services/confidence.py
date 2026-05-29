class ConfidenceCalculator:
    def calculate(self, level1: dict, extracted: dict, coherence: dict, fraud: dict) -> float:
        score = 0.0

        if level1.get("valid"):
            score += 0.15

        ocr_confidence = extracted.get("confidence", 0)
        if ocr_confidence > 0:
            score += 0.25 * min(ocr_confidence, 1.0)

        coherence_score = coherence.get("score", 0)
        score += 0.35 * coherence_score

        if not fraud.get("clean", True):
            risk = fraud.get("risk_score", 0)
            score -= 0.25 * risk

            ela = fraud.get("ela_score", 0)
            if ela > 0.5:
                score -= 0.15
        else:
            score += 0.25

        return max(0.0, min(1.0, score))
