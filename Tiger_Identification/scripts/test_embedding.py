import torch
import timm
from PIL import Image
from torchvision import transforms

# -----------------------------
# Load pretrained model
# -----------------------------

print("Loading model...")

model = timm.create_model(
    "resnet50",
    pretrained=True,
    num_classes=0
)

model.eval()

print("Model loaded successfully!")

# -----------------------------
# Image preprocessing
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
# Load one Tiger 1 image
# -----------------------------

image_path = "tiger_crops/frame_00023.jpg"

image = Image.open(image_path).convert("RGB")

image_tensor = transform(image)

# Add batch dimension
image_tensor = image_tensor.unsqueeze(0)

# -----------------------------
# Generate embedding
# -----------------------------

with torch.no_grad():

    embedding = model(image_tensor)

# -----------------------------
# Display result
# -----------------------------

print()
print("==============================")
print("TIGER EMBEDDING")
print("==============================")

print("Image:", image_path)
print("Embedding shape:", embedding.shape)
print("Embedding values:", embedding[0][:10])

print("==============================")
print("Embedding generated!")