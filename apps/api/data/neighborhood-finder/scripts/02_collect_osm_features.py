from pathlib import Path
import json
import time
import requests
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "raw"
PROCESSED_DIR = BASE_DIR / "processed"
CACHE_DIR = BASE_DIR / "cache"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter",
]

RADIUS_METERS = 1200
SLEEP_BETWEEN_REQUESTS = 8
MAX_RETRIES = 4

OSM_GROUPS = {
    "schools": [
        ('amenity', 'school'),
        ('amenity', 'kindergarten'),
        ('amenity', 'university'),
        ('amenity', 'college'),
    ],
    "transport": [
        ('public_transport', 'station'),
        ('public_transport', 'stop_position'),
        ('railway', 'station'),
        ('railway', 'tram_stop'),
        ('highway', 'bus_stop'),
        ('amenity', 'bus_station'),
        ('station', 'subway'),
    ],
    "amenities": [
        ('amenity', 'restaurant'),
        ('amenity', 'cafe'),
        ('amenity', 'pharmacy'),
        ('amenity', 'bank'),
        ('amenity', 'clinic'),
        ('amenity', 'hospital'),
        ('shop', 'supermarket'),
        ('shop', 'mall'),
        ('leisure', 'park'),
        ('tourism', 'museum'),
    ],
}

def normalize_name(name: str) -> str:
    return (
        name.lower()
        .replace(" ", "_")
        .replace("ã", "a")
        .replace("ç", "c")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
    )

def build_query(lat: float, lng: float):
    parts = []

    for group_name, tags in OSM_GROUPS.items():
        for key, value in tags:
            parts.append(f'node["{key}"="{value}"](around:{RADIUS_METERS},{lat},{lng});')
            parts.append(f'way["{key}"="{value}"](around:{RADIUS_METERS},{lat},{lng});')
            parts.append(f'relation["{key}"="{value}"](around:{RADIUS_METERS},{lat},{lng});')

    return f"""
    [out:json][timeout:60];
    (
      {' '.join(parts)}
    );
    out center tags;
    """

def classify_element(element):
    tags = element.get("tags", {})

    for group_name, group_tags in OSM_GROUPS.items():
        for key, value in group_tags:
            if tags.get(key) == value:
                return group_name

    return None

def fetch_overpass(name: str, lat: float, lng: float):
    cache_file = CACHE_DIR / f"{normalize_name(name)}.json"

    if cache_file.exists():
        with open(cache_file, "r", encoding="utf-8") as f:
            return json.load(f)

    query = build_query(lat, lng)

    for endpoint in OVERPASS_ENDPOINTS:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                print(f"Trying {name} | endpoint={endpoint} | attempt={attempt}")

                response = requests.post(
                    endpoint,
                    data={"data": query},
                    timeout=90,
                    headers={
                        "User-Agent": "real-estate-lisbon-neighborhood-finder/1.0"
                    },
                )

                if response.status_code == 429:
                    wait = 30 * attempt
                    print(f"429 Too Many Requests. Waiting {wait}s...")
                    time.sleep(wait)
                    continue

                response.raise_for_status()

                payload = response.json()

                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)

                return payload

            except Exception as error:
                wait = 15 * attempt
                print(f"Error: {error}. Waiting {wait}s...")
                time.sleep(wait)

    print(f"FAILED completely for {name}")
    return {"elements": []}

def normalize_count_to_score(count: int, low: int, high: int):
    if count <= low:
        return 1.0
    if count >= high:
        return 5.0
    return round(1 + ((count - low) / (high - low)) * 4, 2)

def main():
    seed = pd.read_csv(RAW_DIR / "neighborhoods_seed.csv")
    rows = []

    for _, row in seed.iterrows():
        name = row["name"]
        lat = float(row["lat"])
        lng = float(row["lng"])

        print("=" * 70)
        print(f"Collecting OSM data for {name}")

        payload = fetch_overpass(name, lat, lng)
        elements = payload.get("elements", [])

        counts = {
            "schools_count": 0,
            "transport_count": 0,
            "amenities_count": 0,
        }

        for element in elements:
            group = classify_element(element)

            if group == "schools":
                counts["schools_count"] += 1
            elif group == "transport":
                counts["transport_count"] += 1
            elif group == "amenities":
                counts["amenities_count"] += 1

        rows.append({
            **row.to_dict(),
            **counts,
            "schools_score": normalize_count_to_score(counts["schools_count"], 1, 20),
            "transport_score": normalize_count_to_score(counts["transport_count"], 3, 60),
            "amenities_score": normalize_count_to_score(counts["amenities_count"], 5, 120),
        })

        print(
            f"{name}: schools={counts['schools_count']} | "
            f"transport={counts['transport_count']} | "
            f"amenities={counts['amenities_count']}"
        )

        time.sleep(SLEEP_BETWEEN_REQUESTS)

    df = pd.DataFrame(rows)
    output = PROCESSED_DIR / "osm_features.csv"
    df.to_csv(output, index=False, encoding="utf-8")

    print("=" * 70)
    print("Created:", output)

if __name__ == "__main__":
    main()