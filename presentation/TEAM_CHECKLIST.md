# FloodRoute — team checklist before the final (Saturday, report 12:30 PM)

Format: 10 min presentation + 5 min Q&A. PPT mandatory, live demo optional (we do one), formal dress, college ID + Aadhaar, at least one laptop. Rule: improvements are allowed, but the core idea must not change. Ours doesn't: it is the same flood-aware routing app, made honest and working.

---

## 1. Questions for the team (please answer in the group)

1. **Team name and member names** for slide 1 (currently `[Team name] · [Member names]`).
2. **Who presents?** The script is written for one speaker. If two people speak, the cleanest split is: speaker A for slides 1–8, speaker B for the demo (slide 9) through 12.
3. **Who owns the code fixes in section 2?** Each one needs a name and a "done by" time.
4. **Where did the numbers in the slide draft come from?** Examples: "30–90+ min delays", "saves 15–45 min", "3–4 ft deep", "Mumbai's first". If there is a public source with a URL, send it. If not, they stay out of the deck (rule: no unsupported claims).
5. **Where did the AUC 0.632, the 28.6% catch rate and the CI [0.49, 0.76] in `api/backend.py` come from?** Recomputing from the repo's own `validation_spots_evaluated.csv` gives AUC 0.46 and 1/13 in the top 15%. If another script produced those numbers, share it. Otherwise they must be replaced.
6. **Can someone add more sourced flood spots** (target 20–30, each with a URL)? More spots make the evaluation less noisy. Candidates already in the CSV without sources: Andheri Subway, King's Circle, Kurla LBS Road.
7. **Which laptop is used on stage,** and does it have Chrome or Edge plus the venue Wi-Fi or a phone hotspot? The demo needs internet for map tiles and the API.
8. **Does the organiser want a .pptx file?** The deck is HTML. Chrome → Print → "Save as PDF" (landscape, no margins, background graphics on) gives a PDF with one slide per page. If a .pptx is required, import that PDF into PowerPoint or Google Slides.

---

## 2. Code fixes the deck assumes (P0, before Saturday)

The deck describes the app **after** these fixes. Each one is real work, not a label change.

| # | Fix | Why | Files | Done? |
|---|---|---|---|---|
| 1 | ✅ DONE 2026-10-24 — **Real routing**: fastest path on `data/processed/graph.pkl` to the nearest hospital, on the normal graph and with flagged roads removed. Return route coordinates **along real street geometry**. Handle `cut_off`, `no_change` and `outside_area`. | The live API returns a hand-written fixture route that ignores the clicked point. `floodroute/routing.py` is an empty function. | `floodroute/routing.py`, `api/backend.py` (`RealBackend.route`) | ☐ |
| 2 | **Real rain days**: top-10 days from `data/raw/rain_archive.csv` (already fetched from Open-Meteo), plus tomorrow's forecast. Correct IMD category and flag share from `config.yaml`. | The live cards show invented values (for example "2005-07-26 · 380 mm"). The real top day is 2016-09-22, 251.1 mm. | new `pipeline/03_fetch_rain.py` → `data/processed/scenarios.json`; `RealBackend.scenarios` | ☐ |
| 3 | ✅ DONE 2026-10-24 — **Real hospitals**: all 550 named OSM hospitals from `data/raw/hospitals_osm.json` (already fetched), snapped to the nearest road node. Optional: prefer the 34 tagged `emergency=yes`. | The live app has 10 hand-picked hospitals while claiming 569. | pipeline step → `data/processed/hospitals.json`; `RealBackend.hospitals` | ☐ |
| 4 | **Honest validation**: compute AUC, catch rate at each flag share, bootstrap CI and the elevation-only baseline in `pipeline/05_validate.py` → `validation_results.json`. The reliability page reads it. **Delete the hard-coded numbers.** | The live numbers are hard-coded and do not match the data (0.632 vs 0.46). | `pipeline/05_validate.py`, `RealBackend.validation`, `web/src/app/reliable/page.tsx` | ☐ |
| 5 | **Honest data mode**: anything still served from the fixture must show the "SYNTHETIC UI FIXTURE" strip. Never report `data_mode: real` while returning fixture data. | Integrity is the first tie-breaker, and fabricated results can disqualify. | `api/backend.py`, `web/src/lib/api.ts` | ☐ |
| 6 | ✅ DONE 2026-10-24 — **Map shows the selected path clearly**: after a click, draw the normal route (dashed blue) and the safe route (solid teal) from the patient pin to the hospital, along streets. Fit the map to the route, and highlight the destination hospital. | This is the "wow" moment of the demo, and you asked for it. | `web/src/components/Map.tsx` | ☐ |
| 7 | **Backup recording**: a 2-minute screen recording of the demo path after fixes 1–6, saved as `assets/demo_backup.mp4`. | The brief asks for a backup in case the live demo fails. | — | ☐ |

