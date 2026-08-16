import cv2
import pickle
import os

# -----------------------------
# Files
# -----------------------------

database_file = "database/tiger_1_features.pkl"
input_folder = "tiger_crops_video2"

# -----------------------------
# Load Tiger 1 database
# -----------------------------

with open(database_file, "rb") as f:
    tiger1_descriptors = pickle.load(f)

# -----------------------------
# Create SIFT
# -----------------------------

sift = cv2.SIFT_create()

matcher = cv2.BFMatcher()

# -----------------------------
# Test every Video 2 crop
# -----------------------------

results = []

for filename in sorted(os.listdir(input_folder)):

    if not filename.lower().endswith(".jpg"):
        continue

    image_path = os.path.join(input_folder, filename)

    image = cv2.imread(image_path)

    if image is None:
        continue

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    keypoints, test_descriptors = sift.detectAndCompute(
        gray,
        None
    )

    if test_descriptors is None:
        continue

    total_good_matches = 0

    for database_descriptors in tiger1_descriptors:

        if database_descriptors is None:
            continue

        matches = matcher.knnMatch(
            test_descriptors,
            database_descriptors,
            k=2
        )

        for pair in matches:

            if len(pair) == 2:

                m, n = pair

                if m.distance < 0.75 * n.distance:
                    total_good_matches += 1

    results.append((filename, total_good_matches))

# -----------------------------
# Display results
# -----------------------------

print()
print("======================================")
print("VIDEO 2 vs TIGER 1")
print("======================================")

for filename, matches in results:
    print(f"{filename} → {matches} good matches")

# -----------------------------
# Summary
# -----------------------------

if results:

    scores = [matches for _, matches in results]

    print()
    print("======================================")
    print("SUMMARY")
    print("======================================")
    print("Number of tested images:", len(scores))
    print("Highest matches:", max(scores))
    print("Lowest matches:", min(scores))
    print("Average matches:", round(sum(scores) / len(scores), 2))
    print("======================================")