# FloodRoute — Product Requirements Document (PRD)

Version 1.0 · Hackathon: HackAMatch 1.0 — *CityPulse: Predict. Explain. Act.* · City: Mumbai
Status: draft for team review. Companion files: `docs/PLAN.md` (timeline), `docs/UI_SPEC.md` (UI detail), `docs/STITCH_PROMPT.md` (design prompt), `docs/DATA_CONTRACT.md`, `docs/DATA_SOURCES.md`, `docs/JUDGING.md`.

---

## 1. One-paragraph summary

On a heavy-rain day, some Mumbai roads are likely to flood and an ambulance can lose precious minutes or get stuck. FloodRoute marks the **flood-prone road proxy** for a chosen rain day, shows an ambulance driver or dispatcher a **normal route and a flood-safe route** to a hospital (with the added minutes, or "cut off"), **explains** why roads are flagged and how well that matches real reported waterlogging spots, and tells the city **which roads to fix first**.

It is a prototype for decision support. It is **not** a flood forecast and **not** an official warning system.

## 2. Problem and users

| User | Situation | What they need |
|---|---|---|
| **Ambulance driver** (mobile, in a moving vehicle, often night / glare) | A patient is at a location; heavy rain | One clear answer: which hospital, how many extra minutes, which roads to avoid |
| **Dispatcher** (desktop) | Several calls at once, planning ahead for a rain day | Map of risky roads, quick comparison of routes, proof the tool is trustworthy |
| **City flood-control team** (desktop) | Limited budget to fix roads | Ranked list of roads whose fix recovers the most trips; hospital access ranking |

**Decision supported:** on a heavy-rain day, (1) which route should an ambulance take, (2) which hospitals lose access, (3) which roads should be fixed first.

**Core loop (from the brief):** Discover (flood-prone roads) → Predict/estimate (delay under a rain day) → Explain (why flagged, how well it matches real spots) → Act (safe route, fix-first list).

## 3. Goals and non-goals

**Goals**
- A working, honest, good-looking V1 deployed at a public URL, runnable by anyone with no keys and no paid services.
- Score the brief's rubric (see §10), especially data/EDA (20), UI/UX and decision usefulness (20), method (15), validation integrity (15).
- A UI an ambulance driver can understand in five seconds on a phone.

**Non-goals (explicitly cut)**
Voice, vector RAG, underground drainage/pump modelling, live traffic, population weighting, Databricks, turn-by-turn navigation, user accounts, any claim of real-time flooding or emergency-warning capability.

## 4. Scope tiers (build in this order; do not start a tier before the previous one works end to end)

**Tier A — must ship**
1. Rain-day picker: tomorrow's forecast + top-10 real rainy days from Open-Meteo history, each with an IMD category.
2. Map layer of roads that are likely to flood for the chosen day.
3. Patient location (tap the map or preset) → normal route and flood-safe route, added minutes, or "cut off".
4. Proof panel: validation against reported spots + 3 EDA findings + sensitivity chart.
5. Limits panel.
6. Docs: data statement, method report, README, slides outline, backup recording.

**Tier B — only if Tier A is done:** city view with hospital access ranking, criticality ranking of flagged roads, "fix top N roads" slider.

**Tier C — optional:** hospital-need dropdown (hand-curated, sourced), template advisory text (optional Groq/Ollama behind an env var, with template fallback), browser GPS "use my location".

## 5. Experience requirements

### 5.1 Two surfaces, one design language
- **Driver view (mobile, 390×844):** mobile-first. One decision per screen, big headline number, bottom sheet with the answer, tap targets ≥ 48 px, body text ≥ 16 px, primary action full width.
- **Dispatcher / city view (desktop, 1366×768):** sidebar with three steps (Rain day → Patient → Result), large map, tabs below (Route · City view · Proof · Limits).
- Same colours, typography, components and wording on both. Desktop is not a stretched phone; the phone is not a shrunken desktop.
- Design source: Stitch designs generated from `docs/STITCH_PROMPT.md`, saved in `design/stitch/` as the visual reference.
- *Implementation:* custom Next.js UI (not Streamlit) so the mobile bottom sheet and the Stitch look can be matched closely. `docs/UI_SPEC.md` describes both layouts.

### 5.2 Visual theme (summary; full tokens in `docs/UI_SPEC.md`)
Light, white, friendly theme (Google Maps / Uber feel), not a dark dashboard. Inter font with tabular numerals, rounded cards, light map tiles, plain words, one main action per screen. Risky roads amber→orange→red; normal route blue **dashed**; flood-safe route teal **solid and thick**; patient marker amber; hospitals white "H". Never rely on colour alone (dash/solid + legend labels + icons + text).

