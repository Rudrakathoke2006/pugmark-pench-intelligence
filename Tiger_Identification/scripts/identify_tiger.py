import cv2
import pickle
import sys

# --------------------------------
# SETTINGS
# --------------------------------

DATABASE_FILE = "database/tiger_1_features.pkl"

# Based on our current experiments:
# Tiger 1: 177–281
# Video 2: 0–95
THRESHOLD = 120

# --------------------------------
# Check input image
# --------------------------------

if len(sys.argv) < 2:
    print("Usage:")
    print("python scripts/identify_tiger.py <image_path>")
    sys.exit()

test_image_path = sys.argv[1]

# --------------------------------
# Load Tiger 1 database
# --------------------------------

with open(DATABASE_FILE, "rb") as f:
    tiger1_descriptors = pickle.load(f)

# --------------------------------
# Read image
# --------------------------------

image = cv2.imread(test_image_path)

if image is None:
    print("ERROR: Could not read image")
    sys.exit()

gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# --------------------------------
# Extract SIFT features
# --------------------------------

sift = cv2.SIFT_create()

keypoints, test_descriptors = sift.detectAndCompute(
    gray,
    None
)

if test_descriptors is None:
    print("ERROR: No features found")
    sys.exit()

# --------------------------------
# Compare with Tiger 1
# --------------------------------

matcher = cv2.BFMatcher()

best_score = 0

for database_descriptors in tiger1_descriptors:

    if database_descriptors is None:
        continue

    matches = matcher.knnMatch(
        test_descriptors,
        database_descriptors,
        k=2
    )

    good_matches = []

    for pair in matches:

        if len(pair) == 2:

            m, n = pair

            if m.distance < 0.75 * n.distance:
                good_matches.append(m)

    score = len(good_matches)

    if score > best_score:
        best_score = score

# --------------------------------
# Final identification
# --------------------------------

print()
print("================================")
print("      TIGER IDENTIFICATION")
print("================================")

print("Image:", test_image_path)
print("Features:", len(keypoints))
print("Best match score:", best_score)

print()

if best_score >= THRESHOLD:

    print("RESULT: TIGER 1")
    print("Confidence: STRONG MATCH")

else:

    print("RESULT: UNKNOWN TIGER")
    print("Confidence: WEAK MATCH")

print("================================")