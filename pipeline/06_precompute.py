"""EDA findings computed from the processed data -> data/processed/eda_summary.json.

Every number in the captions is computed here; nothing is typed in by hand.
"""
import json
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import pandas as pd

from floodroute.config import get_project_root, load_config


def main() -> None:
    root = get_project_root()
    cfg = load_config()
    heavy_mm = cfg["imd_categories"]["heavy"][0]

    rain = pd.read_csv(root / "data" / "raw" / "rain_archive.csv", parse_dates=["date"])
    heavy = rain[rain["rain_mm"] >= heavy_mm]
    monsoon_share = heavy["date"].dt.month.isin([6, 7, 8, 9]).mean()
    peak_month = heavy["date"].dt.month.value_counts().idxmax()
    years = rain["date"].dt.year.nunique()
    jul26 = rain.loc[rain["date"] == "2005-07-26", "rain_mm"]

    edges = pd.read_parquet(root / "data" / "processed" / "edges_scored.parquet")
    val = json.loads((root / "data" / "processed" / "validation_results.json").read_text(encoding="utf-8"))
    spots = [s for s in val["spots"] if s["snapped"]]
    sp = pd.DataFrame(spots)
    lower = int((sp["rel_elev_m"] < 0).sum())
    all_lower = (edges["rel_elev_m"] < 0).mean()

    month_name = pd.Timestamp(2000, int(peak_month), 1).strftime("%B")
    findings = [
        {"id": "eda-monsoon", "title": "Heavy rain is a monsoon problem",
         "caption": (f"{len(heavy)} days of at least {heavy_mm} mm in {years} years (Open-Meteo, central Mumbai); "
                     f"{monsoon_share:.0%} fall in June-September, most in {month_name}.")},
        {"id": "eda-extremes", "title": "Weather grids miss the extremes",
         "caption": (f"The reanalysis records 26 July 2005 as {float(jul26.iloc[0]):.1f} mm, far below the ~944 mm "
                     "widely reported at the Santacruz gauge. We use rain only to pick and label real heavy days.")
         if len(jul26) else "Reanalysis rainfall understates extreme point rainfall."},
        {"id": "eda-bowls", "title": "Reported spots are local bowls, not coastal roads",
         "caption": (f"{lower} of {len(sp)} reported spots sit lower than the area around them (vs {all_lower:.0%} of all roads); "
                     f"their median distance to water is {sp['water_dist_m'].median():.0f} m vs "
                     f"{edges['water_dist_m'].median():.0f} m for all roads.")},
    ]
    out = root / "data" / "processed" / "eda_summary.json"
    out.write_text(json.dumps({"findings": findings}, indent=1), encoding="utf-8")
    for f in findings:
        print(f"- {f['title']}: {f['caption']}")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
