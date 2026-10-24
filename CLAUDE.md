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
2. **Synthetic data only for UI testing**, only inside `api/fixtures/` (backend) and `web/src/lib/mock/` (frontend), and whenever it is used the app must show a visible ribbon: "SYNTHETIC UI FIXTURE — not real data". The deployed app must use real processed data. The API must never report `data_mode: real` while returning fixture data for any endpoint.
3. **No API keys in the repo, no paid services.** The core app and pipeline must run with no keys and no LLM. Optional LLM features read keys from environment variables only and have a template fallback.
4. **Wording:** always say "flood-prone road proxy" / "likely to flood". Never say "flooded", "flood forecast" or "predicts floods" about the model output.
5. **The rain → share-of-roads-flagged mapping is an assumption.** It lives in `config.yaml`, is shown in the UI, and has a sensitivity analysis. Do not hide it.
6. **Validation is reported honestly:** lift/AUC vs random and vs an elevation-only baseline, with sample size and uncertainty. No cherry-picking of weights after seeing validation results; if weights are changed, say so in the method report.
7. **Respect data terms:** OSM and Copernicus attribution, Open-Meteo fair use, no scraping against terms. Cache downloads to disk; be gentle with Overpass.
8. **Scope guard:** build Tier A first (see `docs/PLAN.md`). Do not start Tier B/C until Tier A works end to end. Never add features from the "Cut" list.

## Current status and fix backlog (updated 2026-10-24 — keep this section current)

Final round: 10 min presentation + 5 min Q&A, live demo optional. **The demo runs locally on the presenter's laptop; deployment is out of scope until after the final** (decided 2026-10-24). The agreed product definition, user, differentiation, UI changes and final plan are in `docs/FINAL_PROJECT.md`. Read it before any new work. The core idea must not change. Deck, script and team checklist are in `presentation/` (`index.html`, `SCRIPT.md`, `TEAM_CHECKLIST.md`). The deck describes the app **after** the P0 fixes below; `TEAM_CHECKLIST.md` §3 lists which slide claims depend on which fix.

**What is real (in code on main; the live site updates once Render/Vercel redeploy):** flagged roads (same rule as routing: bridges excluded, no feature cap), routing (`floodroute/routing.py`), hospitals (`data/processed/hospitals.json`), destination marker + fit-to-route on the map. **Still fixture:** city view (Tier B, not in the final; next-steps slide only).

**Product focus (agreed with the user 2026-10-24):** at most two differentiating features. (1) Headline: today's forecast by default → one answer card → "Send to driver" via WhatsApp (`wa.me` prefilled text) and SMS (`sms:` link), opening the phone view with the route; a person taps send (no paid WhatsApp/SMS APIs). (2) If time: "fix first" city view. No chat agent, no LLM in the core; an LLM may only rephrase/translate the briefing with a template fallback and a number check.

**Decisions (2026-10-24):** routes go to the nearest of 28 major hospitals = exact OSM names in `config.yaml` `hospitals.destination_names` (an ASSUMPTION, shown in Limits; KEM and Cooper are not `amenity=hospital` in OSM). Routing uses free-flow times from OSM speeds. The graph has main roads only, so `cut_off` means "no flood-safe main-road route" (~24% of in-area grid points at 15% share). Real demo cases at 15%: Chembur Circle → ok, +2.9 min, K.J. Somaiya → Rajawadi; Colaba Causeway → cut_off; Bandra West → no_change; Hindmata → ok +0.6.

**Real data already on disk (not yet wired into the API):**
- `data/raw/rain_archive.csv`: Open-Meteo daily rain 2005–2025, 7,670 days, 0 missing. Top day 2016-09-22 = 251.1 mm. 26 Jul 2005 = 69.6 mm in the reanalysis (the gauge reported ~944 mm, so reanalysis understates extremes).
- `data/raw/hospitals_osm.json`: 569 OSM hospital features in the bbox, 550 named, 34 tagged `emergency=yes` (some are small clinics).
- `data/processed/graph.pkl` (5,041 nodes, 9,746 edges, OSMnx 2.1.1) and `edges_scored.parquet` (470 bridges, 21 underpasses).