P1, only if P0 is done: 3 EDA charts served in the app from `data/processed/eda/`, a "Demo mode" button (sets rain day + Sion preset), and the fix-first city view.

---

## 3. Slide claims that depend on fixes

If a fix is not done by Saturday, change the slide **before** presenting:

| Slide | Claim | Needs fix | If not done, say instead |
|---|---|---|---|
| 3 | "nearest of 28 major hospitals" | #3 ✅ | — |
| 3, 5, 9 | "routes drawn along real streets", minutes, "cut off" | #1, #6 | Demo only rain day → red roads → why → reliability; describe routing as "in progress" |
| 9 | "How reliable is this?" shows the evaluation | #4 | Show slide 8 instead of the app page |

Everything else on the slides (counts, EDA, evaluation numbers) is already computed from real data in this repo. The method is described below.

---

## 4. Where every number on the slides comes from

| Number | Source |
|---|---|
| 5,041 junctions · 9,746 road segments · 1,552 km · 470 bridges · 21 underpasses | `data/processed/graph.pkl`, `edges_scored.parquet` |
| 569 hospital features · 539 kept (named, not `emergency=no`) · 28 major destinations (curated names in `config.yaml`) | Overpass query of the study bbox, saved as `data/raw/hospitals_osm.json` (2026-10-23) |
| 7,670 days · 0 missing · 110 heavy days · 96% in Jun–Sep · July 40 · 26 Jul 2005 = 69.6 mm | Open-Meteo archive at 19.076 N, 72.878 E, 2005–2025, saved as `data/raw/rain_archive.csv` (2026-10-23) |
| 13 of 14 spots within 150 m · AUC 0.46 · CI 0.32–0.61 · elevation-only 0.45 · 1/13 in the top 15% · per-spot ranks | Computed from `validation_spots_evaluated.csv` + `edges_scored.parquet` (AUC = mean percentile rank of spot roads; 2,000 bootstrap resamples, seed 42) |
| Spots vs all roads: 7/13 vs 46% lower than surroundings; 526 m vs 330 m to water; 9.6 m vs 9.7 m height | Same two files |
| ~944 mm (2005), 336 BMC spots, 200+ traffic-police spots | External, sourced in `docs/DATA_SOURCES.md`. The 944 mm figure is "as widely reported", so say "reported". |
| Weights 0.45 / 0.25 / 0.20 / 0.10; flag shares 3 / 8 / 15 / 25% | `config.yaml` |

---

## 5. Q&A prep (5 minutes; answer in one or two sentences)

- **"Your AUC is below 0.5 — so the tool doesn't work?"** On 13 spots the overall ranking is no better than random, and we report that. It catches the real sunken bowls but misses spots under flyovers and embankments, because the 30 m model is a surface model. The fix is bare-earth elevation and drainage data. The routing logic stays the same; only the score input improves.
- **"Why not train a model?"** We have 14 labels. Any model would memorise them, and we could not evaluate it honestly.
- **"Why should I trust the rain-to-roads percentages?"** You shouldn't treat them as facts. They are an explicit assumption, shown in the app, adjustable, and varied in a sensitivity test. Nobody publishes this mapping.
- **"Is this a flood forecast?"** No. It ranks roads by terrain for a given rain category. It doesn't know if water is on a road right now.
- **"Why not Google Maps?"** Its routing API requires billing, which the rules forbid. It also reacts to reported closures. We use our own OSM road graph for free and plan before roads close.
- **"Did you tune the weights after seeing the results?"** No. They were fixed in `config.yaml` before validation. If we change them, we will disclose it.
- **"How would you make it a real predictor?"** Dated waterlogging reports or flood-gauge time series, plus tide and drain data. Then we could validate chronologically.
- **"How fast is it?"** Only quote a number after it has been measured on the fixed API.
- **"Did you use AI tools?"** Yes, for coding assistance. The rules ask us to disclose it. We can explain every step of the pipeline.
- **"What is the business model?"** Free for public emergency services; paid integration for private hospital networks and fleets. Keep it to one sentence. The rubric scores evidence, not revenue.

---

## 6. Day-of checklist

- [ ] Deck open in fullscreen (press F), on slide 1, speaker notes off.
- [ ] App open in a second tab, already loaded (Render free tier sleeps; open it 5 minutes before).
- [ ] Rain day and Sion preset tested once on the stage laptop.
- [ ] `assets/demo_backup.mp4` on the laptop desktop.
- [ ] PDF export of the deck on a USB drive or Drive link.
- [ ] Formal dress, college ID, Aadhaar card.
