import torch
import pickle
import sys
from PIL import Image
from torchvision import transforms
import timm

TIGER1_DB = "database/tiger_1_embeddings.pkl"
TIGER2_DB = "database/tiger_2_embeddings.pkl"

with open(TIGER1_DB, "rb") as f:
    tiger1_database = pickle.load(f)

with open(TIGER2_DB, "rb") as f:
    tiger2_database = pickle.load(f)

print("Loading model...")

model = timm.create_model(
    "resnet50",
    pretrained=True,
    num_classes=0
)

model.eval()

print("Model loaded!")

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


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


def best_match(test_embedding, database, exclude=None):

    best_score = -1
    best_image = None

    for filename, embedding in database.items():

        if filename == exclude:
            continue

        score = torch.dot(
            test_embedding,
            embedding
        ).item()

        if score > best_score:

            best_score = score
            best_image = filename

    return best_score, best_image


# --------------------------------
# Test an unseen Tiger 2 image
# --------------------------------

test_image = "tiger_crops_video2/frame_00100.jpg"

test_filename = "frame_00100.jpg"

embedding = get_embedding(test_image)

tiger1_score, tiger1_match = best_match(
    embedding,
    tiger1_database
)

tiger2_score, tiger2_match = best_match(
    embedding,
    tiger2_database,
    exclude=test_filename
)

print()
print("================================")
print(" TIGER 2 UNSEEN IMAGE TEST")
print("================================")

print("Test image:", test_image)

print()
print("Tiger 1 similarity:",
      round(tiger1_score, 4))

print("Tiger 2 similarity:",
      round(tiger2_score, 4))

print()
print("Tiger 1 best reference:",
      tiger1_match)

print("Tiger 2 best reference:",
      tiger2_match)

print()

if tiger2_score > tiger1_score:

    print("RESULT: TIGER 2")

else:

    print("RESULT: TIGER 1")

print("================================")