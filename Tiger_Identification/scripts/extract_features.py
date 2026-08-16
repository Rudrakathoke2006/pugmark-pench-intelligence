import cv2
import os
import pickle

# Folder containing Tiger 1 images
input_folder = "database/tiger_1"

# Where we will save Tiger 1's visual signature
output_file = "database/tiger_1_features.pkl"

# Create SIFT
sift = cv2.SIFT_create()

all_descriptors = []

# Go through every image
for filename in os.listdir(input_folder):

    if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
        continue

    image_path = os.path.join(input_folder, filename)

    image = cv2.imread(image_path)

    if image is None:
        print("Could not read:", filename)
        continue

    # Convert image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Find SIFT features
    keypoints, descriptors = sift.detectAndCompute(gray, None)

    if descriptors is not None:
        all_descriptors.append(descriptors)

        print(
            filename,
            "→",
            len(keypoints),
            "features found"
        )
    else:
        print(
            filename,
            "→ No features found"
        )

# Save all descriptors
with open(output_file, "wb") as f:
    pickle.dump(all_descriptors, f)

print()
print("================================")
print("Tiger 1 feature extraction done!")
print("Feature file saved to:")
print(output_file)
print("================================")