from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

neighborhoods = [
    {"name": "Parque das Nações", "zone": "Lisbon East", "lat": 38.7676, "lng": -9.0940},
    {"name": "Avenidas Novas", "zone": "Central Lisbon", "lat": 38.7380, "lng": -9.1500},
    {"name": "Campo de Ourique", "zone": "Central Lisbon", "lat": 38.7172, "lng": -9.1662},
    {"name": "Alfama", "zone": "Historic Lisbon", "lat": 38.7115, "lng": -9.1300},
    {"name": "Belém", "zone": "Lisbon West", "lat": 38.6968, "lng": -9.2065},
    {"name": "Marvila", "zone": "Lisbon East", "lat": 38.7450, "lng": -9.1050},
    {"name": "Príncipe Real", "zone": "Central Lisbon", "lat": 38.7167, "lng": -9.1487},
    {"name": "Estrela", "zone": "Central Lisbon", "lat": 38.7139, "lng": -9.1594},
    {"name": "Alvalade", "zone": "Central Lisbon", "lat": 38.7533, "lng": -9.1436},
    {"name": "Benfica", "zone": "Lisbon North", "lat": 38.7506, "lng": -9.2024},
    {"name": "Lumiar", "zone": "Lisbon North", "lat": 38.7710, "lng": -9.1590},
    {"name": "Arroios", "zone": "Central Lisbon", "lat": 38.7276, "lng": -9.1353},
    {"name": "Graça", "zone": "Historic Lisbon", "lat": 38.7188, "lng": -9.1290},
    {"name": "Oeiras", "zone": "Greater Lisbon West", "lat": 38.6970, "lng": -9.3017},
    {"name": "Cascais", "zone": "Greater Lisbon Coast", "lat": 38.6968, "lng": -9.4215},
    {"name": "Sintra", "zone": "Greater Lisbon North-West", "lat": 38.8029, "lng": -9.3817},
    {"name": "Amadora", "zone": "Greater Lisbon North-West", "lat": 38.7597, "lng": -9.2397},
    {"name": "Loures", "zone": "Greater Lisbon North", "lat": 38.8309, "lng": -9.1685},
]

df = pd.DataFrame(neighborhoods)
df.to_csv(RAW_DIR / "neighborhoods_seed.csv", index=False, encoding="utf-8")
print("Created:", RAW_DIR / "neighborhoods_seed.csv")