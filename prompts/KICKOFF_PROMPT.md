# KICKOFF PROMPTS — paste into Claude Code (opened in this folder)

Claude Code reads `CLAUDE.md` automatically. These prompts add the order of work. Use **Prompt A** for the data/pipeline/integration work and **Prompt B** for the UI. They can run at the same time in two separate Claude Code windows because they touch different folders (A: `pipeline/`, `floodroute/`, `config.yaml`, `data/`; B: `app/`). If you are solo, run A first until Checkpoint 1, then B.

---

## Prompt A — data, pipeline, integration (the master prompt)

```text
You are the lead engineer for FloodRoute, a hackathon project with about 6 hours of build time left. Read these first, in order, and do not ask me to re-explain anything in them:
CLAUDE.md, docs/PLAN.md, docs/DATA_CONTRACT.md, docs/DATA_SOURCES.md, docs/UI_SPEC.md, docs/JUDGING.md, config.yaml, data/validation/flood_spots.csv.

Follow the hard rules in CLAUDE.md (no fabricated results, no keys, "flood-prone road proxy" wording, honest validation). Work in phases. Stop and wait for me ONLY at Checkpoint 1; otherwise keep going, commit after each phase, and tick the boxes in docs/PLAN.md.

PHASE 0 — Environment and reachability (about 30 min)
1. Create .venv, install requirements-pipeline.txt (Windows PowerShell; use pathlib everywhere).
2. Create the package skeleton from CLAUDE.md: floodroute/ (config.py, scoring.py, flagging.py, routing.py, io.py), pipeline/01..06 + run_all.py, app/ (empty for now; another window builds the UI).
3. Test that these are reachable from this machine and print a table (source | reachable | note): OSM/Overpass, the Copernicus tile URL pattern in docs/DATA_SOURCES.md (HEAD request, file size), Open-Meteo archive and forecast. If the tile URL pattern is wrong, find the right one from the readme at https://copernicus-dem-30m.s3.amazonaws.com/readme.html and fix docs/DATA_SOURCES.md.

PHASE 1 — Flood-proneness map (CHECKPOINT 1: STOP AND REPORT)
1. 01_fetch_osm.py: roads (road_filter in config), hospitals, waterways; cache to data/raw/. Print node/edge/hospital/waterway counts. Check the installed OSMnx version for bbox argument order.
2. 02_fetch_elevation.py: sample Copernicus GLO-30 at all road nodes using HTTP window reads (rasterio) — do not download whole tiles unless that is the only option. Report nodata count.
3. 04_score_roads.py: compute the four components, rank-normalise, weighted score with weights from config.yaml, flood_rank_pct; never flag bridges. Write data/processed/graph.pkl and edges_scored.parquet per docs/DATA_CONTRACT.md.
4. Geocode the `sourced` rows in data/validation/flood_spots.csv with osmnx.geocode (once, cache), write lat/lon back to the CSV, and make a quick matplotlib map showing the geocoded points so I can eyeball them.
5. Make a static map of edges coloured by flood_score with the spots overlaid, and print: counts, score distribution, and the rank percentile of every spot (where does Hindmata, Gandhi Market, Milan Subway, Chembur Circle, Antop Hill rank?).
STOP here. Show me the numbers and the map image path. Wait for my "continue".

PHASE 2 — Rain days, validation, routing (about 90 min)
1. 03_fetch_rain.py: Open-Meteo archive for config dates; top-N rainiest days; IMD category per day; flag_share from config; forecast for tomorrow cached with fetch time (offline fallback). Write data/processed/scenarios.json. State honestly whether 2005-07-26 appears and at what magnitude.
2. 05_validate.py: for each flag share in config, recall of reported spots in the flagged set vs expected by chance (lift), AUC of the score vs other segments, the same for an elevation-only baseline, bootstrap CI, and a sensitivity grid (weights perturbed, flag share x0.5/1/1.5/2). Write validation_results.json. Report weak results as they are; do not tune weights after looking, or if you do, log it in docs/METHOD_REPORT.md.
3. floodroute/routing.py + 06_precompute.py: nearest-hospital route on the normal graph and on the graph without flagged edges; statuses ok / cut_off / no_change / outside_area; return the dict shape from docs/DATA_CONTRACT.md. Print results for at least 6 test points (including the sourced spots) for 3 scenarios.
4. Presets: resolve 6–8 preset locations once and write data/processed/presets.json.
5. Generate hospitals.json and the EDA figures (3 findings from docs/JUDGING.md) into data/processed/eda/ + eda_summary.json with real captions based on the actual numbers (replace the hypotheses if the data disagrees).
Commit.

PHASE 3 — Real backend and app integration (about 60–90 min)
1. Implement RealBackend in app/backend.py against the files in data/processed/ (the UI window may already have written the Backend protocol and FixtureBackend — extend, do not rewrite; check the file first).
2. Run the app with FLOODROUTE_BACKEND=real, walk through the demo path in docs/JUDGING.md, and fix problems. Measure route time per click (target under 1 s) and total size of data/processed/ (target under 50 MB).
3. Only if all of the above works: Tier B (city view: hospital access ranking, criticality of flagged edges, fix-top-N slider) as specified in docs/PLAN.md.
Commit.

PHASE 4 — Documents and deployment readiness (about 60 min)
1. Fill docs/DATA_STATEMENT.md from the actual pipeline output (counts, access dates = today, what was dropped).
2. Write docs/METHOD_REPORT.md: framing, data, 3 EDA findings with figures, method, baselines, validation with real numbers and uncertainty, sensitivity, limitations, what extra data would allow prediction.
3. Test a clean environment: new venv, pip install -r requirements.txt, npm install + npm run build in web/, uvicorn api.main:app serves the UI and works offline except the optional forecast and map tiles.
4. Save `pip freeze > requirements.lock.txt`. Check that no keys or large raw files are committed. Update the README (replace anything that is not true), write the Dockerfile, then give me the exact deploy steps for the free host (FastAPI serving web/out/).

Rules while working: show real command output before claiming success; if something fails twice or takes more than ~20 minutes, use the fallback in docs/PLAN.md and tell me; never invent numbers; keep the final answer to me short (what is done, what numbers came out, what is left).
```

