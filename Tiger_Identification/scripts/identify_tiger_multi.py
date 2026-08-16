import torch
import pickle
import sys
from PIL import Image
from torchvision import transforms
import timm

# --------------------------------
# Database files
# --------------------------------

TIGER1_DB = "database/tiger_1_embeddings.pkl"
TIGER2_DB = "database/tiger_2_embeddings.pkl"

# Temporary threshold
THRESHOLD = 0.70

# --------------------------------
# Load databases
# --------------------------------

with open(TIGER1_DB, "rb") as f:
    tiger1_database = pickle.load(f)

with open(TIGER2_DB, "rb") as f:
    tiger2_database = pickle.load(f)

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
# Get embedding
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
# Compare with database
# --------------------------------

def best_match(test_embedding, database):

    best_score = -1
    best_image = None

    for filename, database_embedding in database.items():

        score = torch.dot(
            test_embedding,
            database_embedding
        ).item()

        if score > best_score:

            best_score = score
            best_image = filename

    return best_score, best_image


# --------------------------------
# Input image
# --------------------------------

if len(sys.argv) < 2:

    print()
    print("Usage:")
    print("python scripts/identify_tiger_multi.py <image_path>")
    sys.exit()

image_path = sys.argv[1]

# --------------------------------
# Generate embedding
# --------------------------------

test_embedding = get_embedding(image_path)

# --------------------------------
# Compare with both tigers
# --------------------------------

tiger1_score, tiger1_image = best_match(
    test_embedding,
    tiger1_database
)

tiger2_score, tiger2_image = best_match(
    test_embedding,
    tiger2_database
)

# --------------------------------
# Display scores
# --------------------------------

print()
print("================================")
print("      TIGER IDENTIFICATION")
print("================================")

print("Input:", image_path)

print()
print("Tiger 1 best similarity:",
      round(tiger1_score, 4))

print("Tiger 2 best similarity:",
      round(tiger2_score, 4))

print()

# --------------------------------
# Determine result
# --------------------------------

if tiger1_score < THRESHOLD and tiger2_score < THRESHOLD:

    result = "UNKNOWN TIGER"

elif tiger1_score > tiger2_score:

    result = "TIGER 1"

else:

    result = "TIGER 2"

# --------------------------------
# Final result
# --------------------------------

print("RESULT:", result)

print("================================")