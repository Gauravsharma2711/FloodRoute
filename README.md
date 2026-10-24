# FloodRoute — "Can the ambulance get through?"

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20App-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://flood-route-six.vercel.app/)
[![Render Backend](https://img.shields.io/badge/Render-API%20Live-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://floodroute.onrender.com/)

- **Live Web Application (Vercel):** [https://flood-route-six.vercel.app/](https://flood-route-six.vercel.app/)
- **Live API Backend (Render):** [https://floodroute.onrender.com/](https://floodroute.onrender.com/)
- **API Health Check:** [https://floodroute.onrender.com/health](https://floodroute.onrender.com/health)
- **API Interactive Docs (Swagger):** [https://floodroute.onrender.com/docs](https://floodroute.onrender.com/docs)

HackAMatch 1.0 · CityPulse (Predict. Explain. Act.) · City: Mumbai (island city + suburbs up to Andheri / Kurla)

FloodRoute is a decision-support map for ambulance dispatchers and the city flood-control team. For a heavy-rain day it:

1. marks the roads most likely to flood,
2. shows how that changes the route to the best reachable hospital (normal route vs flood-safe route, with the extra minutes), and
3. checks its own flood-prone-road score against publicly reported waterlogging spots, and says honestly how well it did.

> **It is not a flood forecast.** It ranks roads by terrain-based flood-proneness (a *flood-prone road proxy*). It does not know whether water is on a road right now, and it does not model underground drains or pumps. See [Limitations](#limitations).

---

## What the app does

| # | Feature | Status |
|---|---|---|
| 1 | Pick a rain day: one of the 10 heaviest real days 2005–2025 (Open-Meteo) or tomorrow's forecast | ✅ real data |
| 2 | Map shows the roads most likely to flood for that rain category | ✅ real data |
| 3 | Click the patient location → normal route vs flood-safe route along real streets to the nearest of 28 major hospitals: extra minutes, a different hospital, or "cut off" | ✅ real routing |
| 4 | Decision card: send to which hospital, minutes, roads to avoid | ✅ |
| 5 | **Send to driver**: WhatsApp / SMS / copy a message with a link; the driver's phone view shows the route and starts Google Maps navigation along the flood-safe path | ✅ |
| 6 | "How reliable is this?": score vs reported flood spots, elevation-only baseline, bootstrap interval, spot-by-spot hits and misses, sensitivity, 3 data findings, limits | ✅ real numbers |
| 7 | City "fix-first" view | ❌ next step (not built) |

**Real example (very heavy day):** a patient at Chembur Circle. The normal route to K.J. Somaiya Hospital crosses roads likely to flood; the flood-safe route goes to Rajawadi Hospital, about 2.9 minutes longer.

**Results, reported as they are:** on 13 reported waterlogging spots the score's AUC is 0.46 (95% CI 0.32–0.61); the elevation-only baseline is 0.45 and random is 0.50. It ranks real local dips high (Churchgate, Sion flood gauges) and misses spots under flyovers and rail embankments (Gandhi Market, Milan Subway), because the 30 m elevation model is a surface model. Weights were fixed before this test and were not changed after it. Details: [docs/METHOD_REPORT.md](docs/METHOD_REPORT.md).

## How it works

```
OpenStreetMap roads + hospitals + waterways ─┐
Copernicus 30 m elevation ───────────────────┼─► flood-proneness score per road segment
                                             │        (relative elevation, absolute height,
Open-Meteo rainfall history / forecast ──────┘         distance to water, underpass flag)
                                                          │
Rain day ──► IMD category ──► share of roads flagged ─────┤  (assumption, shown + sensitivity-tested)
                                                          ▼
                                          route: normal graph vs graph with flagged roads blocked
                                                          │
Reported flood spots (BMC / news) ───────────────────────► validation (lift, AUC vs baselines)
```

All heavy work is precomputed into small files in `data/processed/`, so the app starts instantly and judges need no keys.

## Data (all free and public)

| Layer | Source | Details |
|---|---|---|
| Roads, hospitals, waterways | OpenStreetMap | [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) |
| Elevation | Copernicus DEM GLO-30 (AWS Open Data) | same |
| Rainfall history + forecast | Open-Meteo | same |
| Rain categories | IMD (India Meteorological Department) | same |
| Validation spots | BMC / traffic police / news reports (hand-compiled) | `data/validation/flood_spots.csv` |

Full licences, access dates and processing steps: [docs/DATA_STATEMENT.md](docs/DATA_STATEMENT.md).

## Tech stack

| Part | Choice | Why |
|---|---|---|
| Language | Python 3.11/3.12 (pipeline + API), TypeScript (UI) | Python for all data and routing logic, written once |
| Road graph + routing | OSMnx, NetworkX (Dijkstra on free-flow travel time) | Free, standard, < 0.2 s per route |
| Elevation | rasterio (Copernicus tiles over HTTP) | No account needed |
| Data handling | pandas, geopandas, numpy, scipy, shapely | |
| API | FastAPI + uvicorn | Thin HTTP layer over the shared `floodroute/` library |
| UI | Next.js (TypeScript, Tailwind) + MapLibre GL, CARTO light basemap | Desktop dispatcher view + phone driver view |
| Messaging | `wa.me` and `sms:` links, Google Maps directions URL | Free links; a person taps send; no paid APIs or keys |

## Run it locally (no keys, no paid services)

Two terminals, from the project folder.

**1 · API** (reads the committed files in `data/processed/`):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

**2 · Web app:**

```powershell
cd web
npm install
"NEXT_PUBLIC_API_BASE=auto" | Out-File -Encoding ascii .env.local   # API = same host as the page, port 8000
npm run build:css
npm run dev -- --hostname 0.0.0.0
```

Open **http://localhost:3000**. Demo path: pick a *very heavy* day → click **Chembur Circle** → read the decision card → **Send to driver** → **How reliable is this?**

**On a phone (same Wi-Fi):** open the dashboard at `http://<laptop-ip>:3000` (the IP is printed by `ipconfig`). Driver links sent from there open on any phone on the same network. Windows may ask once to allow Python and Node through the firewall.

The hosted copies (Vercel + Render, links at the top) redeploy from `main`; the local run above is the reference demo.

## Rebuild the data from scratch (optional)

```powershell
pip install -r requirements-pipeline.txt
python pipeline/01_fetch_osm.py            # roads, hospitals, waterways (OSM, cached)
python pipeline/02_fetch_elevation.py      # Copernicus elevation per road node
python pipeline/04_score_roads.py          # flood-proneness score -> graph.pkl, edges_scored.parquet
python pipeline/geocode_and_plot_spots.py  # geocode reported flood spots
python pipeline/01b_build_hospitals.py     # OSM hospitals -> hospitals.json (28 destinations from config.yaml)
python pipeline/03_fetch_rain.py           # rain archive + forecast -> scenarios.json
python pipeline/05_validate.py             # score vs reported spots -> validation_results.json
python pipeline/06_precompute.py           # data findings -> eda_summary.json
```

Needs internet (OSM Overpass, Copernicus tiles on AWS, Open-Meteo); downloads are cached in `data/raw/`. Setup help for Windows: [docs/SETUP.md](docs/SETUP.md).

## Repo layout

```
FloodRoute/
├─ README.md                  this file
├─ CLAUDE.md                  instructions for Claude Code (project rules, contracts)
├─ config.yaml                bbox, score weights, rain→flag table (one place for all assumptions)
├─ requirements.txt           app dependencies (light, used for deployment)
├─ requirements-pipeline.txt  + heavy geo dependencies for rebuilding data
├─ docs/                      plan, data sources, data contract, UI spec, judging, data statement, setup
├─ prompts/KICKOFF_PROMPT.md  paste-ready prompts for Claude Code
├─ pipeline/                  numbered scripts 01..06 (see "Rebuild the data")
├─ floodroute/                shared library (config, scoring, flagging, routing)
├─ api/                       FastAPI app (+ backend interface, fixture backend)
├─ web/                       Next.js UI (mobile driver view + desktop dispatcher view)
├─ design/stitch/             Google Stitch exports used as the visual reference
├─ presentation/              HTML deck, speaker script, team checklist
├─ data/raw/                  downloads (large files git-ignored)
├─ data/processed/            committed outputs the app reads
├─ data/validation/           flood_spots.csv (hand-compiled, with source URLs)
└─ assets/                    problem statement PDF, screenshots, backup recording
```

## Docs

- [docs/FINAL_PROJECT.md](docs/FINAL_PROJECT.md) — the final product: user, problem, why it differs from Google Maps, feature set
- [docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md) — every step explained in plain language with a worked example
- [docs/METHOD_REPORT.md](docs/METHOD_REPORT.md) — method, validation results, sensitivity, limitations
- [docs/DATA_STATEMENT.md](docs/DATA_STATEMENT.md) — datasets, access dates, licences, fields, preprocessing
- [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) — where each dataset comes from and how it is accessed
- [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md) — file formats and API endpoints
- [docs/UI_SPEC.md](docs/UI_SPEC.md) — layout, colours, interactions, wording rules
- [docs/JUDGING.md](docs/JUDGING.md) — rubric mapping, likely Q&A
- [presentation/](presentation/) — HTML slide deck (`index.html`), speaker script, team checklist

## Limitations

- Elevation is not flooding. The score is a **flood-prone road proxy**; drainage capacity, pumps, tides and blocked drains are not modelled because that data is not public.
- The Copernicus DEM is a surface model (includes buildings and vegetation) and is coarse in dense areas; scores are used as a relative ranking, not as depths.
- The rain-to-flagged-roads mapping is an **assumption** (see `config.yaml`); the sensitivity chart shows how results change with it.
- Reported flood spots are biased toward busy, visible roads and are few (13 usable); validation numbers carry wide uncertainty.
- Routing uses free-flow travel times (OSM speed limits), no live traffic, on main roads only, so "cut off" means no flood-safe *main-road* route.
- Ambulances are routed to the nearest of 28 major hospitals, a team-curated list in `config.yaml` (an assumption); KEM and Cooper are not tagged as hospitals in OSM. Bed and casualty availability are unknown.
- Replay rainfall comes from a weather reanalysis and can understate extreme point rainfall.
- A prototype for decision support, not an official warning system.

## Attribution

- Map data © OpenStreetMap contributors (ODbL).
- Contains modified Copernicus DEM data (Copernicus DEM GLO-30, © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA; all rights reserved) — confirm the exact required wording against the licence when finalising.
- Weather data: Open-Meteo.com (confirm licence/attribution wording when finalising).
- Rain categories: India Meteorological Department.

## Team and status

Update the checklist in [docs/PLAN.md](docs/PLAN.md) as you go.
