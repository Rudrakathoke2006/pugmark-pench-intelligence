import torch
import pickle

DATABASE_FILE = "database/tiger_1_embeddings.pkl"

# --------------------------------
# Load Tiger 1 database
# --------------------------------

with open(DATABASE_FILE, "rb") as f:
    database = pickle.load(f)

print("Testing Tiger 1 against Tiger 1")
print("================================")

scores = []

# --------------------------------
# Leave-one-out comparison
# --------------------------------

for test_name, test_embedding in database.items():

    best_score = -1
    best_match = None

    for reference_name, reference_embedding in database.items():

        # Don't compare image with itself
        if test_name == reference_name:
            continue

        score = torch.dot(
            test_embedding,
            reference_embedding
        ).item()

        if score > best_score:
            best_score = score
            best_match = reference_name

    scores.append(best_score)

    print(
        test_name,
        "→",
        best_match,
        "→",
        round(best_score, 4)
    )

# --------------------------------
# Summary
# --------------------------------

print()
print("======================================")
print("TIGER 1 RE-ID SUMMARY")
print("======================================")

print("Number of tested images:", len(scores))
print("Highest similarity:", round(max(scores), 4))
print("Lowest similarity:", round(min(scores), 4))
print("Average similarity:", round(sum(scores) / len(scores), 4))

print("======================================")