### 5.3 Result states (all four must render correctly)
| Status | What the user sees |
|---|---|
| `ok` | Headline "+N min", sub-lines "Normal: A min → Hospital X" and "Flood-safe: B min → Hospital Y", plus a "Next step" line |
| `cut_off` | Red banner "No flood-safe route. This area is cut off in this scenario" + nearest hospital by straight line |
| `no_change` | Green banner "Normal route is not affected." |
| `outside_area` | Neutral banner "Click/tap inside the highlighted study area." |

### 5.4 Trust and honesty elements (always visible)
- Data-mode indicator: `Data: REAL` (teal) or amber ribbon **"SYNTHETIC UI FIXTURE — not real data"**. The deployed build must be real data only.
- The rain → share-of-roads-flagged assumption, shown next to the rain picker, adjustable under "What if?".
- Tap/hover on a road shows **why** it is flagged (e.g. "1.8 m below its surroundings · 120 m from a creek · underpass" — real values only).
- Footer: OSM, Copernicus, Open-Meteo, IMD attribution + "Prototype for decision support — not an official warning system."

### 5.5 Copy rules
Always "likely to flood" / "flood-prone road proxy". Never "flooded", "flood forecast", "predicts floods". Show uncertainty wherever a number comes from validation.

## 6. Functional requirements

| # | Requirement | Tier | Acceptance check |
|---|---|---|---|
| F1 | Rain-day cards: tomorrow + top-10 replay days with date, mm, IMD chip; selecting recolours the map immediately | A | Click each card, map updates in ≈ 1 s |
| F2 | Flagged roads drawn as one layer (≤ ~5,000 features), coloured by score; bridges/flyovers never flagged | A | Layer loads, no console errors |
| F3 | Patient location by map click or 6–8 presets (Hindmata, Sion/Gandhi Market, Milan Subway/Santacruz, Chembur, Andheri, Kurla, Colaba, Bandra) | A | Marker appears at once |
| F4 | Routing: shortest time to nearest named OSM hospital on normal graph vs graph without flagged roads; "cut off" handled | A | < 1 s per click; ≥ 5 test points print sensible results |
| F5 | Result card renders all four statuses | A | See §5.3 |
| F6 | Road tooltip with plain-language reasons | A | Values match the pipeline output |
| F7 | Proof tab: share of reported spots caught vs share of roads flagged (our score vs elevation-only vs random), n, snap distance, bootstrap interval, sensitivity chart, 3 EDA findings | A | Numbers come only from `validation_results.json` / EDA output |
| F8 | Limits tab with honest limits + "what we would need next" | A | Present and reviewed by the team |
| F9 | Hospital access ranking, top-10 fix-first roads, "fix top N" slider with live KPI | B | KPI updates on slider move |
| F10 | Hospital-need dropdown, template advisory, browser GPS | C | Only after B |
| F11 | Mobile-friendly driver layout | A (UI) | Usable at 390 px width; tap targets ≥ 48 px |
| F12 | Backend switch: `FLOODROUTE_BACKEND=fixture|real` with no UI changes | A | Same UI, both backends |

## 7. Data and method (summary)

**Data (all public, no keys):** OpenStreetMap roads, hospitals, waterways (via Overpass, cached); Copernicus DEM elevation; Open-Meteo archive (replay days) + forecast; IMD rain categories; a hand-compiled list of publicly reported waterlogging spots (15–20, each with a source URL) used **only for evaluation, not for fitting**.

**Flood-proneness score:** fixed weighted sum of four rank-normalised components — relative low elevation, absolute low elevation, nearness to water, underpass — weights in `config.yaml`, set before looking at validation.

**Rain day → flagged roads:** IMD category decides the share of most-prone roads treated as likely to flood. This mapping is an **assumption** (`config.yaml`), shown in the UI and varied in a sensitivity analysis.

**Routing:** same code in pipeline and app (`floodroute/`), so the UI can never disagree with the evaluation.

**Validation:** snap each reported spot to the nearest road within the snap distance; compare caught share in the top-k% flagged vs chance; AUC; compare with elevation-only; bootstrap interval; sensitivity to weights and flag share. Report honestly, including a weak result.

## 8. Architecture (summary)

```
pipeline/01..06   fetch OSM → elevation → rain → score → validate → precompute   (idempotent, cached in data/raw/)
floodroute/       shared library: config, scoring, flagging, routing
api/              FastAPI: thin HTTP layer + Backend interface (FixtureBackend, RealBackend)
web/              Next.js + Tailwind + MapLibre UI (static export, served by FastAPI in production)
data/processed/   committed, < 50 MB total
```
Stack decision: Python for everything data-related (no Node backend, no database, so routing logic lives once); Next.js only for the UI. Deployed as one service and one URL.
Performance: graph loaded once at API startup; scores never recomputed in the API or UI; only flagged edges sent and drawn; flagged GeoJSON cached per (scenario, share).

