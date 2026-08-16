import torch
import pickle
import sys
from PIL import Image
from torchvision import transforms
import timm

DATABASE_FILE = "database/tiger_1_embeddings.pkl"

# Temporary prototype threshold.
# We will calibrate this after testing more tigers.
THRESHOLD = 0.70

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
# Preprocessing
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
# Get embedding
# -----------------------------

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


# -----------------------------
# Identify tiger
# -----------------------------

if len(sys.argv) < 2:

    print()
    print("Usage:")
    print("python scripts/identify_tiger_reid.py <image_path>")
    sys.exit()

image_path = sys.argv[1]

test_embedding = get_embedding(image_path)

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

# -----------------------------
# Result
# -----------------------------

print()
print("================================")
print("       TIGER RE-ID")
print("================================")

print("Input:", image_path)
print("Best reference:", best_image)
print("Similarity:", round(best_score, 4))

print()

if best_score >= THRESHOLD:

    print("RESULT: TIGER 1")
    print("MATCH: STRONG")

else:

    print("RESULT: UNKNOWN TIGER")
    print("MATCH: WEAK")

print("================================")