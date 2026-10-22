# PLAN — scope, timeline, checkpoints, fallbacks

Total build time left: roughly 6–7 hours. Times below are hours from the start of coding. Tick boxes as you go.

## Scope tiers

**Tier A — must ship (everything the judges will actually see)**
1. Rain-day picker: top-10 real rainy days from Open-Meteo history + tomorrow's forecast.
2. Map with flood-prone roads for the chosen day.
3. Patient location (click map or preset) → normal route and flood-safe route, added minutes, or "cut off".
4. Proof panel: validation vs reported spots, 3 EDA findings, sensitivity chart.
5. Limits panel.
6. Docs: data statement, method report, README, slides, backup recording.

**Tier B — only if Tier A works end to end**
- City view: hospital access ranking, criticality ranking of flagged roads, "fix top N roads" slider.

**Tier C — optional, only after Tier B**
- Hospital-need dropdown (hand-curated table of 10–12 hospitals, each with a source URL).
- Template advisory text; optional Groq/Ollama rewrite behind a flag.
- Browser GPS "use my location".

**Cut (do not build):** voice, vector RAG, underground drainage/pumps, live traffic, population weighting, Databricks.

## Timeline

### H0:00–0:45 — Setup and reachability (Checkpoint 0)
- [x] Python 3.11 venv, `pip install -r requirements-pipeline.txt` (see docs/SETUP.md)
- [x] Reachability test: Overpass/OSM, Copernicus tile URL, Open-Meteo archive + forecast
- [x] Package skeleton: `floodroute/`, `pipeline/`, `app/`, `config.yaml` loads
- [x] OSM roads (filtered), hospitals, waterways downloaded and cached; counts printed

*In parallel (teammate, no code):* geocode and review `data/validation/flood_spots.csv` (target 15–20 spots with source URLs).

### H0:45–1:30 — Flood-proneness map (Checkpoint 1, GO / NO-GO)
- [x] Elevation sampled for road nodes (Copernicus HTTP window reads)
- [x] Score computed (4 components, rank-normalised, weights from config)
- [x] Static map coloured by score renders
- [x] Sanity check: the best-known spots (Hindmata, Gandhi Market/Sion, Milan Subway, Chembur Circle, Antop Hill) — where do they rank?

**GO** if the map renders and the known spots are mostly in the upper part of the ranking. **A weak result is still GO** (report it honestly) as long as the pipeline works.
**NO-GO** if roads or elevation cannot be loaded by H1:30 → fallbacks below.

### H1:30–3:00 — Validation, rain days, routing (Checkpoint 2)
- [ ] `05_validate.py`: lift / precision-at-k / AUC vs random and vs elevation-only; bootstrap CI; sensitivity to weights and flag share
- [ ] `03_fetch_rain.py`: top-10 replay days, IMD category, flag share per day; forecast cached
- [ ] `floodroute/routing.py`: nearest-hospital route on normal graph and on graph with flagged roads removed; "cut off" handled
- [ ] Smoke test: ≥5 test points give sensible results (print them)
- [ ] `data/processed/` written and under size limit

### H0:00–1:30 — Design (parallel, teammate B, before UI code)
- [ ] Generate Stitch designs from `docs/STITCH_PROMPT.md`; export PNG + HTML/CSS + tokens to `design/stitch/`

### H1:30–4:30 — API + UI (parallel, teammate B)
- [ ] `api/` FastAPI with `FixtureBackend` and the endpoints in docs/DATA_CONTRACT.md §3b (about 30 min)
- [ ] `web/` Next.js app built against the **fixture backend**, following docs/UI_SPEC.md and `design/stitch/` (mobile and desktop)
- [ ] Switch to the real backend when Checkpoint 2 is done (`FLOODROUTE_BACKEND=real`)
- [ ] Fallback if the Next.js UI is not working by H3:30: ship the working core (rain picker, map, route, result) without the polish tabs, in that order

### H3:00–4:30 — Integration and Tier B (only if time)
- [ ] App runs end to end on real processed data
- [ ] 3 EDA charts generated from real data (see docs/JUDGING.md)
- [ ] Tier B city view (criticality + fix-first slider) if everything above is green

### H4:30–5:30 — Deploy and docs (Checkpoint 3)
- [ ] Push to GitHub; `npm run build` in `web/`; deploy one Docker service (FastAPI serving `web/out/`) on Render / Hugging Face Spaces / Railway free tier; open the URL in a private window on desktop and phone
- [ ] `docs/DATA_STATEMENT.md` filled (access dates, fields, steps)
- [ ] `docs/METHOD_REPORT.md` (EDA, method, evaluation, limitations) with figures
- [ ] README final, attribution checked

### H5:30–6:30 — Buffer
- [ ] 2-minute backup screen recording saved in `assets/`
- [ ] Slides (only needed if shortlisted; draft the outline now using docs/JUDGING.md)
- [ ] Fresh-clone test: new venv, `pip install -r requirements.txt`, `uvicorn api.main:app`, `cd web && npm install && npm run build`, open the app

## Fallbacks (take them early, do not debug for hours)

| Problem | Fallback |
|---|---|
| Copernicus tiles not reachable or slow | Open-Meteo elevation API (max 100 coordinates per request) for road nodes; coarser, say so |
| Overpass slow or times out | Shrink bbox to island city (south of ~19.05 N), cache result, retry later |
| Graph too big / routing slow | Keep only motorway/trunk/primary/secondary; reduce bbox; precompute origin sample only |
| Score ranks known spots no better than random | Still ship: report honestly, frame as prioritisation tool, show sensitivity and elevation-only comparison |
| Nothing renders by H2:30 | Switch to the Open-Meteo-only "City Stress Radar" (10 cities, heat + rain + PM2.5 percentile anomalies). Ask Claude (planning chat) for that plan; do not start it before this point |

## Who does what (adapt to team size)

| Role | Owns | First tasks |
|---|---|---|
| A — Data/pipeline | `pipeline/`, `floodroute/`, `config.yaml` | Checkpoints 0–2 |
| B — UI | `api/`, `web/`, `design/stitch/` | Stitch designs, FastAPI + fixture, Next.js UI from docs/UI_SPEC.md |
| C — Evidence/docs | `data/validation/`, `docs/DATA_STATEMENT.md`, `docs/METHOD_REPORT.md`, slides | Flood-spot list, source URLs, access dates |

Solo? Do A first to Checkpoint 1, then B, then C. Claude Code can do most of A and B; you review and run.

## Submission checklist (from the brief)

- [ ] Working prototype (deployed URL + local run instructions)
- [ ] Source code with setup instructions and dependency list
- [ ] Data statement (links, access dates, licences, fields, preprocessing)
- [ ] Analysis and method (EDA, baseline/method, evaluation, limitations)
- [ ] Presentation slides (if shortlisted)
- [ ] Reproducibility notes (runs without paid services, secret keys or private data)
- [ ] Backup screenshots/recording
