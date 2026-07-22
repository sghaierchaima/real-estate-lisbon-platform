from pathlib import Path
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "raw"
PROCESSED_DIR = BASE_DIR / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

def clamp(value, low, high):
    return max(low, min(high, value))

def safety_proxy(row):
    score = 3.2
    score += min(row["amenities_count"], 120) / 120 * 0.8
    score += min(row["transport_count"], 60) / 60 * 0.4
    score += min(row["schools_count"], 20) / 20 * 0.4

    if row["price_per_sqm"] > 6000:
        score += 0.2

    return round(clamp(score, 1, 5), 2)

def icon_for(row):
    name = row["name"].lower()
    zone = row["zone"].lower()

    if "cascais" in name or "belém" in name or "coast" in zone:
        return "waves"
    if "sintra" in name or "lumiar" in name or "benfica" in name:
        return "tree"
    if "alfama" in name or "graça" in name or "príncipe" in name:
        return "sun"
    return "building"

def tags_for(row):
    tags = ["lisbon", row["zone"].lower()]

    if row["rent_yield"] >= 4.5:
        tags.append("investment")
    if row["growth_percent"] >= 8.5:
        tags.append("growth")
    if row["schools_score"] >= 4.0 and row["safety_score"] >= 4.0:
        tags.append("family")
    if row["price_per_sqm"] >= 6200:
        tags.append("premium")
    if row["transport_score"] >= 4.0:
        tags.append("transport")
    if "cascais" in row["name"].lower():
        tags.append("expat")

    return list(dict.fromkeys(tags))

def highlights_for(row):
    return [
        f"{int(row['schools_count'])} education-related points found within 1.2 km",
        f"{int(row['transport_count'])} transport points found within 1.2 km",
        f"{int(row['amenities_count'])} amenities found within 1.2 km",
        f"Estimated rent yield: {row['rent_yield']}%",
    ]

def description_for(row):
    return (
        f"{row['name']} is evaluated using real geospatial signals from OpenStreetMap "
        f"and market indicators. The model considers accessibility, schools, amenities, "
        f"price level, rental yield and growth potential."
    )

def main():
    osm = pd.read_csv(PROCESSED_DIR / "osm_features.csv")
    market = pd.read_csv(RAW_DIR / "market_prices.csv")

    df = osm.merge(market, on="name", how="left")

    missing = df[df["price_per_sqm"].isna()]
    if not missing.empty:
        raise ValueError(f"Missing market data for: {missing['name'].tolist()}")

    df["safety_score"] = df.apply(safety_proxy, axis=1)
    df["icon"] = df.apply(icon_for, axis=1)
    df["tags"] = df.apply(tags_for, axis=1)
    df["highlights"] = df.apply(highlights_for, axis=1)
    df["description"] = df.apply(description_for, axis=1)

    market_avg = df["price_per_sqm"].mean()

    lifestyle = (
        df["schools_score"] * 0.20
        + df["transport_score"] * 0.25
        + df["amenities_score"] * 0.25
        + df["safety_score"] * 0.30
    ) * 20

    price_score = np.clip((market_avg / df["price_per_sqm"]) * 70, 35, 90)
    yield_score = np.clip(df["rent_yield"] * 16, 35, 85)
    growth_score = np.clip(df["growth_percent"] * 5, 35, 90)

    df["ai_score_rule_based"] = (
        lifestyle * 0.45
        + price_score * 0.20
        + yield_score * 0.15
        + growth_score * 0.20
    ).round().clip(45, 92).astype(int)

    df["source_notes"] = (
        "OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; "
        "replace market file with INE/authorized market export before production."
    )

    df["ai_summary"] = df.apply(
        lambda r: (
            f"{r['name']} scores well for "
            f"{'investment' if r['rent_yield'] >= 4.5 else 'lifestyle'} "
            f"with {int(r['amenities_count'])} amenities and "
            f"{int(r['transport_count'])} transport points nearby."
        ),
        axis=1,
    )

    output = PROCESSED_DIR / "neighborhood_dataset.csv"
    df.to_csv(output, index=False, encoding="utf-8")
    print("Created:", output)

if __name__ == "__main__":
    main()