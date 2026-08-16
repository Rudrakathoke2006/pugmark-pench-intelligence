import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import cv2
import numpy as np
from backend.services.video_processor import VideoProcessor

def test_video_pipeline():
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "static"))
    test_video_path = os.path.join(static_dir, "videos", "test_tiger_patrol.mp4")
    os.makedirs(os.path.dirname(test_video_path), exist_ok=True)

    print(f"Generating synthetic tiger video for verification: {test_video_path}")
    
    # Create 3-second 1080p video at 25 fps
    height, width = 720, 1280
    fps = 25
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(test_video_path, fourcc, fps, (width, height))

    for frame_idx in range(75):
        # Create image with stripe pattern simulation
        frame = np.full((height, width, 3), 40, dtype=np.uint8)
        cv2.putText(frame, f"Pench Camera Trap - Frame {frame_idx}", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2)
        # Draw tiger stripe pattern mock
        cv2.ellipse(frame, (600 + (frame_idx * 2), 360), (200, 100), 0, 0, 360, (0, 140, 255), -1)
        cv2.putText(frame, "TIGER DETECTED [T-101]", (550, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        out.write(frame)

    out.release()
    print("Synthetic video created successfully!")

    print("Running VideoProcessor.process_video()...")
    processor = VideoProcessor(static_dir=static_dir)
    res = processor.process_video(
        video_path=test_video_path,
        station_id="ST-01",
        survey_cycle="2026-Monsoon-Cycle-04",
        sample_interval_sec=1.0
    )

    print("Processing result:")
    print(f"Success: {res.get('success')}")
    print(f"Total Extracted Frames: {res.get('summary', {}).get('total_extracted')}")
    print(f"Kept Count: {res.get('summary', {}).get('kept')}")
    print("Frames extracted:", [f["frame_path"] for f in res.get("frames", [])])

if __name__ == "__main__":
    test_video_pipeline()
