"""Sample elevation at road nodes using Copernicus DEM GLO-30 HTTP window reads."""
import sys
from pathlib import Path
import math
import pickle
import pandas as pd
import numpy as np
import rasterio

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from floodroute.config import get_project_root

def get_copernicus_tile_url(lat: float, lon: float) -> str:
    n = f"N{math.floor(lat):02d}_00"
    e = f"E{math.floor(lon):03d}_00"
    tile_name = f"Copernicus_DSM_COG_10_{n}_{e}_DEM"
    return f"https://copernicus-dem-30m.s3.amazonaws.com/{tile_name}/{tile_name}.tif"

def main():
    root = get_project_root()
    raw_dir = root / "data" / "raw"
    graph_raw_path = raw_dir / "osm_graph_raw.pkl"
    elev_cache_path = raw_dir / "node_elevations.parquet"
    graph_elev_path = raw_dir / "osm_graph_with_elev.pkl"
    
    if not graph_raw_path.exists():
        raise FileNotFoundError(f"Raw graph not found at {graph_raw_path}. Run 01_fetch_osm.py first.")
        
    print(f"Loading raw graph from {graph_raw_path}...")
    with open(graph_raw_path, "rb") as f:
        G = pickle.load(f)
        
    nodes = list(G.nodes(data=True))
    print(f"Total road nodes to sample: {len(nodes):,}")
    
    if elev_cache_path.exists():
        print(f"Loading cached elevations from {elev_cache_path}...")
        df_elev = pd.read_parquet(elev_cache_path)
        elev_dict = dict(zip(df_elev["node_id"], df_elev["elev_m"]))
        nodata_count = int(df_elev["is_nodata"].sum())
    else:
        # Group nodes by tile
        groups = {}
        for node_id, data in nodes:
            lon = data["x"]
            lat = data["y"]
            tile_url = get_copernicus_tile_url(lat, lon)
            if tile_url not in groups:
                groups[tile_url] = []
            groups[tile_url].append((node_id, lon, lat))
            
        elev_records = []
        nodata_count = 0
        
        for tile_url, group_nodes in groups.items():
            print(f"Sampling {len(group_nodes):,} nodes from Copernicus COG: {tile_url.split('/')[-1]}...")
            coords = [(lon, lat) for _, lon, lat in group_nodes]
            
            with rasterio.open(tile_url) as ds:
                # ds.sample returns generator of numpy arrays
                samples = list(ds.sample(coords))
                
            for (node_id, lon, lat), sample in zip(group_nodes, samples):
                val = float(sample[0])
                is_nodata = False
                # Copernicus nodata is typically -32767 or <= -100 (ocean is not covered, set to 0.0)
                if np.isnan(val) or val <= -100 or val == ds.nodata:
                    is_nodata = True
                    nodata_count += 1
                    val = 0.0
                    
                elev_records.append({
                    "node_id": node_id,
                    "lon": lon,
                    "lat": lat,
                    "elev_m": val,
                    "is_nodata": is_nodata
                })
                
        df_elev = pd.DataFrame(elev_records)
        df_elev.to_parquet(elev_cache_path)
        print(f"Saved node elevations to {elev_cache_path}")
        elev_dict = dict(zip(df_elev["node_id"], df_elev["elev_m"]))

    # Attach elevation to graph nodes
    for node_id, data in G.nodes(data=True):
        data["elev_m"] = elev_dict.get(node_id, 0.0)
        
    with open(graph_elev_path, "wb") as f:
        pickle.dump(G, f)
    print(f"Saved graph with elevations to {graph_elev_path}")
    
    elevations = df_elev["elev_m"]
    print("\nElevation Summary (meters above sea level):")
    print(f"  Count:  {len(elevations):,}")
    print(f"  Nodata / ocean points: {nodata_count:,} ({nodata_count/len(elevations)*100:.2f}%) -> treated as 0.0 m")
    print(f"  Min:    {elevations.min():.2f} m")
    print(f"  25%:    {elevations.quantile(0.25):.2f} m")
    print(f"  Median: {elevations.median():.2f} m")
    print(f"  75%:    {elevations.quantile(0.75):.2f} m")
    print(f"  Max:    {elevations.max():.2f} m")
    print("\n[02_fetch_elevation.py completed successfully]")

if __name__ == "__main__":
    main()
