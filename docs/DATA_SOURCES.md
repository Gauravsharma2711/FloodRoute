# DATA SOURCES — where to get everything, and how

Status labels: **[checked]** = confirmed from a source on 2026-10-22 during planning; **[verify]** = not confirmed, test it on your machine and fix this file if wrong. Record the access date of every download in `docs/DATA_STATEMENT.md`.

The planning sandbox could not reach the Copernicus bucket (blocked egress), so tile URLs below are untested. Test from your laptop first (Phase 0).

---

## 1. Roads, hospitals, waterways — OpenStreetMap

- **What:** road network (main roads only), hospitals (`amenity=hospital`), waterways and coastline.
- **Licence:** ODbL. Attribution: "© OpenStreetMap contributors". https://www.openstreetmap.org/copyright
- **Access:** OSMnx → Overpass API (free, no key). Use the disk cache; do not hammer the public Overpass servers.
- **Version note [verify]:** OSMnx v2 takes `bbox=(left, bottom, right, top)`; v1.x used `north, south, east, west`. Check `ox.__version__`.

```python
import osmnx as ox
ox.settings.use_cache = True
west, south, east, north = 72.80, 18.89, 72.93, 19.14
G = ox.graph_from_bbox(bbox=(west, south, east, north),
                       custom_filter=ROAD_FILTER, simplify=True)   # v2 order; v1: (north, south, east, west)
G = ox.add_edge_speeds(G); G = ox.add_edge_travel_times(G)          # travel_time in seconds
hospitals = ox.features_from_bbox(bbox=(west, south, east, north), tags={"amenity": "hospital"})
water = ox.features_from_bbox(bbox=(west, south, east, north),
                              tags={"waterway": ["river", "stream", "canal", "drain"], "natural": "coastline"})
```

