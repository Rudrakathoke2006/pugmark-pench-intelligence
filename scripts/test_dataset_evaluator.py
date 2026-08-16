import os
import sys
import zipfile
import csv
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.dataset_evaluator import DatasetEvaluator

def test_dataset_calibration():
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "static"))
    zips_dir = os.path.join(static_dir, "zips")
    os.makedirs(zips_dir, exist_ok=True)

    zip_path = os.path.join(zips_dir, "test_atrw_benchmark.zip")
    print(f"Creating test dataset archive: {zip_path}")

    # Create dummy images & labels.csv inside zip
    with zipfile.ZipFile(zip_path, 'w') as z:
        # Create labels.csv
        labels_content = "filename,confirmed_tiger_id,side\nt101_sample.jpg,T-101,Left\nt017_sample.jpg,T-017,Right\nt063_sample.jpg,T-063,Left\n"
        z.writestr("labels.csv", labels_content)

        # Write sample image placeholders
        import cv2
        import numpy as np
        dummy_frame = np.full((300, 400, 3), 128, dtype=np.uint8)
        dummy_jpg_path = os.path.join(zips_dir, "tmp_dummy.jpg")
        cv2.imwrite(dummy_jpg_path, dummy_frame)

        z.write(dummy_jpg_path, arcname="t101_sample.jpg")
        z.write(dummy_jpg_path, arcname="t017_sample.jpg")
        z.write(dummy_jpg_path, arcname="t063_sample.jpg")

    evaluator = DatasetEvaluator(static_dir=static_dir)
    res = evaluator.evaluate_dataset_zip(
        zip_path=zip_path,
        high_threshold=0.55,
        low_threshold=0.25
    )

    print("\n--- Dataset Ground-Truth Calibration Results ---")
    print(f"Success: {res.get('success')}")
    print(f"Archive: {res.get('archive_name')}")
    print(f"Labels CSV Found: {res.get('csv_labels_found')}")
    print(f"Summary: {res.get('summary')}")
    print(f"Confusion Breakdown: {res.get('confusion_breakdown')}")
    print(f"Calibrated Thresholds: {res.get('calibrated_thresholds')}")
    print(f"Location Disclaimer: {res.get('location_disclaimer')}")
    print(f"Samples Processed: {len(res.get('samples', []))}")

if __name__ == "__main__":
    test_dataset_calibration()
