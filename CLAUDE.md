# CLAUDE.md — FloodRoute

Claude Code: read this file first, then `docs/PLAN.md`, `docs/DATA_CONTRACT.md`, `docs/DATA_SOURCES.md`, `docs/UI_SPEC.md`, `docs/JUDGING.md`. Do not ask the user to re-explain anything that is written there.

## Project

FloodRoute is a hackathon submission for HackAMatch 1.0 (CityPulse: Predict. Explain. Act.). Build time left is only a few hours, and submission is tomorrow. A working, honest, good-looking V1 beats breadth.

- **City:** Mumbai (island city + suburbs up to Andheri / Kurla), bbox in `config.yaml`.
- **Users:** ambulance dispatchers; the city flood-control team.
- **Decision supported:** on a heavy-rain day, which route should an ambulance take, which hospitals lose access, and which roads should be fixed first.
- **Core loop (from the brief):** Discover (flood-prone roads) → Predict/estimate (delay under a rain day) → Explain (why a road is flagged, how well the score matches real reported spots) → Act (safe route, fix-first list).

## Hard rules (never break these)

1. **No fabricated data, metrics or results.** Every number shown in the app, docs or slides must come from code run on real public data. If a result is weak, report it as it is.
2. **Synthetic data only for UI testing**, only inside `app/fixtures/`, and whenever it is used the app must show a visible ribbon: "SYNTHETIC UI FIXTURE — not real data". The deployed app must use real processed data.
3. **No API keys in the repo, no paid services.** The core app and pipeline must run with no keys and no LLM. Optional LLM features read keys from environment variables only and have a template fallback.
4. **Wording:** always say "flood-prone road proxy" / "likely to flood". Never say "flooded", "flood forecast" or "predicts floods" about the model output.
5. **The rain → share-of-roads-flagged mapping is an assumption.** It lives in `config.yaml`, is shown in the UI, and has a sensitivity analysis. Do not hide it.
6. **Validation is reported honestly:** lift/AUC vs random and vs an elevation-only baseline, with sample size and uncertainty. No cherry-picking of weights after seeing validation results; if weights are changed, say so in the method report.
7. **Respect data terms:** OSM and Copernicus attribution, Open-Meteo fair use, no scraping against terms. Cache downloads to disk; be gentle with Overpass.
8. **Scope guard:** build Tier A first (see `docs/PLAN.md`). Do not start Tier B/C until Tier A works end to end. Never add features from the "Cut" list.

## Scope tiers (summary)

- **Tier A (must ship):** rain-day picker; flood-prone road layer; patient location → normal and flood-safe routes with added minutes or "cut off"; proof panel (validation + EDA); limits panel.
- **Tier B (if A is done):** city view — hospital access ranking, criticality ranking of flagged roads, "fix top N" slider.
- **Tier C (optional):** hospital-need dropdown (hand-curated table), template advisory (optional Groq/Ollama), browser GPS.
- **Cut:** voice, vector RAG, underground drainage/pumps, live traffic, population weighting, Databricks.

## Architecture

```
pipeline/01_fetch_osm.py          roads, hospitals, waterways  → data/raw/
pipeline/02_fetch_elevation.py    Copernicus tiles (HTTP window reads) → node elevations
pipeline/03_fetch_rain.py         Open-Meteo archive (replay days) + forecast (cached)
pipeline/04_score_roads.py        flood-proneness score → data/processed/graph.pkl, edges_scored.parquet
pipeline/05_validate.py           score vs data/validation/flood_spots.csv → validation_results.json
pipeline/06_precompute.py         scenarios.json, optional criticality / city view, EDA figures
pipeline/run_all.py               runs 01..06, idempotent, uses cached downloads
floodroute/                       shared library: config, scoring, flagging, routing (used by pipeline AND api)
api/main.py                       FastAPI app: thin HTTP layer over the Backend (endpoints in docs/DATA_CONTRACT.md)
api/backend.py                    Backend interface; FixtureBackend (api/fixtures/) and RealBackend
web/                              Next.js (App Router, TypeScript, Tailwind, MapLibre GL) UI (see docs/UI_SPEC.md)
design/stitch/                    Google Stitch exports (PNG + HTML/CSS + tokens): the visual reference for web/
```

Key design rule: **flagging and routing logic lives once in `floodroute/`**, imported by both pipeline and api, so the UI can never disagree with the evaluation. The frontend never computes scores, flags or routes; it only calls the API.

Stack decision (changed from Streamlit): Python stays for everything data-related; Next.js is used only for the UI. No Node backend, no database. For deployment, `web/` is built as a static export (`output: 'export'`) and served by FastAPI, so there is one service and one URL.

## Commands

```bash
python -m venv .venv && source .venv/bin/activate        # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements-pipeline.txt                 # full (pipeline + api)
python pipeline/run_all.py                               # rebuild data/processed/
uvicorn api.main:app --reload --port 8000                # run the API on real data
FLOODROUTE_BACKEND=fixture uvicorn api.main:app --reload --port 8000   # API on synthetic fixture (PowerShell: $env:FLOODROUTE_BACKEND="fixture")
cd web && npm install && npm run dev                     # UI on http://localhost:3000 (calls the API on :8000)
cd web && npm run build                                  # static export to web/out, served by FastAPI in production
pytest -q                                                # tiny smoke tests only
```

## Conventions

- Python 3.11, type hints on public functions, `pathlib` for all paths (user is on Windows), no shell-specific code in scripts.
- Read all tunables (bbox, weights, rain→share table, snap distance) from `config.yaml`. No magic numbers in code.
- Every pipeline script: idempotent, caches downloads in `data/raw/`, prints a short summary (counts, min/median/max) when done.
- API performance: load the graph once at startup (module-level / lifespan), `lru_cache` flagged GeoJSON per (scenario, share), never recompute scores in the API; send flagged edges only (not the whole network).
- Frontend: TypeScript, Tailwind, MapLibre GL JS with a free CARTO Positron (light) basemap (keep the attribution); one typed API client in `web/lib/api.ts` mirroring docs/DATA_CONTRACT.md; mobile-first responsive layout (driver view at 390 px, dispatcher view at 1366 px); no keys, no analytics.
- Keep `data/processed/` small (target < 50 MB total, no single file > 50 MB) because it is committed to GitHub.
- Tests: only smoke tests (route exists on a toy graph, flagging picks the top share, config loads). Do not spend time on more.

## Working style

- Follow the phases in `prompts/KICKOFF_PROMPT.md` and tick checkboxes in `docs/PLAN.md` as each is done.
- Run the code and show real numbers before claiming something works. Never write "verified" about something not executed.
- At **Checkpoint 1** (flood-proneness map + sanity check against known spots) stop and report to the user.
- If a step fails twice or takes more than ~20 minutes, take the fallback listed in `docs/PLAN.md` and tell the user.
- Do not silently change the bbox, weights or rain→share table; propose the change with the reason.
- Commit after each phase with a clear message. Do not commit `.venv`, large raw files or secrets.

## Known unknowns (verify, do not assume)

- Exact Copernicus tile URL pattern and file size (see `docs/DATA_SOURCES.md`).
- How complete OSM waterway tagging is for Mumbai (report counts).
- OSMnx version differences (bbox argument order changed between v1 and v2 — check `ox.__version__`).
- Whether the Open-Meteo archive shows extreme Mumbai days at realistic magnitudes (state the finding either way).
