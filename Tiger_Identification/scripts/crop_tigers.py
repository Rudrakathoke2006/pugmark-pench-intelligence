from ultralytics import YOLO
import cv2
import os

# Load the YOLO model
model = YOLO("yolo11n.pt")

# Folders
input_folder = "frames"
output_folder = "tiger_crops"

os.makedirs(output_folder, exist_ok=True)

# Go through all frames
for filename in os.listdir(input_folder):

    if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
        continue

    image_path = os.path.join(input_folder, filename)

    image = cv2.imread(image_path)

    if image is None:
        continue

    # Run YOLO
    results = model(image, conf=0.25)

    # Get detected boxes
    boxes = results[0].boxes

    if len(boxes) == 0:
        print(filename, "→ No detection")
        continue

    # Take the highest-confidence detection
    best_box = max(
        boxes,
        key=lambda box: float(box.conf[0])
    )

    # Get coordinates
    x1, y1, x2, y2 = map(
        int,
        best_box.xyxy[0]
    )

    # Crop the detected object
    crop = image[y1:y2, x1:x2]

    # Save crop
    output_path = os.path.join(
        output_folder,
        filename
    )

    cv2.imwrite(output_path, crop)

    print(filename, "→ Tiger crop saved")

print("Finished!")