import torch
import timm
import os
import pickle
from PIL import Image
from torchvision import transforms

# -----------------------------
# Settings
# -----------------------------

input_folder = "tiger_crops"
output_file = "database/tiger_1_embeddings.pkl"

# These are the Tiger 1 images we selected
tiger1_images = [
    "frame_00000.jpg",
    "frame_00001.jpg",
    "frame_00002.jpg",
    "frame_00003.jpg",
    "frame_00004.jpg",
    "frame_00009.jpg",
    "frame_00010.jpg",
    "frame_00011.jpg",
    "frame_00012.jpg",
    "frame_00013.jpg",
    "frame_00014.jpg",
    "frame_00015.jpg",
    "frame_00016.jpg",
    "frame_00017.jpg",
    "frame_00018.jpg"
]

# -----------------------------
# Load model
# -----------------------------

print("Loading ResNet50...")

model = timm.create_model(
    "resnet50",
    pretrained=True,
    num_classes=0
)

model.eval()

print("Model loaded!")

# -----------------------------
# Image transformation
# -----------------------------

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# -----------------------------
# Generate embeddings
# -----------------------------

database = {}

for filename in tiger1_images:

    image_path = os.path.join(input_folder, filename)

    image = Image.open(image_path).convert("RGB")

    image_tensor = transform(image)
    image_tensor = image_tensor.unsqueeze(0)

    with torch.no_grad():
        embedding = model(image_tensor)

    # Normalize embedding
    embedding = torch.nn.functional.normalize(
        embedding,
        p=2,
        dim=1
    )

    database[filename] = embedding.squeeze(0)

    print(filename, "→ embedding generated")

# -----------------------------
# Save database
# -----------------------------

os.makedirs("database", exist_ok=True)

with open(output_file, "wb") as f:
    pickle.dump(database, f)

print()
print("==============================")
print("Tiger 1 embedding database")
print("==============================")
print("Images:", len(database))
print("Embedding size: 2048")
print("Saved to:", output_file)
print("==============================")