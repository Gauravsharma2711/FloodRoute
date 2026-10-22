# UI SPEC — Next.js + MapLibre (talks to FastAPI)

Goal: a clean, simple look that judges and drivers understand in five seconds and enjoy clicking: *pick a rain day → see risky roads → set a patient → watch the safe route appear → see why and how reliable it is.* UI/UX and decision usefulness is 20 of 100 points, and the interface must show **signal → evidence → estimate → next step**.

Two surfaces, one design language:
- **Driver view (mobile, 390×844):** one decision per screen, big headline number, bottom sheet, tap targets ≥ 48 px.
- **Dispatcher / city view (desktop, 1366×768):** sidebar + map + tabs.

Visual reference: Stitch exports in `design/stitch/` (see `docs/STITCH_PROMPT.md`). Where this spec and a Stitch screen disagree on looks, the Stitch screen wins; where they disagree on wording, data or behaviour, this spec wins.

Build against the HTTP API in `docs/DATA_CONTRACT.md` §3b. Start with the fixture backend (`FLOODROUTE_BACKEND=fixture`); switch to real data with no UI changes.

## Tech

- Next.js (App Router) + TypeScript + Tailwind CSS. No component library required; small hand-made components so the look matches Stitch.
- Map: MapLibre GL JS (`react-map-gl` or plain `maplibre-gl`) with a free CARTO Positron (light) basemap style; keep the OSM/CARTO attribution control visible.
- Data fetching: one typed client `web/lib/api.ts`; SWR or React Query for caching (flagged GeoJSON cached per scenario + share).
- Font: Inter via `next/font`; tabular numerals (`font-variant-numeric: tabular-nums`) for minutes/km.
- Build: `output: 'export'` (static) so FastAPI can serve `web/out/`. Do not use Next API routes, server actions or a database.
- No keys, no analytics, no external fonts or scripts besides the basemap tiles.

## Layouts

### Desktop (≥ 1024 px)

```
┌────────────────────────────────────────────────────────────────────┐
│ FloodRoute · Mumbai        [Data: REAL | SYNTHETIC FIXTURE]  ⓘ Limits│
├───────────────┬────────────────────────────────────────────────────┤
│ 1  RAIN DAY   │                                                    │
│ ○ Tomorrow    │                                                    │
│ ● 2019-07-02  │          MAP (light tiles, full height)             │
│   xxx mm      │   red→orange roads = likely to flood this day      │
│   [VERY HEAVY]│   blue dashed = normal route                       │
│ ○ 2020-08-05… │   teal animated = flood-safe route                 │
│               │   ● patient   ✚ hospitals                          │
│ 2  PATIENT    │                                                    │
│ click the map ├────────────────────────────────────────────────────┤
│ or [presets]  │ [Route] [City view*] [Proof] [Limits]              │
│ 3  RESULT     │  tab content                                       │
│ +14 min  KPI  │                                                    │
└───────────────┴────────────────────────────────────────────────────┘
```

Sidebar ~320 px, map fills the rest, tabs in a resizable/collapsible panel under the map.

### Mobile (< 768 px) — driver view

Single column, map first, a **bottom sheet** for everything else. Flow in three states of the same screen:
1. **Rain day:** stacked rain-day cards + assumption line + primary button "Set patient location".
2. **Patient:** full-screen map, draggable patient pin, scrollable preset chips, button "Find safe route".
3. **Result:** map in the top ~55 %, draggable bottom sheet with the headline KPI ("+14 min", 56 px), the two sub-lines, the "Next step" line, and links "Why these roads?" / "How reliable is this?" (open further sheets: road detail, Limits).

Proof and City view are desktop features; on mobile they are reachable from a menu but may be simple scrolling pages. Tablet (768–1023 px): use the desktop layout with a narrower sidebar.

## Visual design

- **Theme:** light, white, friendly and simple (Google Maps / Uber feel), not a dark control room. Simplicity rule: one main action per screen, plain words (no "telemetry", "tactical" or similar jargon), no more than three pieces of information at once on the driver view, tables and charts only in the Proof page. Map style: CARTO Positron (light).
- **Colour tokens** (define once in `tailwind.config` / CSS variables)
  - Background `#FFFFFF`, soft card `#F6F8FA`, border `#E5E7EB`, text `#111827`, muted `#6B7280`
  - Accent / primary buttons: teal `#0B8A7E`
  - Flood-prone roads: sequential `#F5B83D` → `#F97316` → `#DC2626` by score
  - Normal route: `#2563EB`, **dashed**
  - Flood-safe route: `#0B8A7E`, **solid, thick, animated** (animate `line-dasharray` or a moving highlight; respect `prefers-reduced-motion`)
  - Patient marker: `#F59E0B`; hospitals: white circle with dark "H"
  - Status: success `#16A34A`, danger `#DC2626`, warning/ribbon `#F5A524`, neutral `#6B7280` (use soft tinted backgrounds for banners)
