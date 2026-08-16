import cv2
import pickle

# -----------------------------
# Files
# -----------------------------

test_image_path = "tiger_crops/frame_00027.jpg"
database_file = "database/tiger_1_features.pkl"

# -----------------------------
# Load Tiger 1 features
# -----------------------------

with open(database_file, "rb") as f:
    tiger1_descriptors = pickle.load(f)

# -----------------------------
# Create SIFT
# -----------------------------

sift = cv2.SIFT_create()

# -----------------------------
# Read test image
# -----------------------------

image = cv2.imread(test_image_path)

if image is None:
    print("Could not read test image")
    exit()

gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

keypoints, test_descriptors = sift.detectAndCompute(
    gray,
    None
)

print("Test image features:", len(keypoints))

# -----------------------------
# Compare features
# -----------------------------

matcher = cv2.BFMatcher()

total_good_matches = 0

for database_descriptors in tiger1_descriptors:

    if database_descriptors is None or test_descriptors is None:
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

    total_good_matches += len(good_matches)

# -----------------------------
# Result
# -----------------------------

print()
print("==============================")
print("Tiger 1 matching test")
print("==============================")
print("Good matches:", total_good_matches)

if total_good_matches >= 20:
    print("RESULT: TIGER 1 MATCH")
else:
    print("RESULT: UNKNOWN TIGER")

print("==============================")