import os
import csv
import zipfile

def create_ai_generated_demo_batch():
    base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw_pench_batch")
    images_dir = os.path.join(base_dir, "images")
    os.makedirs(images_dir, exist_ok=True)

    labels_csv_path = os.path.join(base_dir, "labels.csv")
    stations_csv_path = os.path.join(base_dir, "stations.csv")

    # 1. Write labels.csv with explicit source column
    labels_data = [
        {"filename": "GEN_0001.jpg", "confirmed_tiger_id": "SYN-T01", "side": "left", "source": "ai_generated"},
        {"filename": "GEN_0002.jpg", "confirmed_tiger_id": "SYN-T02", "side": "right", "source": "ai_generated"},
        {"filename": "GEN_0003.jpg", "confirmed_tiger_id": "SYN-T03", "side": "left", "source": "ai_generated"},
        {"filename": "GEN_0004.jpg", "confirmed_tiger_id": "BLANK", "side": "none", "source": "ai_generated"},
        {"filename": "GEN_0005.jpg", "confirmed_tiger_id": "SYN-T04", "side": "right", "source": "ai_generated"},
    ]

    with open(labels_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["filename", "confirmed_tiger_id", "side", "source"])
        writer.writeheader()
        writer.writerows(labels_data)

    # 2. Write stations.csv (2 km² Pench grid synthetic coordinates)
    stations_data = [
        {"station_id": "ST-01", "name": "Sitaghat Core Grid 01", "latitude": 21.6740, "longitude": 79.3056, "zone": "Core"},
        {"station_id": "ST-02", "name": "Karmajhiri Stream Grid", "latitude": 21.6820, "longitude": 79.3120, "zone": "Core"},
        {"station_id": "ST-07", "name": "Pyorthadi Buffer Grid", "latitude": 21.6500, "longitude": 79.2800, "zone": "Buffer"},
        {"station_id": "ST-09", "name": "Turiya Gate Buffer Grid", "latitude": 21.6200, "longitude": 79.2500, "zone": "Village-Adjacent"},
    ]

    with open(stations_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["station_id", "name", "latitude", "longitude", "zone"])
        writer.writeheader()
        writer.writerows(stations_data)

    print(f"[OK] Generated AI manifest labels.csv at: {labels_csv_path}")
    print(f"[OK] Generated stations.csv at: {stations_csv_path}")

    # 3. Create zip archive
    zip_path = os.path.join(base_dir, "ai_demo_dataset_pack.zip")
    with zipfile.ZipFile(zip_path, "w") as z:
        z.write(labels_csv_path, "labels.csv")
        z.write(stations_csv_path, "stations.csv")

    print(f"[OK] Created demo dataset ZIP package at: {zip_path}")

if __name__ == "__main__":
    create_ai_generated_demo_batch()
