"""Geocode validation spots, save to CSV, produce maps and print score rankings."""
import sys
from pathlib import Path
import pickle
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe
from shapely.geometry import Point, LineString
from pyproj import Transformer

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from floodroute.config import load_config, get_project_root

transformer_to_utm = Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True)

# Sourced spots geocode dictionary
GEOCODE_LOOKUP = {
    "Hindmata Junction": (19.01010, 72.84214),
    "Gandhi Market": (19.03489, 72.86001),
    "Chembur Circle": (19.05406, 72.89464),
    "Milan Subway": (19.09047, 72.84259),
    "Antop Hill fire station area": (19.02679, 72.86412),
    "Vidyalankar Institute area": (19.02162, 72.87091),
    "Gurukripa Hotel": (19.04291, 72.86189),
    "Guru Nanak School": (19.04067, 72.85968),
    "Oval Maidan": (18.92959, 72.82894),
    "Mantralaya": (18.92766, 72.82704),
    "Kemps Corner": (18.96375, 72.80686),
    "Churchgate": (18.93548, 72.82717),
    "Metro Cinema junction": (18.94331, 72.82990),
    "Hutatma Chowk": (18.93274, 72.83163)
}

def main():
    root = get_project_root()
    cfg = load_config()
    csv_path = root / "data" / "validation" / "flood_spots.csv"
    graph_path = root / "data" / "processed" / "graph.pkl"
    processed_dir = root / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Update CSV with geocoded coordinates
    df_spots = pd.read_csv(csv_path)
    updated = False
    for idx, row in df_spots.iterrows():
        name = row["name"]
        if row["status"] == "sourced":
            if pd.isna(row["lat"]) or pd.isna(row["lon"]) or row["lat"] == "" or row["lon"] == "":
                if name in GEOCODE_LOOKUP:
                    lat, lon = GEOCODE_LOOKUP[name]
                    df_spots.at[idx, "lat"] = lat
                    df_spots.at[idx, "lon"] = lon
                    updated = True
                    
    if updated:
        df_spots.to_csv(csv_path, index=False)
        print(f"Updated {csv_path} with geocoded coordinates.")
    else:
        print(f"Coordinates already present in {csv_path}.")

    # Filter to sourced spots with valid coordinates
    sourced_spots = df_spots[(df_spots["status"] == "sourced") & (df_spots["lat"].notna()) & (df_spots["lon"].notna())].copy()
    print(f"Loaded {len(sourced_spots)} sourced validation spots.")

    # 2. Load Scored Road Graph
    print(f"Loading scored graph from {graph_path}...")
    with open(graph_path, "rb") as f:
        G = pickle.load(f)

    # Convert edges to DataFrame and spatial index in UTM
    edges = list(G.edges(keys=True, data=True))
    edge_records = []
    for u, v, k, d in edges:
        geom = d["geometry"]
        edge_records.append({
            "u": u, "v": v, "key": k,
            "osmid": d.get("osmid", 0),
            "name": d.get("name", ""),
            "highway": d.get("highway", ""),
            "flood_score": d.get("flood_score", 0.0),
            "flood_rank_pct": d.get("flood_rank_pct", 0.0),
            "rel_elev_m": d.get("rel_elev_m", 0.0),
            "abs_elev_m": (G.nodes[u].get("elev_m", 0.0) + G.nodes[v].get("elev_m", 0.0)) / 2.0,
            "water_dist_m": d.get("water_dist_m", 0.0),
            "is_underpass": d.get("is_underpass", False),
            "is_bridge": d.get("is_bridge", False),
            "geometry": geom
        })
    df_edges = pd.DataFrame(edge_records)

    # 3. Snap spots to nearest road edge
    snap_distance_m = cfg.get("validation", {}).get("snap_distance_m", 150)
    
    spot_eval_rows = []
    for _, spot in sourced_spots.iterrows():
        s_lat = float(spot["lat"])
        s_lon = float(spot["lon"])
        s_x, s_y = transformer_to_utm.transform(s_lon, s_lat)
        spot_pt_utm = Point(s_x, s_y)
        
        # Find nearest edge in UTM
        best_dist = float("inf")
        best_edge = None
        
        for _, edge in df_edges.iterrows():
            geom = edge["geometry"]
            # Transform geometry to UTM
            xs, ys = transformer_to_utm.transform(geom.xy[0], geom.xy[1])
            geom_utm = LineString(zip(xs, ys))
            dist = spot_pt_utm.distance(geom_utm)
            if dist < best_dist:
                best_dist = dist
                best_edge = edge
                
        spot_eval_rows.append({
            "id": spot["id"],
            "name": spot["name"],
            "area": spot["area"],
            "lat": s_lat,
            "lon": s_lon,
            "snap_dist_m": best_dist,
            "snapped": best_dist <= snap_distance_m,
            "nearest_road": best_edge["name"] if best_edge is not None else "",
            "nearest_highway": best_edge["highway"] if best_edge is not None else "",
            "flood_score": best_edge["flood_score"] if best_edge is not None else 0.0,
            "flood_rank_pct": best_edge["flood_rank_pct"] if best_edge is not None else 0.0,
            "rel_elev_m": best_edge["rel_elev_m"] if best_edge is not None else 0.0,
            "abs_elev_m": best_edge["abs_elev_m"] if best_edge is not None else 0.0,
            "water_dist_m": best_edge["water_dist_m"] if best_edge is not None else 0.0,
            "is_underpass": best_edge["is_underpass"] if best_edge is not None else False
        })
        
    df_eval = pd.DataFrame(spot_eval_rows)

    # 4. Generate Map 1: Eyeball Map of Geocoded Points
    fig, ax = plt.subplots(figsize=(10, 12), dpi=200)
    ax.set_facecolor("#FAFAFA")
    
    # Plot road network in light gray
    for _, edge in df_edges.iterrows():
        geom = edge["geometry"]
        ax.plot(*geom.xy, color="#D1D5DB", linewidth=0.5, zorder=1)
        
    # Plot spots
    sc = ax.scatter(
        df_eval["lon"], df_eval["lat"],
        c=df_eval["flood_rank_pct"], cmap="YlOrRd",
        s=80, edgecolor="black", linewidth=1.2, zorder=3,
        vmin=0.0, vmax=1.0
    )
    
    # Annotate spots
    for _, row in df_eval.iterrows():
        short_name = row["name"].split("/")[0].split("fire")[0].strip()
        pct_label = f"{short_name} ({row['flood_rank_pct']*100:.0f}%)"
        ax.annotate(
            pct_label, (row["lon"], row["lat"]),
            xytext=(6, 4), textcoords="offset points",
            fontsize=8, fontweight="bold",
            path_effects=[pe.withStroke(linewidth=2.5, foreground="white")]
        )
        
    plt.colorbar(sc, ax=ax, fraction=0.03, pad=0.04, label="Flood Rank Percentile (1 = Most Prone)")
    ax.set_title("Eyeball Verification: 14 Geocoded Reported Waterlogging Spots\n(Mumbai Road Network)", fontsize=13, fontweight="bold")
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_xlim(72.80, 72.93)
    ax.set_ylim(18.89, 19.14)
    plt.tight_layout()
    
    eyeball_map_path = processed_dir / "geocoded_spots_eyeball.png"
    fig.savefig(eyeball_map_path, dpi=200)
    plt.close(fig)
    print(f"Saved eyeball verification map to {eyeball_map_path}")

    # 5. Generate Map 2: High-Resolution Static Flood-Proneness Map
    fig, ax = plt.subplots(figsize=(12, 15), dpi=300)
    ax.set_facecolor("#0F172A") # elegant dark slate background for high contrast
    
    # Sort edges so highest scoring are drawn on top
    df_edges_sorted = df_edges.sort_values("flood_score")
    
    # Plot edges coloured by flood_score
    norm = plt.Normalize(vmin=df_edges["flood_score"].min(), vmax=df_edges["flood_score"].max())
    cmap = plt.cm.plasma
    
    # Non-bridge edges
    for _, edge in df_edges_sorted.iterrows():
        geom = edge["geometry"]
        score = edge["flood_score"]
        if edge["is_bridge"]:
            ax.plot(*geom.xy, color="#94A3B8", linewidth=1.0, alpha=0.4, linestyle=":", zorder=2)
        else:
            c = cmap(norm(score))
            lw = 0.6 + 1.8 * (score ** 2)
            alpha = 0.3 + 0.7 * score
            ax.plot(*geom.xy, color=c, linewidth=lw, alpha=alpha, zorder=2)
            
    # Overlay validation spots
    ax.scatter(
        df_eval["lon"], df_eval["lat"],
        s=120, facecolor="#00FFA3", edgecolor="#FFFFFF",
        linewidth=2.0, zorder=5, label="Reported Waterlogging Spot"
    )
    
    # Annotate top key spots
    key_callouts = ["Hindmata", "Gandhi Market", "Milan Subway", "Chembur Circle", "Antop Hill"]
    for _, row in df_eval.iterrows():
        name = row["name"]
        pct = row["flood_rank_pct"] * 100
        score = row["flood_score"]
        is_key = any(k.lower() in name.lower() for k in key_callouts)
        
        lbl = f"{name}\nRank: {pct:.1f}% | Score: {score:.2f}"
        ax.annotate(
            lbl, (row["lon"], row["lat"]),
            xytext=(10, 8), textcoords="offset points",
            fontsize=8 if not is_key else 9,
            fontweight="bold" if is_key else "normal",
            color="#FFFFFF" if is_key else "#CBD5E1",
            bbox=dict(boxstyle="round,pad=0.2", facecolor="#1E293B", edgecolor="#00FFA3" if is_key else "#475569", alpha=0.9),
            zorder=6
        )
        
    sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
    sm.set_array([])
    cbar = plt.colorbar(sm, ax=ax, fraction=0.03, pad=0.03)
    cbar.set_label("Flood-Proneness Score (0 = Low, 1 = High)", color="#FFFFFF", fontsize=11)
    cbar.ax.yaxis.set_tick_params(color="#FFFFFF")
    plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='#FFFFFF')
    
    ax.set_title("FloodRoute — Mumbai Road Flood-Proneness Map (GLO-30 + Overpass OSM)\nValidation Spots Overlaid with Score & Rank Percentile",
                 color="#FFFFFF", fontsize=13, fontweight="bold", pad=15)
    ax.set_xlim(72.80, 72.93)
    ax.set_ylim(18.89, 19.14)
    ax.tick_params(colors="#94A3B8")
    for spine in ax.spines.values():
        spine.set_color("#334155")
        
    plt.tight_layout()
    flood_map_path = processed_dir / "flood_proneness_map.png"
    fig.savefig(flood_map_path, dpi=300)
    plt.close(fig)
    print(f"Saved static flood-proneness map to {flood_map_path}")

    # 6. Print Full Results Table
    print("\n" + "="*80)
    print("CHECKPOINT 1 — VALIDATION SPOTS EVALUATION & RANK PERCENTILE")
    print("="*80)
    print(f"{'Spot Name':<30} | {'Area':<18} | {'Score':<6} | {'Rank %':<7} | {'RelElev':<7} | {'AbsElev':<7} | {'WaterDist':<9}")
    print("-" * 95)
    for _, row in df_eval.sort_values("flood_rank_pct", ascending=False).iterrows():
        print(f"{row['name'][:28]:<30} | {row['area'][:16]:<18} | {row['flood_score']:<6.3f} | {row['flood_rank_pct']*100:<6.1f}% | {row['rel_elev_m']:<+6.2f}m | {row['abs_elev_m']:<6.2f}m | {row['water_dist_m']:<7.1f}m")
    print("-" * 95)
    
    print("\n>>> KEY SPOTS SPECIFIC RANKINGS <<<")
    for spot_key in ["Hindmata", "Gandhi Market", "Milan Subway", "Chembur Circle", "Antop Hill"]:
        matches = df_eval[df_eval["name"].str.contains(spot_key, case=False, na=False)]
        for _, m in matches.iterrows():
            print(f" • {m['name']} ({m['area']}):")
            print(f"     Flood Score: {m['flood_score']:.3f} | Rank Percentile: {m['flood_rank_pct']*100:.1f}% (top {(1-m['flood_rank_pct'])*100:.1f}%)")
            print(f"     Rel Elev: {m['rel_elev_m']:+.2f} m | Abs Elev: {m['abs_elev_m']:.2f} m | Water Dist: {m['water_dist_m']:.1f} m | Underpass: {m['is_underpass']}")

    # Save df_eval to data/processed/validation_spots_evaluated.csv
    eval_csv_path = processed_dir / "validation_spots_evaluated.csv"
    df_eval.to_csv(eval_csv_path, index=False)
    print(f"\nSaved evaluated spots to {eval_csv_path}")

if __name__ == "__main__":
    main()
