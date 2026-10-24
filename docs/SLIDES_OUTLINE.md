# FloodRoute — 5-Minute Presentation Slide Outline

**Topic:** Mumbai Flood-Aware Emergency Routing Support  
**Format:** 6 Slides (5-minute pitch + Q&A)  
**Rule:** Grounded strictly in verified pipeline outputs from `data/processed/`.

---

## Slide 1: Problem & Decision Framing (0:00 – 0:45)
- **Title:** "Can the Ambulance Get Through?"
- **The Operational Challenge:**
  - Mumbai monsoons generate 100–300 mm daily rainfall events, inundating chronic road basins.
  - Live traffic apps (Google Maps, Uber) are reactive: they detect bottlenecks only *after* vehicles are gridlocked or waterlogged.
- **Our User & Decision:**
  - Ambulance dispatchers and 108 emergency teams.
  - *Decision:* Which route reaches an operational emergency hospital fastest during a deluge, and which corridors must be avoided before drivers get stranded?
- **Key Principle:** A proactive, terrain-grounded *flood-prone road proxy* — not a speculative weather forecast.

---

## Slide 2: Data & Core Topographic Insight (0:45 – 1:30)
- **Title:** Open Data Infrastructure for Mumbai
- **Datasets Ingested (100% Free & Open):**
  - **5,041 nodes & 9,746 edges** of Mumbai's core drivable road network (OSM).
  - **569 OSM hospital features**; ambulances are routed to the nearest of **28 major hospitals**.
  - **Copernicus DEM GLO-30 (30 m resolution):** Sampled elevations from -1.68 m to 74.81 m (median 9.55 m).
  - **Open-Meteo Historical Archive:** 7,670 days (2005–2025) classified into IMD rainfall intensities.
- **Core Empirical Insight:**
  - Waterlogging does not correlate merely with absolute elevation.
  - Chronic flood spots sit in acute **micro-depressions**: roads sitting **1.3 m to 3.6 m below surrounding terrain** within a 300 m radius (e.g. Sion basin at -3.61 m, Churchgate at -1.76 m).

---

## Slide 3: Methodology & Honest Validation (1:30 – 2:30)
- **Title:** Multi-Criteria Terrain Scoring & Benchmark Results
- **Transparent Formula (`config.yaml`):**
  $$\text{Score} = 0.40 \cdot \text{RelElev} + 0.25 \cdot \text{AbsElev} + 0.20 \cdot \text{WaterDist} + 0.15 \cdot \text{Underpass}$$
  - Elevated bridges (`bridge=yes`) shielded from false positives.
  - Weights locked prior to evaluation.
- **Honest Benchmark Against 14 Documented Waterlogging Spots:**
  - **Churchgate:** 88.0% risk rank ($\Delta h = -1.76\text{ m}$)
  - **Sion / Gurukripa Basin:** 83.2% risk rank ($\Delta h = -1.35\text{ m}$, 108 m from tidal creek)
  - **Sion / Guru Nanak:** 77.7% risk rank ($\Delta h = -3.61\text{ m}$)
  - **Hindmata Junction:** 61.8% risk rank ($\Delta h = -0.39\text{ m}$)
  - **What Failed & Why:** Milan Subway (35.7%) had rail embankment elevation interference; single Gandhi Market point (10.1%) fell on the newly elevated flyover deck.

---

## Slide 4: Live Interactive Demonstration (2:30 – 4:00)
- **Title:** Proactive Dispatcher & Mobile Driver Views
- **Step 1 — Rain Day Selection:** Pick real replay days (e.g. 5 Aug 2020: 187 mm *Very Heavy*) → map renders top 15% prone roads in amber-to-red.
- **Step 2 — Road Tooltips:** Hovering a flagged corridor reveals exact terrain reasons (e.g. *"Dr. Ambedkar Road: -0.39 m depression, 386 m from creek"*).
- **Step 3 — Routing Transitions:**
  - *Chembur Circle (very heavy day):* normal route to K.J. Somaiya crosses roads likely to flood; flood-safe route goes to Rajawadi Hospital, +2.9 min (computed live).
  - *Kurla (LBS Marg):* Status shifts to **Area Cut Off** (all arterial exits submerged; prompts dispatchers to deploy high-clearance boats/amphibious units).
  - *Colaba Causeway:* Status **Route Unaffected** (direct transit intact).
- **Mobile View:** Dedicated 48 px tap targets, bottom drawer, high-contrast driver guidance.

---

## Slide 5: Limitations, Assumptions & Next Steps (4:00 – 4:45)
- **Title:** What We Know & What We Need
- **Honest Limitations:**
  - Elevation is not water: 30 m DSM includes surface canopy and building parapets.
  - Missing municipal data: Mumbai's underground drains (BRIMSTOWAD) and sluice gates are not public open data.
  - Rain-to-flag share is an assumption (exposed to user via "What If?" slider).
- **Actionable Next Steps with Municipal Partners (BMC):**
  1. Ingest municipal pumping station live operational status.
  2. Incorporate real-time Arabian Sea high-tide gauges.
  3. Calibrate road closures using crowdsourced 108 ambulance stall logs.

---

## Slide 6: Appendix & Reproducibility (4:45 – 5:00)
- **Title:** Reproducibility & Architecture
- **Single Command Execution:**
  - `python -m uvicorn api.main:app --port 8000` (FastAPI serving precomputed graph + static UI).
  - Zero API keys, zero paid cloud subscriptions required.
- **Technical Stack:**
  - Python (OSMnx, NetworkX, Shapely, Rasterio)
  - Next.js App Router + TypeScript + Tailwind CSS + MapLibre GL JS
  - CARTO Positron light vector basemap.