- **Never rely on colour alone:** routes also differ by dash/solid and have legend labels; banners have icon + text.
- Cards 12 px radius, soft borders, generous padding. Mobile: body ≥ 16 px, tap targets ≥ 48 px, primary button full width. WCAG AA contrast.

## Components

1. **Rain-day picker:** cards (not a dropdown) for "Tomorrow's forecast" + top-10 replay days with date, mm and an IMD category chip. Selecting one recolours the map immediately. Under it: "Flagging the top **X%** most flood-prone roads (assumption)". Optional expander "What if?" with a share slider (`share` query parameter).
2. **Patient location:** click/tap the map, or choose from 6–8 **presets** (Hindmata, Sion/Gandhi Market, Milan Subway/Santacruz, Chembur, Andheri, Kurla, Colaba, Bandra) resolved once by the pipeline and stored in `data/processed/presets.json` (not geocoded live; served via `/api/meta`). Marker appears at once; keep it in app state and in the URL hash/query so a refresh keeps it.
3. **Result card (sidebar / bottom sheet):** one headline KPI —
   - `ok`: **"+14 min"** (example format) with sub-lines "Normal: A min → Hospital X" / "Flood-safe: B min → Hospital Y".
   - `cut_off`: red banner "**No flood-safe route.** This area is cut off in this scenario" + nearest hospital by straight line.
   - `no_change`: green banner "Normal route is not affected."
   - `outside_area`: neutral banner "Click inside the highlighted study area."
   A plain-language "Next step" line below the KPI (from `note`), e.g. "Send to Hospital Y; avoid <road names>".
4. **Map:** only flagged edges drawn (one GeoJSON source, ≤ ~5,000 features); hover (desktop) or tap (mobile) on a road = road name + **why flagged** ("1.8 m below its surroundings · 120 m from a creek · underpass"); hospitals as markers with name tooltip; study-area outline; legend in a corner.
5. **Tab Route:** comparison table (normal vs safe: minutes, km, hospital) and "flagged roads on the normal route" list.
6. **Tab Proof:** (a) chart "share of reported spots caught vs share of roads flagged": our score vs elevation-only vs random; (b) n, snap distance, bootstrap interval; (c) sensitivity chart; (d) three EDA findings with captions. Numbers come only from `/api/validation` and `/api/eda`; in fixture mode show "n/a in fixture mode". Charts: Recharts or plain SVG; EDA images from the pipeline.
7. **Tab Limits:** the honest list (see README Limitations) + "What we would need next" (drainage and pump data, tide gauges, flood-gauge time series, live traffic).
8. **Tab City view (Tier B):** hospital access ranking, top-10 "fix first" roads, slider "fix top N roads" → live KPI "x% of cut-off trips recovered".
9. **Header ribbon:** `Data: REAL` (teal chip) or a full-width amber **`SYNTHETIC UI FIXTURE — not real data`** ribbon (impossible to miss), driven by `/api/meta.data_mode`.
10. **Footer:** attributions (OSM, Copernicus, Open-Meteo, IMD, basemap) and "Prototype for decision support — not an official warning system."

## Copy rules

- Say "likely to flood", "flood-prone road proxy". Never "flooded", "predicts", "forecast of floods".
- Always show the assumption: "Share of roads flagged per rain category is an assumption (see Limits)".
- Show uncertainty wherever a number comes from validation.

## Interaction and performance rules

- Flagged GeoJSON is fetched once per (scenario, share) and cached; switching back to a seen scenario is instant.
- A route request fires on each location change; show a skeleton/spinner ("Finding routes…") and cancel the previous in-flight request.
- The API target is < 1 s per click. If slower, the data session restricts the graph or precomputes an origin grid.
- Do not render the whole network; flagged edges only. Use MapLibre layers (not DOM markers) for roads; DOM markers only for the patient pin and ≤ ~50 hospitals.
- Empty and error states: hint ("Click the map to place a patient"), API-down message with retry, friendly outside-area message.
- Must work at 1366×768 and at 390×844, in a normal browser without extensions.

## Demo path the UI must support smoothly (see docs/JUDGING.md)

Select a very-heavy replay day → flagged roads appear → hover a road for why → click a preset known to flood → normal vs safe route with added minutes → open Proof → open Limits. Add a "Demo mode" button only if time allows (it just sets scenario + preset). Also be able to run the same path on a phone-sized viewport.

## Done when

- All four statuses (`ok`, `cut_off`, `no_change`, `outside_area`) render correctly on desktop **and** mobile.
- No console errors; map responds within about a second.
- Screenshots of each state (desktop and mobile) saved to `assets/`, also used as the backup if the live demo fails.
- Side-by-side check against the matching `design/stitch/` screen for each state; remaining differences listed in the final report.
