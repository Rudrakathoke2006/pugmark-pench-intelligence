import os
import sys
import time
import random
import argparse
try:
    import requests
except ImportError:
    import urllib.request
    import json
    requests = None

SYNTHETIC_STATIONS = ["ST-01", "ST-02", "ST-07", "ST-09", "ST-12"]

def run_realtime_simulation(image_dir: str, server_url: str = "http://127.0.0.1:8000", interval_sec: float = 1.5):
    print("=" * 70)
    print(" PUGMARK REAL-TIME CAMERA-TRAP FEED SIMULATOR")
    print(" Mode: SIMULATED REAL-TIME FEED -- Compressed Timing, Real Images, Synthetic Stations")
    print(" Target Stream Endpoint:", f"{server_url}/api/ingest/stream")
    print("=" * 70)

    # Discover images
    image_files = []
    if os.path.exists(image_dir):
        for root, _, files in os.walk(image_dir):
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    image_files.append(os.path.join(root, f))

    if not image_files:
        print(f"\n[!] Directory '{image_dir}' has no JPG images. Using static crops directory fallback...")
        static_crops = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "static", "frames"))
        if os.path.exists(static_crops):
            for root, _, files in os.walk(static_crops):
                for f in files:
                    if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                        image_files.append(os.path.join(root, f))

    if not image_files:
        print("[X] No image files found to simulate feed. Please provide a directory containing images.")
        return

    print(f"\n[+] Discovered {len(image_files)} field frames for streaming simulation.")
    print(f"[+] Drip Rate: 1 frame every {interval_sec} seconds. Press CTRL+C to stop.\n")

    count = 0
    try:
        for img_path in image_files:
            count += 1
            station_id = random.choice(SYNTHETIC_STATIONS)
            fname = os.path.basename(img_path)
            now_str = time.strftime("%H:%M:%S")

            print(f"[{now_str}] [STREAM] Frame #{count:03d}: '{fname}' -> Station {station_id}...", end=" ", flush=True)

            start_t = time.time()
            if requests:
                with open(img_path, 'rb') as f:
                    files = {'file': (fname, f, 'image/jpeg')}
                    data = {'station_id': station_id, 'survey_cycle': '2026-Monsoon-Cycle-04'}
                    try:
                        resp = requests.post(f"{server_url}/api/ingest/stream", files=files, data=data, timeout=10)
                        elapsed = time.time() - start_t
                        if resp.status_code == 200:
                            res = resp.json()
                            decision = res.get('triage_decision', 'KEEP')
                            tiger_id = res.get('reid', {}).get('best_tiger_id', 'N/A')
                            conf = res.get('animal_confidence', 0.95)
                            print(f"[OK] ({elapsed:.2f}s) | Triage: {decision} ({conf*100:.1f}%) | Re-ID: {tiger_id}")
                        else:
                            print(f"[ERR] Error {resp.status_code}")
                    except Exception as err:
                        print(f"[ERR] Connection Error: {err}")
            
            time.sleep(interval_sec)

    except KeyboardInterrupt:
        print("\n\n[!] Simulation stopped by user. Stream disconnected.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Real-time Camera Trap Feed Simulator")
    parser.add_argument("image_dir", nargs="?", default="backend/static/frames", help="Path to image folder")
    parser.add_argument("--url", default="http://127.0.0.1:8000", help="FastAPI Server URL")
    parser.add_argument("--interval", type=float, default=1.5, help="Interval between frames in seconds")
    args = parser.parse_args()

    run_realtime_simulation(args.image_dir, args.url, args.interval)