## 9. Hard rules (non-negotiable)

1. No fabricated data, metrics or results; every number traces to code run on real public data.
2. Synthetic data only in `app/fixtures/`, always with the visible ribbon.
3. No API keys in the repo, no paid services; optional LLM features read env vars and have a template fallback.
4. Wording rules in §5.5.
5. The rain → share mapping is an assumption and is never hidden.
6. Validation reported honestly (lift/AUC vs random and elevation-only, with n and uncertainty); no cherry-picking weights; any weight change is disclosed.
7. Respect data terms (OSM and Copernicus attribution, Open-Meteo fair use, cache downloads, gentle with Overpass).
8. Scope guard: Tier A first; never build anything from the Cut list.

## 10. Success criteria (the judging rubric)

| Criterion | Pts | How we cover it |
|---|---|---|
| Problem framing and relevance | 10 | One user, one city, one decision |
| Data sourcing, cleaning, EDA | 20 | OSM + DEM + Open-Meteo + IMD + reported spots; ≥ 3 EDA findings |
| Method and analytical quality | 15 | Transparent score, baselines, real road-graph routing |
| Evaluation, validation, integrity | 15 | Lift/AUC, bootstrap, sensitivity, honest reporting |
| UI/UX and decision usefulness | 20 | Rain cards, click-to-route, added minutes, cut-off state, why-flagged, next step, mobile driver view |
| Explainability, uncertainty, limitations | 10 | Tooltips, Proof, Limits |
| Implementation and reproducibility | 5 | Committed data, no keys, one command |
| Presentation and completeness | 5 | Slides, backup recording |

Tie-breakers: evaluation integrity, then data analysis, then UI/UX.

## 11. Demo path (2.5 min) the product must support smoothly

Pick a very-heavy replay day → flagged roads appear → hover a red road to see why → click a preset known to flood (Hindmata/Sion) → normal vs safe route with added minutes and a different hospital → click a cut-off spot → Proof tab → Limits tab. Backup recording and screenshots must exist.

## 12. Timeline and who does what

About 6–7 hours of build time. Full checkpoints in `docs/PLAN.md`.

| Role | Owns | First tasks |
|---|---|---|
| **A — Data/pipeline** | `pipeline/`, `floodroute/`, `config.yaml` | Reachability test → OSM + elevation → score → **Checkpoint 1** → validation, rain days, routing |
| **B — UI** | `api/`, `web/`, `design/stitch/` | Generate Stitch designs → FastAPI + fixture backend → Next.js UI → switch to real backend after Checkpoint 2 |
| **C — Evidence/docs** | `data/validation/`, `docs/DATA_STATEMENT.md`, `docs/METHOD_REPORT.md`, slides | Compile 15–20 reported flood spots with source URLs; access dates; method report |

Checkpoints: **0** setup and reachability · **1** flood-proneness map + sanity check against known spots (stop and report) · **2** validation, rain days, routing · **3** deploy and docs.

## 13. Risks and fallbacks

| Risk | Fallback |
|---|---|
| Copernicus tiles slow/unreachable | Open-Meteo elevation API (coarser; say so) |
| Overpass slow | Shrink bbox to the island city, cache, retry |
| Graph too big / slow routing | Keep only major road classes, shrink bbox, precompute origins |
| Score no better than random | Still ship; report honestly; show sensitivity and elevation-only comparison |
| Open-Meteo understates extreme rain | State the finding; use rain only to pick and label real heavy-rain days |
| Custom Next.js UI takes longer than expected | Build the core flow first (rain picker, map, route, result card), then Proof/Limits, then polish; Tier B only after that |
| Two moving parts (API + UI) complicate deploy | Serve the static UI from FastAPI: one Docker service, one URL, no CORS |
| Free hosts sleep / have memory limits | Open the URL before judging; keep `data/processed/` small; keep the backup recording |
| Few reported spots, biased to busy roads | Wide intervals shown; stated in Limits |

## 14. Deliverables checklist (from the brief)

- [ ] Working prototype: deployed URL + local run instructions
- [ ] Source code, setup instructions, dependency list
- [ ] Data statement (links, access dates, licences, fields, preprocessing)
- [ ] Analysis and method (EDA, baseline, evaluation, limitations)
- [ ] Slides (if shortlisted), 5-minute structure
- [ ] Reproducibility notes (no paid services, keys or private data)
- [ ] Backup screenshots / recording
- [ ] Screenshots of all four result states saved in `assets/`

## 15. Open questions for the team

1. Mobile driver view: it is a responsive web layout in V1 (no native-app claims). Confirm it is part of the live demo.
2. Team size and who takes roles A, B, C.
3. Who compiles the reported flood-spots list and by when? (Needed for validation and the Proof tab.)
4. Confirm the study area (bbox in `config.yaml`) after the first map render.
