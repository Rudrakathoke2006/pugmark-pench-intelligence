import torch
import timm
import os
import pickle
from PIL import Image
from torchvision import transforms

# --------------------------------
# Settings
# --------------------------------

input_folder = "tiger_crops_video2"
output_file = "database/tiger_2_embeddings.pkl"

# --------------------------------
# Load model
# --------------------------------

print("Loading ResNet50...")

model = timm.create_model(
    "resnet50",
    pretrained=True,
    num_classes=0
)

model.eval()

print("Model loaded!")

# --------------------------------
# Image transformation
# --------------------------------

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# --------------------------------
# Generate embeddings
# --------------------------------

database = {}

files = sorted(os.listdir(input_folder))

for filename in files:

    if not filename.lower().endswith(".jpg"):
        continue

    image_path = os.path.join(
        input_folder,
        filename
    )

    try:

        image = Image.open(image_path).convert("RGB")

        image_tensor = transform(image)
        image_tensor = image_tensor.unsqueeze(0)

        with torch.no_grad():

            embedding = model(image_tensor)

        embedding = torch.nn.functional.normalize(
            embedding,
            p=2,
            dim=1
        )

        database[filename] = embedding.squeeze(0)

        print(
            filename,
            "→ embedding generated"
        )

    except Exception as e:

        print(
            filename,
            "→ ERROR:",
            e
        )

# --------------------------------
# Save database
# --------------------------------

os.makedirs("database", exist_ok=True)

with open(output_file, "wb") as f:

    pickle.dump(
        database,
        f
    )

print()
print("================================")
print("Tiger 2 embedding database")
print("================================")
print("Images:", len(database))
print("Embedding size: 2048")
print("Saved to:", output_file)
print("================================")