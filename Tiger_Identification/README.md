# Tiger Identification & Re-Identification System

## Project Overview

This project is a Computer Vision prototype for identifying individual tigers from video footage.

The main idea is:

Video → Frames → Tiger Detection → Tiger Crops → Feature/Embedding Extraction → Tiger Database → Tiger Identification

The current prototype contains two registered tiger identities:

- Tiger 1
- Tiger 2

The next goal is to extend this system to real-time tiger identification and tracking.

---

## Current Pipeline

```text
Tiger Video
     ↓
Frame Extraction
     ↓
Tiger Detection
     ↓
Tiger Cropping
     ↓
Feature Extraction
     ↓
Deep Visual Embeddings
     ↓
Tiger Database
     ↓
Similarity Comparison
     ↓
Tiger Identification




Technologies Used
Python
OpenCV
Ultralytics YOLO
PyTorch
TIMM
ResNet50
SIFT
Image Embeddings
Cosine Similarity
Project Structure
Tiger_Identification/
│
├── frames/
│   └── Extracted frames from video
│
├── tiger_crops/
│   └── Tiger 1 detected/cropped images
│
├── tiger_crops_video2/
│   └── Tiger 2 detected/cropped images
│
├── database/
│   ├── tiger_1/
│   ├── tiger_1_features.pkl
│   ├── tiger_1_embeddings.pkl
│   └── tiger_2_embeddings.pkl
│
├── scripts/
│   ├── extract_frames.py
│   ├── detect_tiger.py
│   ├── extract_features.py
│   ├── match_tiger.py
│   ├── identify_tiger.py
│   ├── test_embedding.py
│   ├── create_embedding_database.py
│   ├── identify_tiger_reid.py
│   ├── create_tiger2_embedding_database.py
│   ├── identify_tiger_multi.py
│   └── test_tiger2_unseen.py
│
└── README.md


1. Video to Frame Extraction

The first step was converting the collected MP4 tiger videos into individual image frames.

Example:

python scripts/extract_frames.py

The extracted frames are stored in:

frames/

For the second video, a separate frame extraction script was used.

2. Tiger Detection

YOLO was used to detect animals in the extracted frames.

Command:

python scripts/detect_tiger.py

The YOLO model is downloaded automatically on the first run.

The detected/cropped tiger images are stored separately for further processing.

Important Note

The standard YOLO model is a general object detection model and does not have a dedicated "tiger" class. In some frames it may classify a tiger as another visually similar animal such as a zebra or may produce no detection.

Therefore, the detected crops were manually checked and the useful tiger crops were retained.

For a final system, a tiger-specific detection model should be trained/fine-tuned.

3. Tiger Crop Dataset

The detected tiger regions are stored as cropped images.

Tiger 1:

tiger_crops/

Tiger 2:

tiger_crops_video2/

These cropped images are used as the input for individual tiger identification.

4. Initial SIFT Feature Matching

An initial approach was implemented using SIFT image features.

Command:

python scripts/extract_features.py

This generated:

database/tiger_1_features.pkl

The initial matching system can be tested using:

python scripts/match_tiger.py

This successfully demonstrated that similar visual patterns could be matched between tiger images.

However, SIFT matching alone was not considered sufficient for robust individual tiger Re-ID.

5. Deep Learning Based Tiger Embeddings

A stronger approach was then implemented using ResNet50.

Each tiger crop is converted into a 2048-dimensional visual embedding.

Example:

Embedding shape: torch.Size([1, 2048])

The embedding represents visual characteristics of the tiger and can be compared with embeddings stored in the tiger database.

6. Tiger 1 Database

Tiger 1 reference embeddings were generated using:

python scripts/create_embedding_database.py

Output:

database/tiger_1_embeddings.pkl

Current Tiger 1 reference images:

15 images
7. Tiger 2 Database

Tiger 2 reference embeddings were generated using:

python scripts/create_tiger2_embedding_database.py

Output:

database/tiger_2_embeddings.pkl

Current Tiger 2 reference images:

363 images
8. Multi-Tiger Identification

The current system can compare a new tiger image against both Tiger 1 and Tiger 2 databases.

Command:

python scripts/identify_tiger_multi.py <image_path>

Example:

python scripts/identify_tiger_multi.py tiger_crops/frame_00023.jpg

Example result:

Tiger 1 best similarity: 0.9284
Tiger 2 best similarity: 0.8354


RESULT: TIGER 1

Another test using a Tiger 2 image:

Tiger 1 best similarity: 0.3767
Tiger 2 best similarity: 1.0


RESULT: TIGER 2

The 1.0 result occurs when the tested image itself exists in the Tiger 2 database, so it should not be considered a proper unseen-image validation.

9. Unseen Tiger 2 Validation

An unseen Tiger 2 image was tested against both databases.

Test:

python scripts/test_tiger2_unseen.py

Result:

Tiger 1 similarity: 0.8554
Tiger 2 similarity: 0.9793


RESULT: TIGER 2

The best Tiger 2 reference was:

frame_00099.jpg

while the test image was:

frame_00100.jpg

Therefore, the test image was compared against a different reference image.

This provides an initial proof-of-concept that the embedding-based system can identify an unseen frame of the same tiger.

Current Results
Tiger 1

Number of reference images:

15

Re-ID similarity results:

Highest similarity: 0.9578
Lowest similarity: 0.8124
Average similarity: 0.8934
Tiger 2

Number of reference images:

363

Video 2 Re-ID results:

Number of tested images: 363
Highest similarity: 0.8856
Lowest similarity: 0.2091
Average similarity: 0.7063

An unseen Tiger 2 image produced:

Tiger 1 similarity: 0.8554
Tiger 2 similarity: 0.9793


RESULT: TIGER 2
Important Limitations

The current system is a Proof of Concept and should not yet be considered a production-ready tiger identification system.

The current ResNet50 model is a general-purpose visual feature extractor and has not been specifically trained for individual tiger re-identification.

Therefore:

Similarity scores between different tigers can sometimes be high.
A final identification threshold has not yet been scientifically calibrated.
More tiger identities are required.
More images per tiger are required.
Images from different angles, distances, lighting conditions and poses should be included.
Testing on completely unseen videos is required.
A tiger-specific Re-ID model would improve accuracy.
What Has Been Completed
 MP4 video to image frame extraction
 Tiger detection
 Tiger crop extraction
 Tiger 1 dataset preparation
 Tiger 2 dataset preparation
 SIFT feature extraction
 SIFT matching prototype
 ResNet50 embedding generation
 Tiger 1 embedding database
 Tiger 2 embedding database
 Multi-tiger identification
 Unseen Tiger 2 validation
Next Steps

The next team member should continue from the current multi-tiger Re-ID system.

1. Improve Tiger Detection

Train or fine-tune a tiger-specific YOLO/object detection model so that the system reliably detects tigers instead of relying on general animal classes.

2. Improve Individual Tiger Re-ID

Develop a tiger-specific Re-ID model using approaches such as:

Siamese Networks
Triplet Networks
Metric Learning
Fine-tuned CNN/Transformer models

The model should learn the unique stripe patterns and other visual characteristics of individual tigers.

3. Add More Tigers

Expand the database:

Tiger 1
Tiger 2
Tiger 3
Tiger 4
Tiger 5
...

Each tiger should have multiple reference images.

4. Calibrate the Similarity Threshold

Instead of selecting an arbitrary threshold, create:

Same Tiger Pairs
Different Tiger Pairs

and analyze their similarity distributions.

This will allow the team to determine a more reliable threshold for:

MATCH
UNKNOWN TIGER
5. Real-Time Tiger Tracking

The final system should process a live video/camera feed:

Live Video
    ↓
Tiger Detection
    ↓
Tiger Tracking
    ↓
Tiger Re-ID
    ↓
Persistent Tiger ID

For example:

Frame 1 → Tiger 1
Frame 2 → Tiger 1
Frame 3 → Tiger 1
Frame 4 → Tiger 1

Even though the tiger moves between frames, the system should maintain the same identity.

6. Multi-Object Tracking

Possible tracking algorithms:

ByteTrack
BoT-SORT
DeepSORT

These can be integrated with the Re-ID system to maintain identities across consecutive frames.

7. Final Application / Dashboard

The final hackathon application can display:

Live video feed
Detected tiger
Tiger ID
Similarity/confidence
Timestamp
Camera/location
Detection history
Movement/track history
Final Goal

The intended final architecture is:

Camera / Uploaded Video
          ↓
   Tiger Detection
          ↓
   Tiger Tracking
          ↓
 Tiger Stripe / Re-ID
          ↓
   Tiger Database
          ↓
  Individual Tiger ID
          ↓
 Location + Timestamp
          ↓
    Tracking Dashboard