# DATA STATEMENT (submission document)

Fill the **Access date** and **Count/size** columns when each file is downloaded. Keep wording factual. Update if anything changes.

Project: FloodRoute · HackAMatch 1.0 · Area: Mumbai (bbox in `config.yaml`) · Prepared: ____ (date)

## 1. Datasets

| # | Dataset | Source URL | Access date | Licence / terms | Fields used | Count / size |
|---|---|---|---|---|---|---|
| 1 | Road network (OSM, main roads) | https://www.openstreetmap.org (via Overpass API / OSMnx) | | ODbL — © OpenStreetMap contributors | highway, name, geometry, maxspeed, bridge, tunnel, layer | ___ nodes / ___ edges |
| 2 | Hospitals (OSM `amenity=hospital`) | same | | ODbL | name, geometry, emergency (if tagged) | ___ hospitals |
| 3 | Waterways and coastline (OSM) | same | | ODbL | waterway, natural=coastline, geometry | ___ features |
| 4 | Copernicus DEM GLO-30 | https://registry.opendata.aws/copernicus-dem/ | | Copernicus licence (free for the general public) — confirm wording | elevation (m) sampled at road nodes | tiles N18E072, N19E072 |
| 5 | Daily rainfall, history | https://archive-api.open-meteo.com | | Open-Meteo terms (non-commercial free use) — confirm attribution | precipitation_sum | ___ days (2005-01-01 to ____) |
| 6 | Rainfall forecast | https://api.open-meteo.com | | same | precipitation_sum (tomorrow) | cached JSON |
| 7 | IMD rain categories | https://mausam.imd.gov.in | | public information, cited | category thresholds (mm/day) | 5 classes |
| 8 | Reported waterlogging spots | news / BMC reports — URLs per row in `data/validation/flood_spots.csv` | | facts only (name, location, year, URL); no article text copied | name, area, lat/lon (geocoded by us), source URL | ___ spots |

## 2. Preprocessing

1. **OSM roads:** filtered to motorway, trunk, primary, secondary, tertiary (+links); graph simplified; largest connected component kept (removed ___ nodes); travel time from OSM speeds with fallback speed for missing values (___ edges).
2. **Elevation:** sampled at each road node; ocean/nodata nodes set to 0 m and counted (___); edge value = mean of end nodes.
3. **Relative elevation:** node elevation minus median elevation of nodes within 300 m.
4. **Water distance:** distance from each edge midpoint to nearest OSM waterway/coastline feature (projected CRS, metres).
5. **Underpass / bridge flags:** from OSM `tunnel`, `layer`, `bridge` tags. Bridges are never flagged.
6. **Score:** each component rank-normalised to 0–1; weights from `config.yaml`; flood_rank_pct = percentile rank of the weighted sum.
7. **Rain days:** top-10 rainiest days from the archive series; IMD category assigned by thresholds; flag share from the assumption table.
8. **Validation spots:** geocoded with OSM Nominatim (via osmnx), checked visually on a map; snapped to the nearest road segment within 150 m; spots beyond that dropped (___).

## 3. Missing values, duplicates, outliers

- Missing OSM `maxspeed`: filled by road-class defaults (___).
- Duplicate edges/nodes: removed by graph simplification (___).
- Elevation outliers (e.g. flyovers, DSM artefacts): bridges excluded from flagging; extreme relative-elevation values winsorised at 1st/99th percentile for ranking (document if used).
- Rain: missing days (___), if any.

## 4. Known limitations of the data

- OSM completeness and tagging vary; waterway coverage may be partial.
- DEM is a surface model with building/vegetation effects and coarse resolution in dense areas.
- Rainfall is a reanalysis grid value and can understate extreme point rainfall.
- Reported spots: small sample, visibility/reporting bias, different years and sources.
- No data for underground drains, pumps, tides, traffic, hospital capacity.

## 5. Synthetic data

None is used in the deployed app. Synthetic fixtures exist only in `app/fixtures/` for UI testing and display a visible "SYNTHETIC UI FIXTURE" ribbon.

## 6. Reproducibility

`python pipeline/run_all.py` rebuilds `data/processed/` from the sources above (needs internet). Committed processed files let the app run without network, keys or paid services.
