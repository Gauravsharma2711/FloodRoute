import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import pickle
import geopandas as gpd
import osmnx as ox
from floodroute.config import load_config, get_project_root

def main():
    root = get_project_root()
    cfg = load_config()
    
    raw_dir = root / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    graph_cache = raw_dir / "osm_graph_raw.pkl"
    hospitals_cache = raw_dir / "osm_hospitals.parquet"
    water_cache = raw_dir / "osm_water.parquet"
    
    bbox_cfg = cfg["bbox"]
    west = bbox_cfg["west"]
    south = bbox_cfg["south"]
    east = bbox_cfg["east"]
    north = bbox_cfg["north"]
    bbox = (west, south, east, north)
    
    road_filter = cfg["road_filter"]
    fallback_speed = cfg.get("routing", {}).get("default_speed_kmh_fallback", 25)
    
    ox.settings.use_cache = True
    ox.settings.cache_folder = str(raw_dir / "cache")
    ox.settings.requests_timeout = 180
    ox.settings.overpass_rate_limit = True
    ox.settings.user_agent = "FloodRoute_Mumbai_Disaster_Response_Research/1.0"
    
    print(f"OSMnx version: {ox.__version__}")
    print(f"Bounding box (west, south, east, north): {bbox}")
    
    # 1. Road Graph
    if graph_cache.exists():
        print(f"Loading cached road graph from {graph_cache}")
        with open(graph_cache, "rb") as f:
            G = pickle.load(f)
    else:
        print(f"Fetching road graph from Overpass API (filter: {road_filter})...")
        import time
        max_retries = 3
        for attempt in range(max_retries):
            try:
                G = ox.graph_from_bbox(bbox=bbox, custom_filter=road_filter, simplify=True)
                break
            except Exception as e:
                print(f"Overpass attempt {attempt+1}/{max_retries} failed: {e}")
                if attempt == max_retries - 1:
                    raise
                time.sleep(10 * (attempt + 1))
        # Add edge speeds and travel times
        try:
            G = ox.add_edge_speeds(G, fallback=fallback_speed)
        except TypeError:
            # Older/newer signature handling
            G = ox.add_edge_speeds(G)
        G = ox.add_edge_travel_times(G)
        
        # Ensure all edges have travel_time
        for u, v, k, d in G.edges(keys=True, data=True):
            if "travel_time" not in d or d["travel_time"] is None or d["travel_time"] <= 0:
                length = d.get("length", 10.0)
                speed_kmh = d.get("speed_kph", fallback_speed)
                d["travel_time"] = length / (speed_kmh * 1000.0 / 3600.0)
                
        with open(graph_cache, "wb") as f:
            pickle.dump(G, f)
        print(f"Saved road graph to {graph_cache}")
        
    num_nodes = G.number_of_nodes()
    num_edges = G.number_of_edges()
    print(f"Road network: {num_nodes:,} nodes, {num_edges:,} edges")

    # 2. Hospitals
    if hospitals_cache.exists():
        print(f"Loading cached hospitals from {hospitals_cache}")
        hospitals_gdf = gpd.read_parquet(hospitals_cache)
    else:
        print("Fetching hospitals from Overpass API...")
        import time
        for attempt in range(3):
            try:
                hospitals_gdf = ox.features_from_bbox(bbox=bbox, tags={"amenity": "hospital"})
                break
            except Exception as e:
                print(f"Hospitals fetch attempt {attempt+1}/3 failed: {e}")
                if attempt == 2:
                    raise
                time.sleep(5 * (attempt + 1))
        # Keep relevant columns and ensure geometry is 2D
        hospitals_gdf.to_parquet(hospitals_cache)
        print(f"Saved hospitals to {hospitals_cache}")
        
    named_hospitals = hospitals_gdf["name"].dropna().count() if "name" in hospitals_gdf.columns else 0
    total_hospitals = len(hospitals_gdf)
    print(f"Hospitals: {total_hospitals} total ({named_hospitals} named, {total_hospitals - named_hospitals} unnamed)")

    # 3. Waterways & Coastline
    if water_cache.exists():
        print(f"Loading cached waterways from {water_cache}")
        water_gdf = gpd.read_parquet(water_cache)
    else:
        print("Fetching waterways and coastline from Overpass API...")
        water_tags = {
            "waterway": ["river", "stream", "canal", "drain"],
            "natural": ["coastline", "water", "bay"]
        }
        for attempt in range(3):
            try:
                water_gdf = ox.features_from_bbox(bbox=bbox, tags=water_tags)
                break
            except Exception as e:
                print(f"Waterways fetch attempt {attempt+1}/3 failed: {e}")
                if attempt == 2:
                    raise
                time.sleep(5 * (attempt + 1))
        water_gdf.to_parquet(water_cache)
        print(f"Saved waterways to {water_cache}")
        
    print(f"Water features: {len(water_gdf)} features")
    if "waterway" in water_gdf.columns:
        print(f"  Waterway types breakdown:\n{water_gdf['waterway'].value_counts().to_string()}")

    print("\n[01_fetch_osm.py completed successfully]")

if __name__ == "__main__":
    main()
