"""Rain scenarios: top-N real heavy-rain days (Open-Meteo archive) + tomorrow's forecast.

Writes data/processed/scenarios.json. Rain is used only to pick and label real days and to choose
the IMD category; the share of roads treated as likely to flood comes from config.yaml
(flag_share_by_category, an ASSUMPTION). Reanalysis understates extreme point rainfall.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import pandas as pd
import requests

from floodroute.config import get_project_root, load_config

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


def imd_category(mm: float, categories: dict) -> str:
    """IMD daily category; anything below 'moderate' is reported as 'light' (no roads flagged)."""
    for name in ("extremely_heavy", "very_heavy", "heavy", "moderate"):
        if mm >= categories[name][0]:
            return name
    return "light"


def load_archive(cache: Path, cfg: dict) -> pd.DataFrame:
    if not cache.exists():
        rp, ra = cfg["rain_point"], cfg["rain_archive"]
        r = requests.get(ARCHIVE_URL, timeout=120, params={
            "latitude": rp["lat"], "longitude": rp["lon"], "start_date": ra["start_date"],
            "end_date": ra["end_date"], "daily": "precipitation_sum", "timezone": ra["timezone"]})
        r.raise_for_status()
        d = r.json()["daily"]
        cache.parent.mkdir(parents=True, exist_ok=True)
        pd.DataFrame({"date": d["time"], "rain_mm": d["precipitation_sum"]}).to_csv(cache, index=False)
    return pd.read_csv(cache)


def fetch_forecast(cache: Path, cfg: dict) -> dict | None:
    """Tomorrow's forecast; falls back to the last cached forecast when offline."""
    rp = cfg["rain_point"]
    try:
        r = requests.get(FORECAST_URL, timeout=30, params={
            "latitude": rp["lat"], "longitude": rp["lon"], "daily": "precipitation_sum",
            "forecast_days": 3, "timezone": cfg["rain_archive"]["timezone"]})
        r.raise_for_status()
        d = r.json()["daily"]
        out = {"date": d["time"][1], "rain_mm": float(d["precipitation_sum"][1] or 0.0),
               "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds")}
        cache.write_text(json.dumps(out), encoding="utf-8")
        return out
    except Exception as exc:  # offline: use cache
        print(f"forecast fetch failed ({exc}); using cache if present")
        return json.loads(cache.read_text(encoding="utf-8")) if cache.exists() else None


def main() -> None:
    root = get_project_root()
    cfg = load_config()
    cats, shares = cfg["imd_categories"], cfg["flag_share_by_category"]
    df = load_archive(root / "data" / "raw" / "rain_archive.csv", cfg)

    top = df.dropna().sort_values("rain_mm", ascending=False).head(cfg["rain_archive"]["replay_days"])
    replay = []
    for _, row in top.iterrows():
        mm = round(float(row.rain_mm), 1)
        cat = imd_category(mm, cats)
        d = pd.Timestamp(row.date)
        replay.append({
            "id": f"replay_{d:%Y_%m_%d}",
            "label": f"{d:%d %b %Y}",
            "date": f"{d:%Y-%m-%d}",
            "rain_mm": mm,
            "imd_category": cat,
            "flag_share": shares[cat],
            "source": "Open-Meteo archive (reanalysis)",
            "description": "Real daily total at central Mumbai; reanalysis can understate extremes",
        })

    fc = fetch_forecast(root / "data" / "raw" / "forecast.json", cfg)
    forecast = None
    if fc:
        cat = imd_category(fc["rain_mm"], cats)
        forecast = {
            "id": "forecast_tomorrow",
            "label": "Tomorrow's forecast",
            "date": fc["date"],
            "rain_mm": round(fc["rain_mm"], 1),
            "imd_category": cat,
            "flag_share": shares[cat],
            "source": "Open-Meteo forecast",
            "fetched_at": fc["fetched_at"],
            "description": "Forecast daily total" + ("" if shares[cat] else " — below 'moderate', no roads flagged"),
        }

    out = root / "data" / "processed" / "scenarios.json"
    out.write_text(json.dumps({"replay_days": replay, "forecast": forecast,
                               "category_to_share": shares}, indent=1), encoding="utf-8")
    print(f"archive days: {len(df)} | missing: {int(df.rain_mm.isna().sum())}")
    print(f"replay days: {[(r['date'], r['rain_mm'], r['imd_category']) for r in replay]}")
    print(f"forecast: {forecast and (forecast['date'], forecast['rain_mm'], forecast['imd_category'])}")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
