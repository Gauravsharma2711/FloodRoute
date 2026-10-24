"""Validate the flood-proneness score against publicly reported waterlogging spots.

Writes data/processed/validation_results.json. Spots are used only for evaluation, never for
fitting. Weights come from config.yaml and are not tuned here. AUC = probability that a reported
spot's road ranks above a random road (Mann-Whitney), 0.5 = random.
"""
import json
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import numpy as np
import pandas as pd
import shapely
from pyproj import Transformer
from shapely import wkt

from floodroute.config import get_project_root, load_config

COMPONENTS = {
    "relative_low_elevation": "rank_rel",
    "absolute_low_elevation": "rank_abs",
    "near_water": "rank_water",
    "underpass": "rank_underpass",
}


def auc(scores: np.ndarray, idx: np.ndarray) -> float:
    """Mean over spots of P(random road scores lower), ties count half."""
    s = np.sort(scores)
    vals = scores[idx]
    below = np.searchsorted(s, vals, side="left")
    equal = np.searchsorted(s, vals, side="right") - below
    return float(np.mean((below + 0.5 * equal) / len(s)))


def pct_rank(scores: np.ndarray) -> np.ndarray:
    return pd.Series(scores).rank(pct=True, method="max").to_numpy()


def weighted(edges: pd.DataFrame, weights: dict) -> np.ndarray:
    total = sum(weights.values())
    return sum(edges[COMPONENTS[k]].to_numpy() * w / total for k, w in weights.items())


def main() -> None:
    root = get_project_root()
    cfg = load_config()
    vcfg = cfg["validation"]
    snap_m = float(vcfg["snap_distance_m"])
    weights = cfg["score_weights"]

    edges = pd.read_parquet(root / "data" / "processed" / "edges_scored.parquet")
    to_utm = Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True)
    geoms = [shapely.transform(wkt.loads(g), lambda xy: np.column_stack(to_utm.transform(xy[:, 0], xy[:, 1])))
             for g in edges["geometry_wkt"]]
    tree = shapely.STRtree(geoms)

    # Spot list: sourced rows of the hand-compiled file, coordinates from the geocoding step
    spots_src = pd.read_csv(root / "data" / "validation" / "flood_spots.csv")
    sourced_ids = set(spots_src.loc[spots_src["status"] == "sourced", "id"])
    geo = pd.read_csv(root / "data" / "processed" / "validation_spots_evaluated.csv")
    geo = geo[geo["id"].isin(sourced_ids)].dropna(subset=["lat", "lon"])

    rows, idx = [], []
    for _, sp in geo.iterrows():
        x, y = to_utm.transform(sp.lon, sp.lat)
        pt = shapely.Point(x, y)
        j = int(tree.nearest(pt))
        dist = float(pt.distance(geoms[j]))
        snapped = dist <= snap_m
        if snapped:
            idx.append(j)
        e = edges.iloc[j]
        rows.append({"name": sp["name"], "snap_m": round(dist, 1), "snapped": snapped,
                     "road": str(e["name"]) if pd.notna(e["name"]) else "Unnamed road",
                     "rank_pct": round(float(e["flood_rank_pct"]), 3) if snapped else None,
                     "rel_elev_m": round(float(e["rel_elev_m"]), 2),
                     "water_dist_m": round(float(e["water_dist_m"]), 0),
                     "is_underpass": bool(e["is_underpass"])})
    idx = np.array(idx)
    n = len(idx)

    score = edges["flood_score"].to_numpy()
    elev_only = edges["rank_abs"].to_numpy()
    rank_score, rank_elev = pct_rank(score), pct_rank(elev_only)

    curves = []
    for share in vcfg["flag_shares_to_evaluate"]:
        r_s = float(np.mean(rank_score[idx] >= 1 - share))
        r_e = float(np.mean(rank_elev[idx] >= 1 - share))
        curves.append({"flag_share": share, "recall_score": round(r_s, 3), "recall_elev_only": round(r_e, 3),
                       "expected_random": share, "caught": int(round(r_s * n)), "n": n,
                       "lift_score": round(r_s / share, 2), "lift_elev_only": round(r_e / share, 2)})

    rng = np.random.default_rng(vcfg["random_seed"])
    boots = [auc(score, rng.choice(idx, n, replace=True)) for _ in range(vcfg["bootstrap_iterations"])]
    lo, hi = np.percentile(boots, [2.5, 97.5])

    # Sensitivity: each signal alone, and each weight halved / increased by half (renormalised)
    variants = [{"variant": "configured weights", "auc": round(auc(score, idx), 3)}]
    for k, col in COMPONENTS.items():
        variants.append({"variant": f"{k} only", "auc": round(auc(edges[col].to_numpy(), idx), 3)})
    for k in weights:
        for f in (0.5, 1.5):
            w = dict(weights); w[k] = weights[k] * f
            variants.append({"variant": f"{k} x{f}", "auc": round(auc(weighted(edges, w), idx), 3)})

    result = {
        "data_mode": "real",
        "n_spots": n,
        "n_spots_total": len(rows),
        "snap_m": snap_m,
        "auc_score": round(auc(score, idx), 3),
        "auc_elev_only": round(auc(elev_only, idx), 3),
        "auc_random": 0.5,
        "ci": {"low": round(float(lo), 3), "high": round(float(hi), 3),
               "method": f"bootstrap over spots, {vcfg['bootstrap_iterations']} resamples, seed {vcfg['random_seed']}"},
        "curves": curves,
        "sensitivity": {"weights": weights, "share_grid": vcfg["flag_shares_to_evaluate"], "auc_by_variant": variants},
        "spots": sorted(rows, key=lambda r: -(r["rank_pct"] or -1)),
        "notes": ("Weights were fixed in config.yaml before this evaluation and were not changed after it. "
                  "Small sample of reported spots, biased toward busy roads; the 30 m elevation model is a "
                  "surface model (includes buildings, flyovers and embankments)."),
    }
    out = root / "data" / "processed" / "validation_results.json"
    out.write_text(json.dumps(result, indent=1), encoding="utf-8")
    print(f"spots: {len(rows)} | snapped within {snap_m:.0f} m: {n}")
    print(f"AUC score {result['auc_score']} (95% CI {result['ci']['low']}-{result['ci']['high']}) | "
          f"elevation-only {result['auc_elev_only']} | random 0.5")
    for c in curves:
        print(f"  top {int(c['flag_share']*100):>2}%: caught {c['caught']}/{n} (random {c['flag_share']*n:.1f})")
    print("sensitivity:", [(v["variant"], v["auc"]) for v in variants])
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
