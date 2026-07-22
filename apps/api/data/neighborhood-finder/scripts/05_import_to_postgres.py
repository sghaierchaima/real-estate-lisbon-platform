from pathlib import Path
import os
import ast
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = Path(__file__).resolve().parents[1]
PROCESSED_DIR = DATA_DIR / "processed"

load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

def clean_database_url(url: str) -> str:
    parsed = urlparse(url)
    query = parse_qs(parsed.query)

    query.pop("schema", None)

    clean_query = urlencode(query, doseq=True)

    return urlunparse(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            clean_query,
            parsed.fragment,
        )
    )

if DATABASE_URL:
    DATABASE_URL = clean_database_url(DATABASE_URL)

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in apps/api/.env")

def parse_list(value):
    if isinstance(value, list):
        return value

    if pd.isna(value):
        return []

    try:
        parsed = ast.literal_eval(str(value))
        return parsed if isinstance(parsed, list) else [str(value)]
    except Exception:
        return [str(value)]

def main():
    csv_path = PROCESSED_DIR / "neighborhood_dataset_final.csv"

    if not csv_path.exists():
        raise FileNotFoundError(f"Missing file: {csv_path}")

    df = pd.read_csv(csv_path)
    engine = create_engine(DATABASE_URL)

    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(
                text("""
                    insert into "Neighborhood" (
                      id,
                      name,
                      zone,
                      description,
                      tags,
                      highlights,
                      "avgPrice",
                      "pricePerSqm",
                      "rentYield",
                      "growthPercent",
                      "schoolsCount",
                      "transportCount",
                      "amenitiesCount",
                      "schoolsScore",
                      "transportScore",
                      "amenitiesScore",
                      "safetyScore",
                      "aiScore",
                      "aiSummary",
                      icon,
                      latitude,
                      longitude,
                      "sourceNotes",
                      "createdAt",
                      "updatedAt"
                    )
                    values (
                      gen_random_uuid(),
                      :name,
                      :zone,
                      :description,
                      :tags,
                      :highlights,
                      :avgPrice,
                      :pricePerSqm,
                      :rentYield,
                      :growthPercent,
                      :schoolsCount,
                      :transportCount,
                      :amenitiesCount,
                      :schoolsScore,
                      :transportScore,
                      :amenitiesScore,
                      :safetyScore,
                      :aiScore,
                      :aiSummary,
                      :icon,
                      :latitude,
                      :longitude,
                      :sourceNotes,
                      now(),
                      now()
                    )
                    on conflict (name) do update set
                      zone = excluded.zone,
                      description = excluded.description,
                      tags = excluded.tags,
                      highlights = excluded.highlights,
                      "avgPrice" = excluded."avgPrice",
                      "pricePerSqm" = excluded."pricePerSqm",
                      "rentYield" = excluded."rentYield",
                      "growthPercent" = excluded."growthPercent",
                      "schoolsCount" = excluded."schoolsCount",
                      "transportCount" = excluded."transportCount",
                      "amenitiesCount" = excluded."amenitiesCount",
                      "schoolsScore" = excluded."schoolsScore",
                      "transportScore" = excluded."transportScore",
                      "amenitiesScore" = excluded."amenitiesScore",
                      "safetyScore" = excluded."safetyScore",
                      "aiScore" = excluded."aiScore",
                      "aiSummary" = excluded."aiSummary",
                      icon = excluded.icon,
                      latitude = excluded.latitude,
                      longitude = excluded.longitude,
                      "sourceNotes" = excluded."sourceNotes",
                      "updatedAt" = now();
                """),
                {
                    "name": row["name"],
                    "zone": row["zone"],
                    "description": row["description"],
                    "tags": parse_list(row["tags"]),
                    "highlights": parse_list(row["highlights"]),
                    "avgPrice": int(row["avg_price"]),
                    "pricePerSqm": int(row["price_per_sqm"]),
                    "rentYield": float(row["rent_yield"]),
                    "growthPercent": float(row["growth_percent"]),
                    "schoolsCount": int(row["schools_count"]),
                    "transportCount": int(row["transport_count"]),
                    "amenitiesCount": int(row["amenities_count"]),
                    "schoolsScore": float(row["schools_score"]),
                    "transportScore": float(row["transport_score"]),
                    "amenitiesScore": float(row["amenities_score"]),
                    "safetyScore": float(row["safety_score"]),
                    "aiScore": int(row["ai_score"]),
                    "aiSummary": row["ai_summary"],
                    "icon": row["icon"],
                    "latitude": float(row["lat"]),
                    "longitude": float(row["lng"]),
                    "sourceNotes": row["source_notes"],
                },
            )

    print("Neighborhoods imported successfully into PostgreSQL.")

if __name__ == "__main__":
    main()