- **Report:** number of nodes, edges, hospitals (named / unnamed), waterway features. OSM waterway coverage in Mumbai may be partial **[verify]**; say so if it is.
- **Fallback:** if Overpass is slow, shrink the bbox to the island city, or use a Geofabrik India extract (https://download.geofabrik.de/asia/india.html, large file) **[verify]**.

## 2. Elevation — Copernicus DEM GLO-30 (30 m)

- **What:** global 30 m digital surface model as Cloud Optimized GeoTIFFs on AWS Open Data. It is a **surface** model (includes buildings, vegetation) — use only for relative low-lying ranking. **[checked]**
- **Access:** public S3 bucket `copernicus-dem-30m`, no AWS account needed. Registry: https://registry.opendata.aws/copernicus-dem/ · readme: https://copernicus-dem-30m.s3.amazonaws.com/readme.html **[checked]**
- **Licence:** free for the general public under the Copernicus licence terms (link on the registry page) **[checked]**. Suggested attribution: "Contains modified Copernicus data. Copernicus DEM GLO-30 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA; all rights reserved." — confirm the wording against the licence **[verify]**.
- **Tiles needed:** Mumbai spans latitude 18.89–19.14 N, longitude 72.80–72.93 E → two 1°×1° tiles, `N18_00_E072_00` and `N19_00_E072_00`.
- **URL pattern [checked]:**
  `https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N18_00_E072_00_DEM/Copernicus_DSM_COG_10_N18_00_E072_00_DEM.tif`
- **Do not download whole tiles if you can avoid it:** COGs support reading a window over HTTP.

```python
import rasterio, math
def tile_url(lat, lon):
    n = f"N{math.floor(lat):02d}_00"; e = f"E{math.floor(lon):03d}_00"
    name = f"Copernicus_DSM_COG_10_{n}_{e}_DEM"
    return f"https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif"
# sample elevation at node (lon, lat) pairs, grouped by tile:
with rasterio.open(tile_url(lat0, lon0)) as ds:
    vals = [v[0] for v in ds.sample(list(zip(lons, lats)))]
```

- **Ocean / nodata:** tiles do not cover open ocean (treat as 0 m); handle nodata explicitly and report how many nodes had it.
- **Fallback A:** Open-Meteo Elevation API — max 100 coordinate pairs per request **[checked]**, e.g. `https://api.open-meteo.com/v1/elevation?latitude=19.07,19.08&longitude=72.87,72.88`. Resolution is coarser **[verify]**.
- **Fallback B:** OpenTopoData public API (batch limits and daily limits apply; I recall ~100 points/request and ~1 request/s **[verify]**).

## 3. Rainfall — Open-Meteo

- **What:** daily rainfall history (archive API, reanalysis-based) and tomorrow's forecast. No API key. Free for non-commercial use; free tier is roughly 10,000 requests/day (we need ~3) **[checked via third-party summary; confirm at https://open-meteo.com/en/pricing and /en/terms]**.
- **Attribution/licence [verify]:** check https://open-meteo.com/en/terms and cite accordingly.

```text
History:  https://archive-api.open-meteo.com/v1/archive?latitude=19.076&longitude=72.8777
          &start_date=2005-01-01&end_date=2025-12-31&daily=precipitation_sum&timezone=Asia%2FKolkata
Forecast: https://api.open-meteo.com/v1/forecast?latitude=19.076&longitude=72.8777
          &daily=precipitation_sum&forecast_days=3&timezone=Asia%2FKolkata
```

- **Use:** pick the top-10 rainiest days → "replay days" (real dates, real mm). Cache the CSV in `data/raw/rain_archive.csv` and commit it (small). Cache the forecast JSON with its fetch time as the offline fallback.
- **Honest caveat:** reanalysis rainfall is a grid-cell average and usually **understates extreme point rainfall**. Check whether the well-known extreme day of 26 July 2005 appears and at what magnitude (it is widely reported at several hundred mm at the Santacruz gauge — verify before quoting). Say what you find.
- **Fallbacks:** NASA POWER daily precipitation, or IMD gridded data if easy to access **[verify]**. Do not spend more than 15 minutes on alternatives.

## 4. Rain categories — IMD

Daily rainfall categories used by the India Meteorological Department **[checked: IMD pages, e.g. https://mausam.imd.gov.in/ and IMD regional bulletins]**:

| Category | mm per day |
|---|---|
| Light | 2.5 – 15.5 |
| Moderate | 15.6 – 64.4 |
| Heavy | 64.5 – 115.5 |
| Very heavy | 115.6 – 204.4 |
| Extremely heavy | ≥ 204.5 |

(Some sources write "very light 0.1–2.4 mm". Boundaries are used as in `config.yaml`.)

Context worth one line on a slide: a BMC official said waterlogging is unavoidable when about 300 mm falls in a short span at the same time as a 4.5 m high tide **[checked: Free Press Journal, BMC press conference report]** — useful as the "why drainage and tide matter and are not modelled" limitation.

## 5. Validation spots — reported waterlogging locations (hand-compiled)

There is **no clean downloadable, geocoded list**. Build `data/validation/flood_spots.csv` from public reports. Starter rows with source URLs are already in the file; add more (target 15–20 with sources). Keep one source URL per row.

Useful public sources found during planning **[checked: articles exist; exact lists vary by year]**:

| Source | What it gives | URL |
|---|---|---|
| Free Press Journal — remedial measures | Hindmata (Parel/Dadar), Gandhi Market (Sion), Chembur Circle, Milan Subway (Santacruz); BMC count of 386 chronic spots | https://www.freepressjournal.in/amp/mumbai/mumbai-bmcs-monsoon-remedial-measures-fail-to-hold-water |
| Free Press Journal — flood gauges | Measured waterlogging days at gauges: Antop Hill, Wadala (Vidyalankar), Sion (Gurukripa, Guru Nanak School, Gandhi Market), Hindmata | https://www.freepressjournal.in/amp/mumbai/mumbai-flood-guages-for-better-monsoon-preparedness |
| Indian Express via Praja (PDF) | BMC chronic spots: 336 identified (2022); work on 238 | https://praja.org/praja_docs/press_images/The_Indian_Express_One_on_One_Online_31st_July_2023.pdf |
| Traffic police list | Over 200 flood-prone locations: 58 western suburbs, 48 central Mumbai, 42 eastern suburbs | https://togethervcan.in/?p=4997 |
| Navbharat Live (Hindi, 2026) | BMC list grew to 496 spots; newly listed South Mumbai spots (Oval Maidan, Mantralaya, Kemps Corner, Churchgate, Metro Cinema, Hutatma Chowk) | https://navbharatlive.com/maharashtra/mumbai/mumbai-flood-risk-bmc-list-south-mumbai-vip-areas-update-1712402.html |
| Free Press Journal — 225 spots | List drafted after the 29 Aug 2017 deluge; spots grouped island city / eastern / western suburbs | https://www.pressreader.com/india/the-free-press-journal/20180807/281616716188561 |

- **Try for 15 minutes only:** BMC website / Disaster Management Unit / data.gov.in search for "flood prone spots", "chronic flooding", "waterlogging" — a published list would be much better than news **[verify; do not block on this]**.
- **Geocoding:** use `osmnx.geocode("Hindmata Junction, Mumbai")` once per spot, then **eyeball every point on a map**; save `lat, lon` into the CSV. Do not call Nominatim from the app.
- **Bias to state:** reported spots favour busy, visible roads, and reporting differs by year and source; the list is small, so uncertainty is wide.

## 6. Optional / later

- **Hospital specialty table (Tier C):** hand-curated from hospital or BMC pages, 10–12 hospitals, with source URL and access date per row. OSM specialty tags are patchy **[verify]**.
- **Population (not in V1):** WorldPop / GHSL — skip unless everything else is done.
- **Underground drains / pumps:** not found as open data **[checked: only news reports, e.g. 487 de-watering pumps installed by BMC]**; list as "what we would need next".

## 7. Fair-use and terms reminders

- Cache everything on disk; run downloads once.
- Be gentle with Overpass and Open-Meteo; do not loop requests.
- No scraping of sites against their terms; for news articles, record facts (spot name, URL, date), do not copy text.
- Never commit API keys.