---

## Prompt B — API + UI first, against the fixture backend (can start immediately)

Before this: generate the Stitch designs from docs/STITCH_PROMPT.md and export them to design/stitch/ (PNG + HTML/CSS + tokens).

```text
You are building the API and UI for FloodRoute, a hackathon project (about 6 hours left). Read CLAUDE.md, docs/UI_SPEC.md, docs/DATA_CONTRACT.md, docs/PRD.md and docs/JUDGING.md first, then look at every file in design/stitch/. Another Claude Code session is building the data pipeline in pipeline/ and floodroute/ — do NOT touch those folders or config.yaml. You own api/, web/ and design/.

Goal: the best-looking, most interactive version of docs/UI_SPEC.md — custom Next.js UI matching the Stitch screens (mobile driver view AND desktop dispatcher view) — that runs on a FIXTURE backend now and switches to real data later with no UI changes. It must NOT look like a default dashboard template.

1. API (about 30 min): api/backend.py with the Backend protocol from docs/DATA_CONTRACT.md, get_backend() reading FLOODROUTE_BACKEND (fixture | real), a FixtureBackend in api/fixtures/ returning the exact shapes in the contract (clearly synthetic: invented roads/routes around central Mumbai coordinates are fine; must produce every route status: ok, cut_off, no_change, outside_area), RealBackend as a stub raising NotImplementedError("filled in by the data session"), and api/main.py with the endpoints in DATA_CONTRACT §3b (CORS for http://localhost:3000, /api/health, optionally serve web/out/ at / when it exists).
2. UI: web/ as Next.js App Router + TypeScript + Tailwind + MapLibre GL (free CARTO Positron (light) basemap, attribution visible), static export. Put the colour tokens from docs/UI_SPEC.md in Tailwind config. One typed API client in web/lib/api.ts. Build the mobile layout (bottom sheet, 48 px tap targets) and the desktop layout (sidebar + map + tabs Route / Proof / Limits; City view only if the contract's city_view exists), rain-day cards, patient location by map click/tap + presets, result card with KPI, flagged roads layer (hover/tap = why flagged), normal route dashed blue vs flood-safe route solid teal animated (respect prefers-reduced-motion), header ribbon, footer attributions.
3. When the backend is the fixture, show the permanent amber ribbon "SYNTHETIC UI FIXTURE — not real data" and "n/a in fixture mode" instead of any validation numbers. No fixture number may ever look like a real result.
4. Performance: cache flagged GeoJSON per (scenario, share) on the client; cancel stale route requests; draw flagged edges only as a MapLibre layer.
5. Run both (PowerShell: $env:FLOODROUTE_BACKEND="fixture"; uvicorn api.main:app --port 8000, and npm run dev in web/). Test every status at 1366x768 and 390x844, compare each state with its Stitch screen, and save screenshots in assets/.
6. Copy rules: "likely to flood", "flood-prone road proxy"; never "flooded" or "flood forecast". Show the rain→share assumption in the UI.

Work autonomously, commit when a visible milestone works, and keep your final report short: what is built, how to run it, differences from the Stitch designs, what is missing.
```

---

## Prompt C — final polish (use near the end)

```text
Final check for FloodRoute before submission. Read docs/JUDGING.md and docs/PLAN.md. Then:
1. Fresh-clone test in a new folder: new venv, pip install -r requirements.txt, run the app, walk the demo script. Report anything that breaks.
2. Check the integrity checklist in docs/JUDGING.md item by item against the actual code and files, and list any violation.
3. Grep the repo for secrets, absolute Windows paths, and fixture/synthetic ribbons that could appear in real mode.
4. Make sure README, docs/DATA_STATEMENT.md and docs/METHOD_REPORT.md match what the code actually does (counts, dates, weights). Fix mismatches.
5. Draft a 6-slide outline (problem, data+insight, method+validation, demo, limits+next steps, appendix) using only real numbers from data/processed/. Save as docs/SLIDES_OUTLINE.md.
Keep the report short.
```
