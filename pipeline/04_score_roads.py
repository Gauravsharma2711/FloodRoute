"""Score road network for flood-proneness and save processed graph and parquet."""
import sys
from pathlib import Path
import pickle
import geopandas as gpd

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from floodroute.config import load_config, get_project_root
from floodroute.scoring import score_network
from floodroute.io import save_graph

def main():
    root = get_project_root()
    cfg = load_config()
    raw_dir = root / "data" / "raw"
    processed_dir = root / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    graph_elev_path = raw_dir / "osm_graph_with_elev.pkl"
    water_path = raw_dir / "osm_water.parquet"
    
    if not graph_elev_path.exists():
        raise FileNotFoundError(f"{graph_elev_path} not found. Run 02_fetch_elevation.py first.")
    if not water_path.exists():
        raise FileNotFoundError(f"{water_path} not found. Run 01_fetch_osm.py first.")
        
    print(f"Loading graph with elevations from {graph_elev_path}...")
    with open(graph_elev_path, "rb") as f:
        G = pickle.load(f)
        
    print(f"Loading waterways from {water_path}...")
    water_gdf = gpd.read_parquet(water_path)
    
    print("Scoring road network...")
    G_scored, df_scored = score_network(G, water_gdf, cfg)
    
    # Save graph.pkl
    out_graph_path = processed_dir / "graph.pkl"
    print(f"Saving scored graph to {out_graph_path}...")
    save_graph(G_scored, out_graph_path)
    
    # Save edges_scored.parquet
    out_parquet_path = processed_dir / "edges_scored.parquet"
    print(f"Saving scored edges table to {out_parquet_path}...")
    df_export = df_scored.copy()
    df_export["geometry_wkt"] = df_export["geometry"].apply(lambda g: g.wkt if g is not None else "")
    gdf_export = gpd.GeoDataFrame(df_export, geometry="geometry", crs="EPSG:4326")
    gdf_export.to_parquet(out_parquet_path)
    
    print("\n--- Scored Edges Summary ---")
    print(f"Total scored edges: {len(df_scored):,}")
    print(f"Bridges: {df_scored['is_bridge'].sum():,} ({df_scored['is_bridge'].mean()*100:.1f}%)")
    print(f"Underpasses: {df_scored['is_underpass'].sum():,} ({df_scored['is_underpass'].mean()*100:.1f}%)")
    print("\nFlood Score Distribution:")
    print(df_scored["flood_score"].describe().to_string())
    print("\nRelative Elevation (m) Distribution:")
    print(df_scored["rel_elev_m"].describe().to_string())
    print("\nWater Distance (m) Distribution:")
    print(df_scored["water_dist_m"].describe().to_string())
    print(f"\nSaved graph size: {out_graph_path.stat().st_size / (1024*1024):.2f} MB")
    print(f"Saved parquet size: {out_parquet_path.stat().st_size / (1024*1024):.2f} MB")
    print("\n[04_score_roads.py completed successfully]")

if __name__ == "__main__":
    main()
