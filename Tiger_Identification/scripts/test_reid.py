import torch
import pickle
import os
from PIL import Image
from torchvision import transforms
import timm

# --------------------------------
# Files
# --------------------------------

database_file = "database/tiger_1_embeddings.pkl"

# --------------------------------
# Load database
# --------------------------------

with open(database_file, "rb") as f:
    database = pickle.load(f)

# --------------------------------
# Load model
# --------------------------------

print("Loading model...")

model = timm.create_model(
    "resnet50",
    pretrained=True,
    num_classes=0
)

model.eval()

print("Model loaded!")

# --------------------------------
# Image preprocessing
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
# Function to get embedding
# --------------------------------

def get_embedding(image_path):

    image = Image.open(image_path).convert("RGB")

    tensor = transform(image)
    tensor = tensor.unsqueeze(0)

    with torch.no_grad():
        embedding = model(tensor)

    embedding = torch.nn.functional.normalize(
        embedding,
        p=2,
        dim=1
    )

    return embedding.squeeze(0)


# --------------------------------
# Function to compare image
# --------------------------------

def compare_image(image_path):

    test_embedding = get_embedding(image_path)

    similarities = []

    for filename, database_embedding in database.items():

        similarity = torch.dot(
            test_embedding,
            database_embedding
        ).item()

        similarities.append(
            (filename, similarity)
        )

    similarities.sort(
        key=lambda x: x[1],
        reverse=True
    )

    return similarities


# --------------------------------
# Test Tiger 1
# --------------------------------

print()
print("================================")
print("TEST 1 — TIGER 1")
print("================================")

tiger1_test = "tiger_crops/frame_00023.jpg"

results = compare_image(tiger1_test)

for filename, score in results[:5]:

    print(
        filename,
        "→",
        round(score, 4)
    )

print()
print("Best Tiger 1 similarity:",
      round(results[0][1], 4))


# --------------------------------
# Test Video 2
# --------------------------------

print()
print("================================")
print("TEST 2 — VIDEO 2")
print("================================")

video2_folder = "tiger_crops_video2"

files = sorted(os.listdir(video2_folder))

count = 0

for filename in files:

    if not filename.lower().endswith(".jpg"):
        continue

    image_path = os.path.join(
        video2_folder,
        filename
    )

    results = compare_image(image_path)

    best_score = results[0][1]

    print(
        filename,
        "→",
        round(best_score, 4)
    )

    count += 1

    # Test first 20 images for now
    if count >= 20:
        break

print()
print("================================")
print("Re-ID test completed!")
print("================================")