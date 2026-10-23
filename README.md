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

## What the app does (Version 1)

| # | Feature | Status |
|---|---|---|
| 1 | Pick a rain day: a real past heavy-rain day (from public weather data) or tomorrow's forecast | Tier A |
| 2 | Map shows the flood-prone roads for that rain day | Tier A |
| 3 | Click the patient location → normal route and flood-safe route to a hospital, with added minutes or "cut off" | Tier A |
| 4 | Proof panel: score vs reported flood spots (lift over random and over an elevation-only baseline) + limitations | Tier A |
| 5 | City view: hospital access ranking and a "fix-first" road list with a slider | Tier B (if time) |
| 6 | Hospital-need dropdown, plain-language advisory | Tier C (optional) |

Tiers are explained in [docs/PLAN.md](docs/PLAN.md).

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
| Language | Python 3.11 | One language for pipeline and app |
| Road graph + routing | OSMnx, NetworkX | Free, standard, fast enough on main roads |
| Elevation | rasterio (reads the Copernicus tiles over HTTP) | No account needed |
| Data handling | pandas, geopandas, numpy, scipy | |
| API | FastAPI + uvicorn | Thin HTTP layer over the same Python routing code the pipeline uses |
| UI | Next.js (TypeScript, Tailwind) + MapLibre GL | Custom mobile-first driver view and desktop dispatcher view; designed in Google Stitch |
| Hosting | One free Docker service (FastAPI serves the built UI) | Precomputed files in the repo, no secrets |
| Optional | Groq free tier / local Ollama for a text advisory | Behind a flag; template fallback; **core never needs it** |

## Run it (judges: no keys, no paid services)

```bash
python -m venv .venv
# Windows PowerShell:  .\.venv\Scripts\Activate.ps1     macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cd web && npm install && npm run build && cd ..   # builds the UI into web/out/
uvicorn api.main:app --port 8000                   # open http://localhost:8000
```

The API reads the committed files in `data/processed/`. "Tomorrow's forecast" calls the free Open-Meteo API and falls back to a cached value if offline.

## Rebuild the data from scratch (optional)

```bash
pip install -r requirements-pipeline.txt
python pipeline/run_all.py
```

Needs internet (OSM Overpass, Copernicus tiles on AWS, Open-Meteo). Step-by-step setup for Windows: [docs/SETUP.md](docs/SETUP.md).

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
├─ pipeline/                  numbered scripts 01..06 + run_all.py
├─ floodroute/                shared library (config, scoring, flagging, routing)
├─ api/                       FastAPI app (+ backend interface, fixture backend)
├─ web/                       Next.js UI (mobile driver view + desktop dispatcher view)
├─ design/stitch/             Google Stitch exports used as the visual reference
├─ data/raw/                  downloads (large files git-ignored)
├─ data/processed/            committed outputs the app reads
├─ data/validation/           flood_spots.csv (hand-compiled, with source URLs)
└─ assets/                    problem statement PDF, screenshots, backup recording
```

## Docs

- [docs/PLAN.md](docs/PLAN.md) — scope tiers, hour-by-hour plan, checkpoints, fallbacks, who does what
- [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) — where to get each dataset, exact access method, limits
- [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md) — file formats and the backend interface (lets UI and data work in parallel)
- [docs/UI_SPEC.md](docs/UI_SPEC.md) — layout, colours, interactions, copy text, performance rules
- [docs/JUDGING.md](docs/JUDGING.md) — rubric mapping, demo script, likely Q&A, submission checklist
- [docs/DATA_STATEMENT.md](docs/DATA_STATEMENT.md) — submission data statement (fill access dates)
- [docs/SETUP.md](docs/SETUP.md) — install and run on Windows, deployment steps
- [prompts/KICKOFF_PROMPT.md](prompts/KICKOFF_PROMPT.md) — prompts to start Claude Code

## Limitations

- Elevation is not flooding. The score is a **flood-prone road proxy**; drainage capacity, pumps, tides and blocked drains are not modelled because that data is not public.
- The Copernicus DEM is a surface model (includes buildings and vegetation) and is coarse in dense areas; scores are used as a relative ranking, not as depths.
- The rain-to-flagged-roads mapping is an **assumption** (see `config.yaml`); the sensitivity chart shows how results change with it.
- Reported flood spots are biased toward busy, visible roads and are few (tens, not thousands); validation numbers carry wide uncertainty.
- Routing uses free-flow travel times, no live traffic. Hospital choice is the nearest reachable hospital; bed and staff availability are unknown.
- Replay rainfall comes from a weather reanalysis and can understate extreme point rainfall.
- A prototype for decision support, not an official warning system.

## Attribution

- Map data © OpenStreetMap contributors (ODbL).
- Contains modified Copernicus DEM data (Copernicus DEM GLO-30, © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA; all rights reserved) — confirm the exact required wording against the licence when finalising.
- Weather data: Open-Meteo.com (confirm licence/attribution wording when finalising).
- Rain categories: India Meteorological Department.

## Team and status

Update the checklist in [docs/PLAN.md](docs/PLAN.md) as you go.
