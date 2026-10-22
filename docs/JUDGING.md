# JUDGING — rubric map, EDA, demo script, Q&A

Source: assets/HackAMatch_CityPulse_Problem_Statement.pdf. Round 1 is online (submission package); if shortlisted: 5-minute presentation + about 3 minutes of Q&A. Tie-breakers: evaluation integrity, then data analysis, then UI/UX.

## Rubric map

| Criterion (pts) | How FloodRoute covers it | Where the evidence lives |
|---|---|---|
| Problem framing and relevance (10) | One user (dispatcher / flood-control cell), one city, one decision: which route on a heavy-rain day, which roads to fix first | README, slide 1, app header |
| Data sourcing, cleaning, EDA (20) | OSM + Copernicus + Open-Meteo + IMD + hand-compiled spots; documented cleaning; ≥3 EDA findings with charts/maps | docs/DATA_STATEMENT.md, docs/METHOD_REPORT.md, Proof tab |
| Method and analytical quality (15) | Transparent, rule-based score with fixed weights; elevation-only and random baselines; routing on a real road graph | docs/METHOD_REPORT.md, `floodroute/` |
| Evaluation, validation, integrity (15) | Lift / AUC vs random and elevation-only on reported spots; bootstrap interval; sensitivity to weights and flag share; honest reporting of a weak result | Proof tab, `validation_results.json` |
| UI/UX and decision usefulness (20) | Rain-day cards, map, click-to-route, added minutes, "cut off" state, why-flagged tooltips, next-step line | App, docs/UI_SPEC.md |
| Explainability, uncertainty, limitations (10) | Why each road is flagged; CI on validation; assumptions visible; Limits tab; "what data we need next" | Tooltips, Proof tab, Limits tab |
| Implementation and reproducibility (5) | Committed processed data, no keys, one command, pinned lock file | README, docs/SETUP.md |
| Presentation and completeness (5) | Slides in the 5-minute structure; backup recording | slides, assets/ |

Stretch items covered: scenario comparison (rain days), optimisation (fix-first, Tier B), sensitivity analysis.

## The three required EDA findings (hypotheses — confirm with the data, replace if wrong)

1. **Where reported spots sit vs the typical road:** reported waterlogging spots are lower than the typical road (relative elevation and absolute height). Chart: box/violin of relative elevation for spot-adjacent segments vs all segments.
2. **When heavy rain happens:** number of days per year in each IMD category since 2005, concentrated in June–September; which days are the top-10 replays. Chart: bars by year/month + the replay days marked. Include the honest note on reanalysis understating extremes.
3. **What the rain scenarios do to access:** share of sampled origins that lose their normal route, and the added-minutes distribution, per rain category. Chart: bars/ECDF by scenario.
4. (Optional) **Spatial pattern:** map of flood-proneness by area (where the high-score clusters are).

## Method summary (for the method report and slides)

- Score = fixed weighted sum of four rank-normalised components (relative low elevation, absolute low elevation, nearness to water, underpass). Weights in `config.yaml`, set before looking at validation.
- Rain day → IMD category → share of most-prone roads treated as flooded (assumption, varied in sensitivity analysis).
- Routing: shortest travel time to the nearest hospital on the normal graph vs the graph without flagged roads; "cut off" when no hospital is reachable.
- Validation (descriptive risk ranking, no future-event claim): snap each reported spot to the nearest road segment within the snap distance; compare how many fall inside the flagged top-k% vs the share expected by chance; AUC of score vs other segments; compare with elevation-only; bootstrap interval; leave-one-out or weight perturbation for sensitivity.
- No data leakage concern for the ranking itself (terrain does not depend on the spots); state that the spots are used only for evaluation, not for fitting.

## Demo script (2.5 minutes — the brief's live demo slot)

1. (0:00) "This is a rainy day, 2020-08-05 — real rainfall from Open-Meteo, IMD category *very heavy*." Click the card; the map lights up with likely-to-flood roads. *(Signal)*
2. (0:25) Hover a red road: "Flagged because it sits 1.8 m below its surroundings and 120 m from a creek." *(Explanation — use the real values shown)*
3. (0:50) Click the preset near Hindmata / Sion: normal route (dashed blue) vs flood-safe route (teal). "+N minutes, and it goes to a different hospital." *(Action)*
4. (1:20) Click a spot that is cut off: banner "No flood-safe route". "This is where the city should send a different resource or pre-position."
5. (1:40) Proof tab: "We checked the score against N publicly reported waterlogging spots. At the top 15% flagged roads we caught X% (random would catch 15%). Elevation alone caught Y%. Here is the interval." *(Honest result — say it as it is.)*
6. (2:10) Limits tab: "Elevation is not flooding; no drains or pumps; assumption in the rain→roads mapping; here is what data would fix that." Done.

Always have the backup recording and screenshots ready.

## Five-minute presentation outline

| Time | Slide |
|---|---|
| 0:00–0:30 | Problem: ambulances on waterlogged days; user; decision |
| 0:30–1:15 | Data and strongest insight (EDA finding 1) |
| 1:15–2:00 | Method, baselines, validation result |
| 2:00–4:30 | Live demo (script above) |
| 4:30–5:00 | Limitations, next steps, evidence needed (drainage/pump data, tide + flood gauges, traffic) |

## Likely Q&A (answer honestly and briefly)

- **Is this a flood forecast?** No. It is a flood-prone road proxy from terrain, combined with a rain-day scenario. It does not know if water is on a road right now.
- **How do you know the flagged roads actually flood?** We do not observe flooding for every road. We checked against N reported spots: *(real numbers)*. The result and its uncertainty are on the Proof tab.
- **Why is "x% of roads flagged at heavy rain" the right number?** It is an assumption; nobody publishes it. We show it, vary it in the sensitivity analysis, and let the user change it.
- **What are the biases in your validation spots?** They favour busy, visible roads and come from news/BMC lists; there are few of them, and listings differ by year. Intervals are wide.
- **Why not traffic data or Google Maps?** Live traffic is paid/restricted. Google helps one driver after flooding is reported; FloodRoute helps plan before and during heavy rain and tells the city which roads to fix first.
- **Why not model drains and pumps?** Underground drainage and pump locations are not open data. It is the first thing we would add if the city shares it.
- **Does the reanalysis rain capture extreme days?** Often it understates point extremes; we state this and use the data only to select and label real heavy-rain days.
- **What would make it a real predictor?** Flood-gauge time series, tide levels, drainage capacity, pump status, and event-level waterlogging reports with timestamps.
- **Is the DEM accurate enough?** It is a 30 m surface model including buildings; it is only used for relative ranking and results are labelled accordingly.
- **Can I run it?** Yes: `pip install -r requirements.txt && uvicorn api.main:app` (serves the built UI from `web/out/`) or open the deployed URL; no keys.

## Integrity checklist

- [ ] Every number in the app/slides traces to a script output
- [ ] Fixture ribbon cannot appear in the deployed build (`data_mode = real`)
- [ ] Weights not tuned after seeing validation, or the tuning is disclosed
- [ ] Limitations and assumptions on slides, not only in docs
- [ ] No sensitive personal data; no claim of emergency-warning capability
