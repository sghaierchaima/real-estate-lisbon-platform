from pathlib import Path
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import LeaveOneOut, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error

BASE_DIR = Path(__file__).resolve().parents[1]
PROCESSED_DIR = BASE_DIR / "processed"

FEATURES = [
    "price_per_sqm",
    "avg_price",
    "rent_yield",
    "growth_percent",
    "schools_count",
    "transport_count",
    "amenities_count",
    "schools_score",
    "transport_score",
    "amenities_score",
    "safety_score",
]

def main():
    df = pd.read_csv(PROCESSED_DIR / "neighborhood_dataset.csv")

    X = df[FEATURES]
    y = df["ai_score_rule_based"]

    model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "rf",
                RandomForestRegressor(
                    n_estimators=300,
                    max_depth=6,
                    random_state=42,
                ),
            ),
        ]
    )

    model.fit(X, y)

    predictions = model.predict(X)
    mae = mean_absolute_error(y, predictions)

    df["ai_score"] = predictions.round().clip(45, 92).astype(int)

    joblib.dump(model, PROCESSED_DIR / "neighborhood_model.pkl")
    df.to_csv(PROCESSED_DIR / "neighborhood_dataset_final.csv", index=False, encoding="utf-8")

    print("Training done")
    print("Train MAE:", round(mae, 2))
    print("Created:", PROCESSED_DIR / "neighborhood_model.pkl")
    print("Created:", PROCESSED_DIR / "neighborhood_dataset_final.csv")

if __name__ == "__main__":
    main()