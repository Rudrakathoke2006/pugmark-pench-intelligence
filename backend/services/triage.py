import os
from typing import Dict, Any
from ml.blank_filter.megadetector import BlankFilter

class TriageEngine:
    """
    Stage 1: Camera-trap blank & non-target filtering.
    Classifies raw frames into:
    - KEEP (Animal confidence >= 0.40)
    - REVIEW (Animal confidence 0.20 - 0.39)
    - QUARANTINE (Animal confidence < 0.20, blank/shadow/leaves)
    - PRIVACY (Person confidence >= 0.20, human/vehicle restricted queue)
    """

    def __init__(self, high_threshold: float = 0.40, low_threshold: float = 0.20):
        self.detector = BlankFilter()
        self.high_threshold = high_threshold
        self.low_threshold = low_threshold

    def evaluate_image(
        self,
        filepath: str,
        mock_animal_conf: float = None,
        season: str = "leaf-on",
        lighting: str = "day"
    ) -> Dict[str, Any]:
        image_id = os.path.splitext(os.path.basename(filepath))[0]
        res = self.detector.classify(image_id, filepath, season=season, lighting=lighting)

        if mock_animal_conf is not None:
            animal_conf = mock_animal_conf
            person_conf = 0.05
            vehicle_conf = 0.01
            keep_thresh, review_thresh = self.detector.get_thresholds(season, lighting)
            if animal_conf >= keep_thresh:
                decision = "KEEP"
                reason = f"High animal confidence ({animal_conf*100:.1f}% >= {keep_thresh*100:.0f}%)"
            elif animal_conf >= review_thresh:
                decision = "REVIEW"
                reason = f"Uncertain animal confidence ({animal_conf*100:.1f}%)"
            else:
                decision = "QUARANTINE"
                reason = f"Low animal confidence ({animal_conf*100:.1f}%)"
        else:
            decision = res.decision.upper()
            animal_conf = res.animal_conf
            person_conf = res.person_conf
            vehicle_conf = res.vehicle_conf
            reason = res.reason

        return {
            "decision": decision,
            "animal_confidence": round(animal_conf, 4),
            "person_confidence": round(person_conf, 4),
            "vehicle_confidence": round(vehicle_conf, 4),
            "reason": reason,
            "season": season,
            "lighting": lighting
        }

triage_service = TriageEngine()
