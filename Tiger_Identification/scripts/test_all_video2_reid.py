import torch
import pickle
import os
from PIL import Image
from torchvision import transforms
import timm

DATABASE_FILE = "database/tiger_1_embeddings.pkl"
INPUT_FOLDER = "tiger_crops_video2"

# -----------------------------
# Load database
# -----------------------------

with open(DATABASE_FILE, "rb") as f:
    database = pickle.load(f)

# -----------------------------
# Load model
# -----------------------------

print("Loading model...")

model = timm.create_model(
    "resnet50",
    pretrained=True,
    num_classes=0
)

model.eval()

print("Model loaded!")

# -----------------------------
# Transform
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
# Embedding function
# -----------------------------

def get_embedding(image_path):

    image = Image.open(image_path).convert("RGB")

    tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        embedding = model(tensor)

    embedding = torch.nn.functional.normalize(
        embedding,
        p=2,
        dim=1
    )

    return embedding.squeeze(0)


# -----------------------------
# Test all images
# -----------------------------

scores = []

files = sorted(os.listdir(INPUT_FOLDER))

for i, filename in enumerate(files):

    if not filename.lower().endswith(".jpg"):
        continue

    image_path = os.path.join(
        INPUT_FOLDER,
        filename
    )

    test_embedding = get_embedding(image_path)

    best_score = -1

    for database_embedding in database.values():

        score = torch.dot(
            test_embedding,
            database_embedding
        ).item()

        if score > best_score:
            best_score = score

    scores.append(best_score)

    print(
        f"{filename} → {best_score:.4f}"
    )

# -----------------------------
# Summary
# -----------------------------

print()
print("======================================")
print("VIDEO 2 RE-ID SUMMARY")
print("======================================")

if scores:

    print("Number of tested images:", len(scores))
    print("Highest similarity:", round(max(scores), 4))
    print("Lowest similarity:", round(min(scores), 4))
    print("Average similarity:", round(sum(scores) / len(scores), 4))

print("======================================")