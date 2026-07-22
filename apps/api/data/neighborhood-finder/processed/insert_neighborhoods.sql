
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

insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Parque das Nações',
  'Lisbon East',
  'Parque das Nações is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','lisbon east','growth','premium','transport'],
  ARRAY['13 education-related points found within 1.2 km','186 transport points found within 1.2 km','240 amenities found within 1.2 km','Estimated rent yield: 4.1%'],
  520000,
  6200,
  4.1,
  8.5,
  3.53,
  5.0,
  5.0,
  4.86,
  'building',
  38.7676,
  -9.094,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  73,
  'Parque das Nações scores well for lifestyle with 240 amenities and 186 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Avenidas Novas',
  'Central Lisbon',
  'Avenidas Novas is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','central lisbon','family','premium','transport'],
  ARRAY['61 education-related points found within 1.2 km','329 transport points found within 1.2 km','668 amenities found within 1.2 km','Estimated rent yield: 3.7%'],
  560000,
  6500,
  3.7,
  7.8,
  5.0,
  5.0,
  5.0,
  5.0,
  'building',
  38.738,
  -9.15,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  73,
  'Avenidas Novas scores well for lifestyle with 668 amenities and 329 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Campo de Ourique',
  'Central Lisbon',
  'Campo de Ourique is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','central lisbon','family','transport'],
  ARRAY['45 education-related points found within 1.2 km','371 transport points found within 1.2 km','365 amenities found within 1.2 km','Estimated rent yield: 3.8%'],
  470000,
  5700,
  3.8,
  7.2,
  5.0,
  5.0,
  5.0,
  4.8,
  'building',
  38.7172,
  -9.1662,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  74,
  'Campo de Ourique scores well for lifestyle with 365 amenities and 371 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Alfama',
  'Historic Lisbon',
  'Alfama is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','historic lisbon','investment','family','transport'],
  ARRAY['23 education-related points found within 1.2 km','365 transport points found within 1.2 km','892 amenities found within 1.2 km','Estimated rent yield: 4.6%'],
  420000,
  5400,
  4.6,
  6.5,
  5.0,
  5.0,
  5.0,
  4.8,
  'sun',
  38.7115,
  -9.13,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  77,
  'Alfama scores well for investment with 892 amenities and 365 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Belém',
  'Lisbon West',
  'Belém is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','lisbon west','family','premium','transport'],
  ARRAY['27 education-related points found within 1.2 km','160 transport points found within 1.2 km','200 amenities found within 1.2 km','Estimated rent yield: 3.5%'],
  610000,
  6800,
  3.5,
  6.8,
  5.0,
  5.0,
  5.0,
  5.0,
  'waves',
  38.6968,
  -9.2065,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  71,
  'Belém scores well for lifestyle with 200 amenities and 160 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Marvila',
  'Lisbon East',
  'Marvila is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','lisbon east','investment','growth','transport'],
  ARRAY['13 education-related points found within 1.2 km','216 transport points found within 1.2 km','47 amenities found within 1.2 km','Estimated rent yield: 4.8%'],
  390000,
  4300,
  4.8,
  12.5,
  3.53,
  5.0,
  2.46,
  4.17,
  'building',
  38.745,
  -9.105,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  78,
  'Marvila scores well for investment with 47 amenities and 216 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Príncipe Real',
  'Central Lisbon',
  'Príncipe Real is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','central lisbon','family','premium','transport'],
  ARRAY['54 education-related points found within 1.2 km','452 transport points found within 1.2 km','1332 amenities found within 1.2 km','Estimated rent yield: 3.6%'],
  690000,
  7600,
  3.6,
  6.9,
  5.0,
  5.0,
  5.0,
  5.0,
  'sun',
  38.7167,
  -9.1487,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  71,
  'Príncipe Real scores well for lifestyle with 1332 amenities and 452 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Estrela',
  'Central Lisbon',
  'Estrela is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','central lisbon','family','premium','transport'],
  ARRAY['53 education-related points found within 1.2 km','395 transport points found within 1.2 km','693 amenities found within 1.2 km','Estimated rent yield: 3.7%'],
  590000,
  6400,
  3.7,
  7.4,
  5.0,
  5.0,
  5.0,
  5.0,
  'building',
  38.7139,
  -9.1594,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  73,
  'Estrela scores well for lifestyle with 693 amenities and 395 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Alvalade',
  'Central Lisbon',
  'Alvalade is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','central lisbon','family','transport'],
  ARRAY['53 education-related points found within 1.2 km','282 transport points found within 1.2 km','320 amenities found within 1.2 km','Estimated rent yield: 3.9%'],
  510000,
  5900,
  3.9,
  7.6,
  5.0,
  5.0,
  5.0,
  4.8,
  'building',
  38.7533,
  -9.1436,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  74,
  'Alvalade scores well for lifestyle with 320 amenities and 282 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Benfica',
  'Lisbon North',
  'Benfica is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','lisbon north','investment','growth','family','transport'],
  ARRAY['30 education-related points found within 1.2 km','319 transport points found within 1.2 km','204 amenities found within 1.2 km','Estimated rent yield: 4.7%'],
  360000,
  4200,
  4.7,
  8.7,
  5.0,
  5.0,
  5.0,
  4.8,
  'tree',
  38.7506,
  -9.2024,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  81,
  'Benfica scores well for investment with 204 amenities and 319 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Lumiar',
  'Lisbon North',
  'Lumiar is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','lisbon north','family','transport'],
  ARRAY['31 education-related points found within 1.2 km','245 transport points found within 1.2 km','149 amenities found within 1.2 km','Estimated rent yield: 4.4%'],
  410000,
  4700,
  4.4,
  8.1,
  5.0,
  5.0,
  5.0,
  4.8,
  'tree',
  38.771,
  -9.159,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  79,
  'Lumiar scores well for lifestyle with 149 amenities and 245 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Arroios',
  'Central Lisbon',
  'Arroios is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','central lisbon','investment','growth','family','transport'],
  ARRAY['57 education-related points found within 1.2 km','409 transport points found within 1.2 km','809 amenities found within 1.2 km','Estimated rent yield: 4.5%'],
  430000,
  5200,
  4.5,
  8.9,
  5.0,
  5.0,
  5.0,
  4.8,
  'building',
  38.7276,
  -9.1353,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  79,
  'Arroios scores well for investment with 809 amenities and 409 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Graça',
  'Historic Lisbon',
  'Graça is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','historic lisbon','investment','family','transport'],
  ARRAY['40 education-related points found within 1.2 km','422 transport points found within 1.2 km','808 amenities found within 1.2 km','Estimated rent yield: 4.6%'],
  410000,
  5000,
  4.6,
  8.4,
  5.0,
  5.0,
  5.0,
  4.8,
  'sun',
  38.7188,
  -9.129,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  79,
  'Graça scores well for investment with 808 amenities and 422 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Oeiras',
  'Greater Lisbon West',
  'Oeiras is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','greater lisbon west','family','transport'],
  ARRAY['18 education-related points found within 1.2 km','176 transport points found within 1.2 km','167 amenities found within 1.2 km','Estimated rent yield: 4.2%'],
  480000,
  5000,
  4.2,
  8.2,
  4.58,
  5.0,
  5.0,
  4.76,
  'building',
  38.697,
  -9.3017,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  77,
  'Oeiras scores well for lifestyle with 167 amenities and 176 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Cascais',
  'Greater Lisbon Coast',
  'Cascais is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','greater lisbon coast','premium','transport','expat'],
  ARRAY['13 education-related points found within 1.2 km','75 transport points found within 1.2 km','237 amenities found within 1.2 km','Estimated rent yield: 3.9%'],
  750000,
  7200,
  3.9,
  7.5,
  3.53,
  5.0,
  5.0,
  4.86,
  'waves',
  38.6968,
  -9.4215,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  70,
  'Cascais scores well for lifestyle with 237 amenities and 75 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Sintra',
  'Greater Lisbon North-West',
  'Sintra is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','greater lisbon north-west','growth','transport'],
  ARRAY['14 education-related points found within 1.2 km','103 transport points found within 1.2 km','130 amenities found within 1.2 km','Estimated rent yield: 4.4%'],
  350000,
  3600,
  4.4,
  9.5,
  3.74,
  5.0,
  5.0,
  4.68,
  'tree',
  38.8029,
  -9.3817,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  80,
  'Sintra scores well for lifestyle with 130 amenities and 103 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Amadora',
  'Greater Lisbon North-West',
  'Amadora is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','greater lisbon north-west','investment','growth','family','transport'],
  ARRAY['40 education-related points found within 1.2 km','164 transport points found within 1.2 km','150 amenities found within 1.2 km','Estimated rent yield: 5.0%'],
  300000,
  3300,
  5.0,
  9.2,
  5.0,
  5.0,
  5.0,
  4.8,
  'building',
  38.7597,
  -9.2397,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  83,
  'Amadora scores well for investment with 150 amenities and 164 transport points nearby.',
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


insert into neighborhoods (
  name, zone, description, tags, highlights,
  avg_price, price_per_sqm, rent_yield, growth_percent,
  schools_score, transport_score, amenities_score, safety_score,
  icon, lat, lng, source_notes, ai_score, ai_summary, ai_pros, ai_cons
)
values (
  'Loures',
  'Greater Lisbon North',
  'Loures is evaluated using real geospatial signals from OpenStreetMap and market indicators. The model considers accessibility, schools, amenities, price level, rental yield and growth potential.',
  ARRAY['lisbon','greater lisbon north','investment','growth','transport'],
  ARRAY['12 education-related points found within 1.2 km','94 transport points found within 1.2 km','109 amenities found within 1.2 km','Estimated rent yield: 4.9%'],
  320000,
  3400,
  4.9,
  8.8,
  3.32,
  5.0,
  4.62,
  4.57,
  'building',
  38.8309,
  -9.1685,
  'OSM Overpass API for geospatial amenities; market_prices.csv for price/yield/growth; replace market file with INE/authorized market export before production.',
  80,
  'Loures scores well for investment with 109 amenities and 94 transport points nearby.',
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
