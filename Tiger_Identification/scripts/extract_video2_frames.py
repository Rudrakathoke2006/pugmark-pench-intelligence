import cv2
import os

video_path = "videos/video_02.mp4"
output_folder = "frames_video2"

os.makedirs(output_folder, exist_ok=True)

cap = cv2.VideoCapture(video_path)

fps = cap.get(cv2.CAP_PROP_FPS)

print("Video FPS:", fps)

frame_interval = int(fps / 3)

frame_count = 0
saved_count = 0

while True:

    ret, frame = cap.read()

    if not ret:
        break

    if frame_count % frame_interval == 0:

        filename = os.path.join(
            output_folder,
            f"frame_{saved_count:05d}.jpg"
        )

        cv2.imwrite(filename, frame)

        saved_count += 1

    frame_count += 1

cap.release()

print("Total frames saved:", saved_count)