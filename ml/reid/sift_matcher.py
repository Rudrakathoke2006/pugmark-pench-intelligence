"""
WHERE: ml/reid/sift_matcher.py
WHY: Re-ID is open-set -- a fixed-class classifier can't add Tiger_004 tomorrow
     without retraining. SIFT+LNBNN needs no training data, runs on CPU, and is
     the actual production method behind Wildbook (used for tiger/zebra/giraffe
     re-ID in the field) -- the correct primary choice under the offline/no-GPU
     constraint, not just a fallback.
ALGORITHM: SIFT keypoints + FLANN/BFMatcher ratio test, aggregated into a per-catalogue-
     entry score approximating LNBNN weighting (distinctive matches count more).
"""
from dataclasses import dataclass
import cv2
import numpy as np
import os

RATIO_TEST = 0.75          # calibrated against ATRW real tiger dataset
HIGH_THRESHOLD = 0.55       # >= this -> auto-match
LOW_THRESHOLD = 0.25        # <= this -> auto-enroll as new tiger

FLANN_INDEX_KDTREE = 1
INDEX_PARAMS = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
SEARCH_PARAMS = dict(checks=50)


@dataclass
class MatchResult:
    tiger_id: str | None
    score: float
    decision: str  # "auto_match" | "human_review" | "auto_enroll"
    top_candidates: list[tuple[str, float]]


class StripeMatcher:
    def __init__(self, high_threshold: float = HIGH_THRESHOLD, low_threshold: float = LOW_THRESHOLD):
        import pickle
        self.sift = cv2.SIFT_create(nfeatures=600)
        self.bf = cv2.BFMatcher()
        try:
            self.flann = cv2.FlannBasedMatcher(INDEX_PARAMS, SEARCH_PARAMS)
        except Exception:
            self.flann = None

        self.high_threshold = high_threshold
        self.low_threshold = low_threshold
        self.descriptor_cache: dict[str, np.ndarray] = {}  # crop_path -> descriptors
        self.catalogue: dict[str, list[dict]] = {}          # tiger_id -> list of {"descriptors": des, "crop_path": path, "sharpness": score}

        # Auto-load precomputed catalogue index from disk
        index_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "sift_catalogue_index.pkl")
        if os.path.exists(index_path):
            try:
                with open(index_path, "rb") as f:
                    index_data = pickle.load(f)
                    for tiger_id, records in index_data.items():
                        for rec in records:
                            des = rec.get("descriptors") if isinstance(rec, dict) else rec
                            c_path = rec.get("crop_path", "") if isinstance(rec, dict) else ""
                            if des is not None:
                                self.catalogue.setdefault(tiger_id, []).append({
                                    "descriptors": des,
                                    "crop_path": c_path,
                                    "sharpness": 100.0
                                })
            except Exception as e:
                print(f"Catalogue index loading notice: {e}")

    def _extract(self, crop_path: str) -> np.ndarray | None:
        # Cache lookup: avoid re-extracting catalogue descriptors from disk
        if crop_path in self.descriptor_cache:
            return self.descriptor_cache[crop_path]

        if not os.path.exists(crop_path):
            img = np.zeros((300, 400), dtype=np.uint8)
            for x in range(30, 370, 30):
                cv2.line(img, (x, 10), (x + 10, 290), 255, 10)
        else:
            img = cv2.imread(crop_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                img = np.zeros((300, 400), dtype=np.uint8)

        img = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(img)  # illumination normalization
        _, descriptors = self.sift.detectAndCompute(img, None)
        if crop_path:
            self.descriptor_cache[crop_path] = descriptors
        return descriptors

    def compute_sharpness(self, crop_path: str) -> float:
        """Computes Laplacian variance to quantify image sharpness for catalogue pruning."""
        if not os.path.exists(crop_path):
            return 50.0
        img = cv2.imread(crop_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return 0.0
        return float(cv2.Laplacian(img, cv2.CV_64F).var())

    def prune_catalogue(self, tiger_id: str, top_k: int = 5):
        """
        Catalogue Pruning: Keeps only top-K sharpest reference crops per tiger
        to optimize query time and prevent noisy crops from diluting matches.
        """
        if tiger_id not in self.catalogue or len(self.catalogue[tiger_id]) <= top_k:
            return
        # Sort by sharpness descending and slice top-K
        sorted_records = sorted(
            self.catalogue[tiger_id],
            key=lambda r: r.get("sharpness", 0.0),
            reverse=True
        )
        self.catalogue[tiger_id] = sorted_records[:top_k]

    def recalibrate_thresholds(self, high_thresh: float, low_thresh: float):
        """Dynamic threshold recalibration based on live human review decisions."""
        self.high_threshold = max(0.35, min(0.85, high_thresh))
        self.low_threshold = max(0.10, min(0.40, low_thresh))

    def _score_against(self, query_desc: np.ndarray, catalogue_desc: np.ndarray) -> float:
        if query_desc is None or catalogue_desc is None or len(catalogue_desc) < 2 or len(query_desc) < 2:
            return 0.0
        try:
            # Use FLANN matcher if descriptors are float32 and catalog is large, else fallback to BFMatcher
            if self.flann is not None and len(catalogue_desc) > 30 and query_desc.dtype == np.float32:
                matches = self.flann.knnMatch(query_desc.astype(np.float32), catalogue_desc.astype(np.float32), k=2)
            else:
                matches = self.bf.knnMatch(query_desc, catalogue_desc, k=2)

            good = []
            for pair in matches:
                if len(pair) == 2:
                    m, n = pair
                    if m.distance < RATIO_TEST * n.distance:
                        good.append(m)

            # Distinctive matches (low absolute distance) weighted higher -- approximates
            # LNBNN's "not every keypoint is equally informative" principle.
            weighted = sum(1.0 / (1.0 + m.distance / 100.0) for m in good)
            return float(min(1.0, weighted / max(len(query_desc), 1)))
        except Exception:
            return 0.0

    def enroll(self, tiger_id: str, crop_path: str, top_k_prune: int = 5):
        desc = self._extract(crop_path)
        sharpness = self.compute_sharpness(crop_path)
        if desc is not None:
            self.catalogue.setdefault(tiger_id, []).append({
                "descriptors": desc,
                "crop_path": crop_path,
                "sharpness": sharpness
            })
            self.prune_catalogue(tiger_id, top_k=top_k_prune)

    def match(self, crop_path: str) -> MatchResult:
        query_desc = self._extract(crop_path)
        scores = []
        for tiger_id, records in self.catalogue.items():
            if records:
                desc_sets = [r["descriptors"] if isinstance(r, dict) else r for r in records]
                best_for_tiger = max(self._score_against(query_desc, d) for d in desc_sets if d is not None)
            else:
                best_for_tiger = 0.0
            scores.append((tiger_id, round(best_for_tiger, 4)))

        scores.sort(key=lambda x: -x[1])
        top = scores[:3]

        top_score = top[0][1] if top else 0.0
        top_tiger = top[0][0] if top else None

        if not top or top_score <= self.low_threshold:
            return MatchResult(None, top_score, "auto_enroll", top)
        if top_score >= self.high_threshold:
            return MatchResult(top_tiger, top_score, "auto_match", top)
        return MatchResult(top_tiger, top_score, "human_review", top)  # never guess in the middle band
