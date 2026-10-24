# DATA STATEMENT (FloodRoute Submission)

**Project:** FloodRoute · HackAMatch 1.0 (CityPulse track: Predict. Explain. Act.)  
**Study Area:** Mumbai Metropolitan Island City & Suburbs (Bounding Box: West 72.80, South 18.89, East 72.93, North 19.14)  
**Date Prepared:** October 2026  

---

## 1. Datasets

| # | Dataset | Source URL | Access Date | Licence / Terms | Fields Used | Count / Size |
|---|---|---|---|---|---|---|
| 1 | Road network (OSM drivable roads) | OpenStreetMap (via Overpass API / OSMnx) | 2026-10-22 | ODbL — © OpenStreetMap contributors | `highway`, `name`, `geometry`, `maxspeed`, `bridge`, `tunnel`, `layer` | **5,041 nodes / 9,746 edges** (470 bridges, 21 underpasses) |
| 2 | Hospitals (`amenity`/`healthcare`/`building=hospital`) | OpenStreetMap (Overpass) | 2026-10-22 | ODbL — © OpenStreetMap contributors | `name`, `geometry`, `emergency` | **611 features → 576 kept** (named, not `emergency=no`) → **35 destination hospitals** (curated names in `config.yaml`); fetched 2026-10-23 |
| 3 | Waterways and coastline | OpenStreetMap (Overpass) | 2026-10-22 | ODbL — © OpenStreetMap contributors | `waterway`, `natural=coastline`, `geometry` | **583 water features** (Mithi River, Mahim Creek, Arabian Sea coast) |
| 4 | Copernicus DEM GLO-30 | AWS S3 `copernicus-dem-30m` COG tiles | 2026-10-22 | Free & open public licence (European Space Agency / Copernicus) | Elevation in metres sampled at road nodes | **Tiles N18E072, N19E072** (0 nodata nodes; -1.68 m to 74.81 m, median 9.55 m) |
| 5 | Daily rainfall archive | Open-Meteo Historical Weather API (`archive-api.open-meteo.com`) | 2026-10-22 | Open-Meteo Terms (Non-commercial open access) | `precipitation_sum` (daily total in mm) | **7,670 days** (2005-01-01 to 2025-12-31), 0 missing; fetched 2026-10-23; cached `data/raw/rain_archive.csv` |
| 6 | Rainfall forecast | Open-Meteo Weather Forecast API (`api.open-meteo.com`) | 2026-10-22 | Open-Meteo Terms | `precipitation_sum` for next 24–48 h | Forecast JSON |
| 7 | IMD rainfall classification | India Meteorological Department (`mausam.imd.gov.in`) | 2026-10-22 | Public information | Rainfall thresholds (mm/day) | 5 classes: Moderate (15.6–64.4 mm), Heavy (64.5–115.5 mm), Very Heavy (115.6–204.4 mm), Extremely Heavy (>204.4 mm) |
| 8 | Reported waterlogging spots | Hand-curated from official BMC reports, Mumbai Traffic Police alerts, and news archives | 2026-10-22 | Public domain factual records with per-row citation | `name`, `area`, `lat`, `lon`, `source_url`, `context` | **14 sourced benchmark spots** (Hindmata, Gandhi Market, Milan Subway, Kurla, etc.) |

---

## 2. Preprocessing & Feature Engineering

1. **OSM Roads Graph:**
   - Filtered exclusively to drivable road hierarchy: `motorway`, `trunk`, `primary`, `secondary`, `tertiary` (plus directional link roads).
   - Network graph simplified with geometry preservation; largest connected component retained (5,035 nodes).
   - Edge travel times computed using tagged `maxspeed` or road-class default fallbacks (e.g. 50 km/h primary, 40 km/h secondary, 30 km/h tertiary).
2. **Terrain Elevation Sampling:**
   - Copernicus DEM 30 m Digital Surface Model (DSM) COGs accessed via rasterio HTTP range window reads.
   - All 5,041 nodes sampled; edges assigned mean elevation of end nodes.
3. **Relative Elevation (Depression Detection):**
   - For every node, calculated relative elevation against the median elevation of all road nodes within a 300-metre radius:
     $$\Delta h_i = h_i - \text{median}_{j \in N_{300}(i)}(h_j)$$
   - Identifies acute low-lying topographic bowls (e.g., Hindmata Junction sits -0.39 m to -1.4 m below surroundings).
4. **Proximity to Water Bodies:**
   - Computed minimum Euclidean distance from each edge midpoint to the nearest OSM coastline, river, or tidal canal feature in projected CRS (EPSG:32643 - UTM Zone 43N).
5. **Infrastructure Underpass Identification:**
   - Flagged segments passing through railway or roadway underpasses via OSM `tunnel` and `layer < 0` attributes.
   - **Crucial Rule:** Elevated bridges (`bridge=yes`, `layer > 0`) are explicitly shielded and never flagged as flood-prone.
6. **Multi-Criteria Scoring:**
   - Each component is rank-normalized to $[0, 1]$ across all edges:
     - Inverted relative elevation (lower relative depression = higher rank)
     - Inverted absolute elevation (lower sea-level height = higher rank)
     - Inverted water distance (closer to water body = higher rank)
     - Binary underpass indicator
   - Composite risk score computed using predefined `config.yaml` weights:
     $$\text{Score} = 0.40 \cdot \text{RelElev} + 0.25 \cdot \text{AbsElev} + 0.20 \cdot \text{WaterDist} + 0.15 \cdot \text{Underpass}$$
   - Final `flood_rank_pct` is the percentile rank $[0, 100\%]$ across the entire road network.

---

## 3. Data Integrity & Handling

- **Missing Values:** Missing speeds imputed with conservative city defaults based on OSM road classification. 0 nodata elevation values encountered.
- **Outliers & Bridges:** Elevated flyovers over chronic basins (e.g., Lalbaug / Ambedkar Road flyover passing over Hindmata) are protected from false-positive flagging by bridge tagging.
- **Validation Snapping:** All 14 reported flood spots snapped to nearest road edge within 150 m.

---

## 4. Known Limitations

- **Surface Model (DSM) Artifacts:** Copernicus DEM GLO-30 measures surface canopy and building heights rather than bare earth, which can elevate estimated ground height in narrow street canyons flanked by multi-story towers.
- **Lack of Subsurface Drainage Data:** Mumbai's underground storm drain network (SWD / BRIMSTOWAD) and municipal pumping stations are not publicly available open spatial data.
- **Reanalysis Rain Resolution:** Open-Meteo reanalysis grids (~11 km) can smooth localized convective cloudbursts. Rainfall scenarios are used to drive realistic scenario stress-tests rather than live precipitation telemetry.
