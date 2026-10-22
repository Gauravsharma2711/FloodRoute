# DATA CONTRACT — files and backend interface

Purpose: the UI person and the data person can work in parallel. The UI (Next.js) talks to the FastAPI endpoints in §3b, which call the `Backend` interface; the pipeline produces the files; `RealBackend` connects them. Until the pipeline is ready the UI runs on `FixtureBackend` (synthetic, clearly labelled).

## 1. Files written by the pipeline (`data/processed/`)

| File | Format | Contents |
|---|---|---|
| `graph.pkl` | pickled NetworkX MultiDiGraph | Road graph. Node attrs: `x` (lon), `y` (lat), `elev_m`. Edge attrs: `osmid`, `name`, `highway`, `length_m`, `travel_time_s`, `flood_score` (0–1), `flood_rank_pct` (0–1, 1 = most prone), `rel_elev_m`, `water_dist_m`, `is_underpass`, `is_bridge`, `geometry` (shapely LineString, lon/lat) |
| `edges_scored.parquet` | table | Same edge attributes flat (`u`, `v`, `key` + attrs, geometry as WKT) for EDA |
| `hospitals.json` | list | `{id, name, lat, lon, node, emergency}` (`emergency` = true / false / null if untagged) |
| `scenarios.json` | object | `replay_days`: list of `{id, date, rain_mm, imd_category, flag_share, source}`; `forecast`: `{id, date, rain_mm, imd_category, flag_share, fetched_at}` or null; `category_to_share`: the assumption table from `config.yaml` |
| `validation_results.json` | object | `n_spots`, `snap_m`, `curves`: list of `{flag_share, recall_score, recall_elev_only, expected_random, lift_score, lift_elev_only}`, `auc_score`, `auc_elev_only`, `ci` (bootstrap, 95%), `sensitivity` (weights × share grid), `notes` |
| `eda_summary.json` + `eda/*.png` | | Three or more EDA findings with chart paths and one-line captions |
| `city_view.json` (Tier B) | object | Per scenario: hospital access ranking, criticality ranking (top 50 edges), fix-top-N curve |

Raw inputs live in `data/raw/` (large files git-ignored). Validation input: `data/validation/flood_spots.csv`.

## 2. Flagging rule (single definition, in `floodroute/flagging.py`)

```
flagged_edges(graph, flag_share) = edges whose flood_rank_pct >= 1 - flag_share, excluding bridges
```

`flag_share` comes from the scenario (IMD category → share table in `config.yaml`) or from the UI's optional "what if" slider.

## 3. Backend interface (`api/backend.py`)

```python
class Backend(Protocol):
    def meta(self) -> dict:
        """{city, bbox, data_mode: 'real'|'fixture', built_at, sources: [...], presets: [{id, name, lat, lon}]}"""

    def scenarios(self) -> list[dict]:
        """replay days + forecast (see scenarios.json). Each has id, label, date, rain_mm, imd_category, flag_share."""

    def flagged_geojson(self, scenario_id: str, share_override: float | None = None) -> dict:
        """GeoJSON FeatureCollection of flagged LineStrings. properties: name, highway, score, rel_elev_m,
        water_dist_m, is_underpass, why (one-line plain-language reason)."""

    def hospitals(self) -> list[dict]:
        """[{id, name, lat, lon, emergency}]"""

    def route(self, lat: float, lon: float, scenario_id: str, share_override: float | None = None) -> dict:
        """{
          status: 'ok' | 'cut_off' | 'no_change' | 'outside_area',
          normal: {hospital, coords: [[lat, lon], ...], minutes, km},
          safe:   {hospital, coords, minutes, km} | None,       # None when cut_off
          added_minutes: float | None,
          blocked_on_normal: [{name, score}],                    # flagged roads the normal route uses
          note: str                                              # plain-language one-liner for the UI
        }"""

    def validation(self) -> dict:      # validation_results.json
    def eda(self) -> dict:             # eda_summary.json
    def city_view(self, scenario_id: str, fix_top_n: int = 0) -> dict:   # Tier B
```

Notes
- `normal` and `safe` can end at **different hospitals** (nearest overall vs nearest reachable). The UI must show both names.
- `added_minutes = safe.minutes - normal.minutes`.
- `FLOODROUTE_BACKEND=fixture|real` selects the implementation (default `real` once `data/processed/graph.pkl` exists, else `fixture` with the ribbon).

## 3b. HTTP API (FastAPI, `api/main.py`) — what the Next.js frontend calls

A thin layer: each endpoint calls one Backend method and returns its JSON unchanged. The frontend (`web/lib/api.ts`) mirrors these types. All paths are GET, JSON, no auth, CORS allowed for `http://localhost:3000` in dev (in production the frontend is served by the same FastAPI app, so same origin).

| Endpoint | Backend method | Notes |
|---|---|---|
| `/api/meta` | `meta()` | includes `data_mode` (drives the ribbon) |
| `/api/scenarios` | `scenarios()` | rain-day cards |
| `/api/flagged?scenario_id=…&share=…` | `flagged_geojson()` | `share` optional (what-if); cacheable per (scenario, share) |
| `/api/hospitals` | `hospitals()` | |
| `/api/route?lat=…&lon=…&scenario_id=…&share=…` | `route()` | one of the four statuses; target < 1 s |
| `/api/validation` | `validation()` | fixture mode returns `{"data_mode":"fixture"}` only, no numbers |
| `/api/eda` | `eda()` | chart images served from `/static/eda/*.png` |
| `/api/city_view?scenario_id=…&fix_top_n=…` | `city_view()` | Tier B |
| `/api/health` | — | returns `{ok: true}`; used by the host's health check |

Errors: 400 with `{detail: "..."}` for bad parameters; the frontend shows a friendly message and a retry.

## 4. FixtureBackend rules (UI testing only)

- Lives in `api/fixtures/`; fake data is generated or hand-made, never copied from real sources and never presented as real.
- When active, the app shows a persistent ribbon: **"SYNTHETIC UI FIXTURE — not real data"**, and hides the validation numbers (shows "n/a in fixture mode").
- Must return the same shapes as the real backend so switching needs no UI change.
- Must be able to simulate each `status` (ok, cut_off, no_change, outside_area) so all UI states can be built and screenshotted.

## 5. `data/validation/flood_spots.csv` columns

`id, name, area, evidence_type, year, lat, lon, source_url, source_note, status`

- `evidence_type`: `bmc_list` | `traffic_police` | `flood_gauge` | `news`
- `status`: `sourced` (usable once geocoded) | `candidate_needs_source` (do not use for validation until a source is added)
- Only rows with `status = sourced` and non-empty `lat`, `lon` enter the validation.
