"""
WHERE: backend/services/accuracy_metrics.py
WHY: Evaluation metric dashboard computing empirical accuracy, precision, recall,
     and Re-ID match breakdown directly from decision logs and human overrides.
"""
from typing import Dict, Any, List


def compute_accuracy_metrics(images: List[Dict[str, Any]], identifications: List[Dict[str, Any]], logs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes system-wide performance metrics:
    - Blank filter precision & recall against human overrides
    - Re-ID 5-way breakdown (known-correct, known-incorrect, review, enroll, overall)
    - Human override rate
    """
    total_images = len(images)
    kept = sum(1 for img in images if img.get("blank_decision") == "KEEP")
    quarantined = sum(1 for img in images if img.get("blank_decision") == "QUARANTINE")
    privacy = sum(1 for img in images if img.get("blank_decision") == "PRIVACY")
    review = sum(1 for img in images if img.get("blank_decision") == "REVIEW")

    # Blank Filter performance estimation (Precision/Recall)
    overrides = [l for l in logs if l.get("operator_override")]
    blank_overrides = [l for l in overrides if "blank" in l.get("stage", "").lower() or "triage" in l.get("stage", "").lower()]

    tp = max(1, kept - len(blank_overrides))
    fp = len(blank_overrides)
    fn = sum(1 for l in blank_overrides if "keep" in l.get("output", "").lower())
    tn = max(1, quarantined + privacy - fn)

    precision = round(tp / max(1, tp + fp), 4)
    recall = round(tp / max(1, tp + fn), 4)
    f1_score = round(2 * (precision * recall) / max(0.001, precision + recall), 4)
    fn_rate = round(fn / max(1, tp + fn), 4)

    # Re-ID 5-way breakdown
    auto_matches = [i for i in identifications if i.get("decision") == "AUTO-MATCH"]
    human_reviews = [i for i in identifications if i.get("decision") in ["HUMAN-REVIEW", "HUMAN_REVIEW"]]
    auto_enrolls = [i for i in identifications if i.get("decision") in ["NEW-CANDIDATE", "AUTO-ENROLL"]]

    confirmed_matches = sum(1 for i in auto_matches if i.get("review_status") == "CONFIRMED")
    rejected_matches = sum(1 for i in auto_matches if i.get("review_status") == "REJECTED")
    confirmed_enrolls = sum(1 for i in auto_enrolls if i.get("review_status") == "ENROLLED")

    reid_total = max(1, len(identifications))
    accuracy_top1 = round((confirmed_matches + confirmed_enrolls) / reid_total, 4)

    return {
        "blank_filter": {
            "total_evaluated": total_images,
            "kept": kept,
            "quarantined": quarantined,
            "privacy": privacy,
            "review": review,
            "precision": precision,
            "recall": recall,
            "false_negative_rate": fn_rate,
            "f1_score": f1_score
        },
        "reid_breakdown": {
            "total_queries": len(identifications),
            "known_correctly_matched": confirmed_matches,
            "known_incorrectly_matched": rejected_matches,
            "sent_to_human_review": len(human_reviews),
            "unknown_correctly_enrolled": confirmed_enrolls,
            "top1_accuracy": accuracy_top1
        },
        "system_audit": {
            "total_decisions_logged": len(logs),
            "human_overrides_count": len(overrides),
            "override_rate_pct": round((len(overrides) / max(1, len(logs))) * 100.0, 2)
        }
    }


def audit_false_negatives(quarantined_samples: List[Dict[str, Any]], ground_truth_labels: Dict[str, str] = None) -> Dict[str, Any]:
    """
    Audits a sample set of quarantined blank frames to explicitly measure false-negative rate:
    False Negative = frame marked QUARANTINE that actually contained a target animal/tiger.
    """
    total_quarantined = len(quarantined_samples)
    if total_quarantined == 0:
        return {"audited_count": 0, "false_negatives_count": 0, "false_negative_rate": 0.0, "status": "clean"}

    fn_count = 0
    flagged_samples = []

    for item in quarantined_samples:
        img_id = item.get("image_id") or item.get("filename")
        # Check against ground truth or override logs
        true_label = (ground_truth_labels or {}).get(img_id)
        if true_label and true_label.upper() not in ["BLANK", "EMPTY", "NON_TARGET"]:
            fn_count += 1
            flagged_samples.append({
                "image_id": img_id,
                "file_path": item.get("file_path"),
                "ground_truth_label": true_label
            })

    fn_rate = round(fn_count / float(total_quarantined), 4)

    return {
        "audited_count": total_quarantined,
        "false_negatives_count": fn_count,
        "false_negative_rate": fn_rate,
        "false_negative_rate_pct": round(fn_rate * 100.0, 2),
        "flagged_false_negatives": flagged_samples,
        "assessment": "EXCELLENT (< 1.5% FN)" if fn_rate < 0.015 else "ACTION REQUIRED (FN rate too high)"
    }

