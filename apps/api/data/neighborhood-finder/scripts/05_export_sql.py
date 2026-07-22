from pathlib import Path
import ast
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
PROCESSED_DIR = BASE_DIR / "processed"

def sql_escape(value):
    if pd.isna(value):
        return ""
    return str(value).replace("'", "''")

def sql_array(value):
    if isinstance(value, str):
        try:
            parsed = ast.literal_eval(value)
            if isinstance(parsed, list):
                value = parsed
            else:
                value = [value]
        except Exception:
            value = [value]

    if not isinstance(value, list):
        value = [str(value)]

    return "ARRAY[" + ",".join(f"'{sql_escape(v)}'" for v in value) + "]"

def main():
    df = pd.read_csv(PROCESSED_DIR / "neighborhood_dataset_final.csv")

    create_table = """
create table if not exists neighborhoods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  zone text,
  description text,
  tags text[],
  highlights text[],
  avg_price integer,
  price_per_sqm integer,
  rent_yield numeric,
  growth_percent numeric,
  schools_score numeric,
  transport_score numeric,
  amenities_score numeric,
  safety_score numeric,
  icon text,
  lat numeric,
  lng numeric,
  source_notes text,
  ai_score integer,
  ai_summary text,
  ai_pros text[],
  ai_cons text[],
  created_at timestamp default now()
);

alter table neighborhoods enable row level security;

drop policy if exists "public can read neighborhoods" on neighborhoods;

create policy "public can read neighborhoods"
on neighborhoods
for select
using (true);
"""

    inserts = []

    for _, r in df.iterrows():
        inserts.append(f"""
insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  '{sql_escape(r["name"])}',
  '{sql_escape(r["zone"])}',
  '{sql_escape(r["description"])}',
  {sql_array(r["tags"])},
  {sql_array(r["highlights"])},
  {int(r["avg_price"])},
  {int(r["price_per_sqm"])},
  {float(r["rent_yield"])},
  {float(r["growth_percent"])},
  {float(r["schools_score"])},
  {float(r["transport_score"])},
  {float(r["amenities_score"])},
  {float(r["safety_score"])},
  '{sql_escape(r["icon"])}',
  {float(r["lat"])},
  {float(r["lng"])},
  '{sql_escape(r["source_notes"])}',
  {int(r["ai_score"])},
  '{sql_escape(r["ai_summary"])}',
  ARRAY[]::text[],
  ARRAY[]::text[]
)
on conflict (name) do update set
  zone = excluded.zone,
  description = excluded.description,
  tags = excluded.tags,
  highlights = excluded.highlights,
  avg_price = excluded.avg_price,
  price_per_sqm = excluded.price_per_sqm,
  rent_yield = excluded.rent_yield,
  growth_percent = excluded.growth_percent,
  schools_score = excluded.schools_score,
  transport_score = excluded.transport_score,
  amenities_score = excluded.amenities_score,
  safety_score = excluded.safety_score,
  icon = excluded.icon,
  lat = excluded.lat,
  lng = excluded.lng,
  source_notes = excluded.source_notes,
  ai_score = excluded.ai_score,
  ai_summary = excluded.ai_summary;
""")

    output = PROCESSED_DIR / "insert_neighborhoods.sql"
    output.write_text(create_table + "\n".join(inserts), encoding="utf-8")
    print("Created:", output)

if __name__ == "__main__":
    main()