import os
import csv
from typing import Dict, Optional
from sqlalchemy.orm import Session
from models import MandiObservation

COMMODITY_ALIASES: Dict[str, str] = {
    "gahu": "wheat",
    "gehun": "wheat",
    "gehu": "wheat",
    "wheat": "wheat",
    "wheat(dara)": "wheat",
    "aloo": "potato",
    "potato": "potato",
    "sarson": "mustard",
    "mustard": "mustard",
    "dhan": "paddy",
    "paddy": "paddy",
    "chawal": "paddy",
    "kanda": "onion",
    "pyaz": "onion",
    "onion": "onion",
    "tamatar": "tomato",
    "tomato": "tomato",
}

def normalize_commodity(raw_name: str) -> str:
    cleaned = raw_name.strip().lower()
    for alias, canonical in COMMODITY_ALIASES.items():
        if alias in cleaned:
            return canonical
    return cleaned

def seed_csv_to_sqlite(db: Session, csv_path: Optional[str] = None) -> int:
    if not csv_path:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        csv_path = os.path.join(base_dir, "data", "agmarknet_snapshot_v2026_10_21.csv")

    if not os.path.exists(csv_path):
        return 0

    # Count existing
    existing = db.query(MandiObservation).count()
    if existing > 0:
        return existing

    count = 0
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            modal = float(row["modal_price"]) if row.get("modal_price") and row["modal_price"].strip() else None
            min_p = float(row["min_price"]) if row.get("min_price") and row["min_price"].strip() else None
            max_p = float(row["max_price"]) if row.get("max_price") and row["max_price"].strip() else None
            arr = float(row["arrivals_tonnes"]) if row.get("arrivals_tonnes") and row["arrivals_tonnes"].strip() else 0.0
            dist = float(row["distance_km"]) if row.get("distance_km") and row["distance_km"].strip() else 0.0

            canonical = normalize_commodity(row.get("raw_commodity_name", row.get("commodity_canonical", "")))

            record = MandiObservation(
                state_code=row["state_code"].strip(),
                state_name=row["state_name"].strip(),
                district_name=row["district_name"].strip(),
                market_name=row["market_name"].strip(),
                market_id=row["market_id"].strip(),
                commodity_canonical=canonical,
                raw_commodity_name=row.get("raw_commodity_name", "").strip(),
                variety=row.get("variety", "").strip(),
                arrival_date=row["arrival_date"].strip(),
                modal_price=modal,
                min_price=min_p,
                max_price=max_p,
                arrivals_tonnes=arr,
                distance_km=dist,
                is_verified=True,
                officer_verified=False
            )
            db.add(record)
            count += 1
        db.commit()

    return count