**Real validation result (recomputed 2026-10-23 from `validation_spots_evaluated.csv` + `edges_scored.parquet`):** 13 of 14 spots within 150 m of a road; AUC 0.46 (bootstrap 95% CI 0.32–0.61, 2,000 resamples, seed 42); elevation-only baseline 0.45; random 0.50; 1/13 spots in the top 15% flagged. The numbers hard-coded in `RealBackend.validation()` (AUC 0.632, catch rate 0.286, CI [0.49, 0.76]) do NOT match the data and must be removed. Do not re-tune weights to improve this; if weights change, disclose it.

**P0 backlog (do in this order; tick in `presentation/TEAM_CHECKLIST.md` §2):**
1. ✅ DONE 2026-10-24 — Real routing in `floodroute/routing.py`: NetworkX shortest path by `travel_time_s` on `graph.pkl` to the nearest hospital; same again with flagged edges removed (`floodroute/flagging.py`); return coords along edge geometry; statuses `ok | cut_off | no_change | outside_area`. Wire into `RealBackend.route`.
2. Real rain scenarios: `pipeline/03_fetch_rain.py` → `data/processed/scenarios.json` (top-10 replay days + forecast, IMD category and flag share from `config.yaml`). Wire into `RealBackend.scenarios`.
3. ✅ DONE 2026-10-24 — Real hospitals: named OSM hospitals snapped to graph nodes (`pipeline/01b_build_hospitals.py`) → `data/processed/hospitals.json`. Wire into `RealBackend.hospitals`.
4. Honest validation: `pipeline/05_validate.py` → `validation_results.json`; `RealBackend.validation` reads it; the reliability page shows n, AUC, CI, baseline and misses.
5. Honest data mode: fixture-backed endpoints show the fixture ribbon until replaced.
6. ✅ DONE 2026-10-24 — Map UX: after a click, draw the normal route (dashed blue) and safe route (solid teal) from the patient pin along streets, fit bounds, and highlight the destination hospital.
7. Backup demo recording at `assets/demo_backup.mp4`.
7b. Known doc mismatches to regenerate from scripts: `docs/METHOD_REPORT.md` (mean rank 52.2% / 7 of 14 vs recomputed 47.4% / 6 of 14; says routing to all 569 hospitals), `docs/DATA_STATEMENT.md` and `docs/SLIDES_OUTLINE.md` (7,305 rain days vs 7,670 in the archive; '+14 min' Hindmata example is fixture output).
8. ✅ DONE 2026-10-24 — Feature 1: default = forecast if it flags roads, else first very-heavy real day; `DecisionCard` (send to / minutes / avoid); "Send to driver" (WhatsApp `wa.me`, SMS, copy) via `web/src/lib/dispatch.ts`; driver phone view `web/src/app/driver/page.tsx` with "Start navigation (Google Maps)" (plain directions URL, our safe route as waypoints).
9. ✅ DONE 2026-10-24 — Real rain scenarios (`pipeline/03_fetch_rain.py`), real validation (`pipeline/05_validate.py`, AUC 0.463, CI 0.322–0.613, elevation-only 0.447, 1/13 in top 15%), real EDA (`pipeline/06_precompute.py`); `RealBackend` reads them; fake numbers removed from `ReliabilityModal` (incl. the fake fix-top-N simulator) and `/reliable` reuses it; `METHOD_REPORT.md`, `DATA_STATEMENT.md`, `SLIDES_OUTLINE.md` corrected.
10. ✅ DONE 2026-10-24 — Map reading aids: route time bubbles, red "!" markers on flagged stretches of the normal route, rejected normal hospital greyed, other flagged roads faded when a route is shown.

Phone demo: `web/.env.local` has `NEXT_PUBLIC_API_BASE=auto` (API = page host, port 8000). Run the API with `--host 0.0.0.0` and Next with `--hostname 0.0.0.0`, open the dashboard at http://<laptop-ip>:3000, and the driver links work on phones on the same Wi-Fi (Windows may ask to allow Python/Node through the firewall). The user records the backup video themselves; do not run tests unless asked (user preference 2026-10-24).

Local run: `.claude/launch.json` has `api` (uvicorn on :8000) and `web` (Next.js on :3000); `web/.env.local` sets `NEXT_PUBLIC_API_BASE=http://localhost:8000` (git-ignored).

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
