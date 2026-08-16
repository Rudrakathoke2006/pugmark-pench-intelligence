from ultralytics import YOLO

# Load YOLO model
model = YOLO("yolo11n.pt")

# Detect objects in our frames
results = model.predict(
    source="frames",
    save=True,
    conf=0.25
)

print("Detection completed!")