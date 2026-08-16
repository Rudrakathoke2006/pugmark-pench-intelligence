from ultralytics import YOLO
import os

# Load YOLO model
model = YOLO("yolo11n.pt")

# Input and output folders
input_folder = "frames_video2"
output_folder = "tiger_crops_video2"

os.makedirs(output_folder, exist_ok=True)

# Process every frame
for filename in os.listdir(input_folder):

    if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
        continue

    image_path = os.path.join(input_folder, filename)

    results = model(image_path)

    for result in results:

        boxes = result.boxes

        for box in boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            # COCO class 0 = person, 17 = horse, 22 = zebra etc.
            # We are temporarily saving detected animal regions.
            if confidence < 0.25:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            image = result.orig_img

            crop = image[y1:y2, x1:x2]

            if crop.size == 0:
                continue

            output_path = os.path.join(
                output_folder,
                filename
            )

            import cv2
            cv2.imwrite(output_path, crop)

            print(
                filename,
                "confidence:",
                round(confidence, 2)
            )

            break

print()
print("Video 2 detection completed!")
print("Crops saved to:", output_folder)