"""Flood-proneness scoring logic."""
from typing import Any, Dict, Tuple
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree
from pyproj import Transformer
import shapely
from shapely.geometry import LineString, Point

# Project coordinates: WGS84 (EPSG:4326) to UTM zone 43N (EPSG:32643) for Mumbai
transformer_to_utm = Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True)

def compute_relative_elevations(G: Any, radius_m: float = 300.0) -> Dict[Any, float]:
    """Compute relative elevation for each node:
    node elevation minus median elevation within radius_m.
    """
    node_ids = list(G.nodes())
    lons = np.array([G.nodes[n]["x"] for n in node_ids])
    lats = np.array([G.nodes[n]["y"] for n in node_ids])
    elevs = np.array([G.nodes[n].get("elev_m", 0.0) for n in node_ids])
    
    xs, ys = transformer_to_utm.transform(lons, lats)
    coords_utm = np.column_stack([xs, ys])
    
    tree = cKDTree(coords_utm)
    # Find neighbours within radius_m
    neighbour_indices = tree.query_ball_tree(tree, r=radius_m)
    
    rel_elevs = {}
    for idx, neighbours in enumerate(neighbour_indices):
        local_median = np.median(elevs[neighbours])
        rel_elevs[node_ids[idx]] = float(elevs[idx] - local_median)
        
    return rel_elevs

def compute_water_distances(edge_midpoints_utm: np.ndarray, water_gdf: Any) -> np.ndarray:
    """Compute distance in meters from each edge midpoint to nearest water feature."""
    water_utm = water_gdf.to_crs(epsg=32643)
    # Combine water geometries into a unified geometry or use STRtree
    # To avoid union overhead on large multi-polygons, use shapely STRtree
    water_geoms = [g for g in water_utm.geometry if g is not None and not g.is_empty]
    
    if not water_geoms:
        return np.full(len(edge_midpoints_utm), 1000.0)
        
    tree = shapely.STRtree(water_geoms)
    points = [Point(xy) for xy in edge_midpoints_utm]
    
    # Query nearest geometry for each point
    nearest_idx = tree.nearest(points)
    distances = np.array([points[i].distance(water_geoms[nearest_idx[i]]) for i in range(len(points))])
    return distances

def score_network(
    G: Any,
    water_gdf: Any,
    config: Dict[str, Any]
) -> Tuple[Any, pd.DataFrame]:
    """Score all road edges in G based on terrain, water proximity, and structure type."""
    weights = config["score_weights"]
    w_rel = weights["relative_low_elevation"]
    w_abs = weights["absolute_low_elevation"]
    w_water = weights["near_water"]
    w_under = weights["underpass"]
    radius_m = config.get("neighbourhood_radius_m", 300.0)
    
    print(f"Computing relative elevations (radius={radius_m}m)...")
    rel_elev_dict = compute_relative_elevations(G, radius_m=radius_m)
    
    # Extract edge features
    edges = list(G.edges(keys=True, data=True))
    n_edges = len(edges)
    print(f"Extracting attributes for {n_edges:,} edges...")
    
    records = []
    midpoint_coords_lonlat = []
    
    for u, v, k, d in edges:
        # Length & travel time
        length_m = float(d.get("length", 10.0))
        travel_time_s = float(d.get("travel_time", length_m / 6.94))  # ~25 km/h fallback
        
        # Geometry
        geom = d.get("geometry")
        u_node = G.nodes[u]
        v_node = G.nodes[v]
        if geom is None:
            geom = LineString([(u_node["x"], u_node["y"]), (v_node["x"], v_node["y"])])
            d["geometry"] = geom
            
        mid_x, mid_y = geom.interpolate(0.5, normalized=True).coords[0]
        midpoint_coords_lonlat.append((mid_x, mid_y))
        
        # Absolute and relative elevation
        u_elev = u_node.get("elev_m", 0.0)
        v_elev = v_node.get("elev_m", 0.0)
        abs_elev = (u_elev + v_elev) / 2.0
        
        u_rel = rel_elev_dict.get(u, 0.0)
        v_rel = rel_elev_dict.get(v, 0.0)
        rel_elev = (u_rel + v_rel) / 2.0
        
        # Bridge detection
        bridge_tag = str(d.get("bridge", "no")).lower()
        layer_val = 0
        try:
            layer_val = int(d.get("layer", 0))
        except (ValueError, TypeError):
            pass
        is_bridge = (bridge_tag in ["yes", "viaduct", "cantilever"]) or (layer_val > 0)
        
        # Underpass detection
        tunnel_tag = str(d.get("tunnel", "no")).lower()
        name_tag = str(d.get("name", "")).lower()
        is_underpass = (
            (tunnel_tag in ["yes", "building_passage", "subway", "covered"]) or
            (layer_val < 0) or
            ("subway" in name_tag) or
            ("underpass" in name_tag)
        )
        
        # Highway class, name and osmid
        highway = d.get("highway", "unclassified")
        if isinstance(highway, list):
            highway = highway[0]
            
        name = d.get("name", "")
        if isinstance(name, list):
            name = " / ".join(str(n) for n in name if n)
        elif name is None:
            name = ""
        else:
            name = str(name)
            
        osmid = d.get("osmid", 0)
        if isinstance(osmid, list):
            osmid = osmid[0]
            
        records.append({
            "u": u,
            "v": v,
            "key": k,
            "osmid": int(osmid) if str(osmid).isdigit() else 0,
            "name": name,
            "highway": str(highway),
            "length_m": length_m,
            "travel_time_s": travel_time_s,
            "abs_elev_m": abs_elev,
            "rel_elev_m": rel_elev,
            "is_underpass": bool(is_underpass),
            "is_bridge": bool(is_bridge),
            "geometry": geom
        })
        
    df = pd.DataFrame(records)
    
    # Compute water distances in UTM
    midpoints_lonlat = np.array(midpoint_coords_lonlat)
    mid_xs, mid_ys = transformer_to_utm.transform(midpoints_lonlat[:, 0], midpoints_lonlat[:, 1])
    midpoints_utm = np.column_stack([mid_xs, mid_ys])
    
    print("Computing distances to waterways/coastline...")
    water_dists = compute_water_distances(midpoints_utm, water_gdf)
    df["water_dist_m"] = water_dists
    
    # Compute rank-normalised components in [0, 1] where 1 = most flood-prone
    # Relative low elevation: lower = more prone -> inverted rank
    df["rank_rel"] = 1.0 - (df["rel_elev_m"].rank(method="average") - 1.0) / (n_edges - 1.0)
    
    # Absolute low elevation: lower = more prone -> inverted rank
    df["rank_abs"] = 1.0 - (df["abs_elev_m"].rank(method="average") - 1.0) / (n_edges - 1.0)
    
    # Near water: closer = more prone -> inverted rank
    df["rank_water"] = 1.0 - (df["water_dist_m"].rank(method="average") - 1.0) / (n_edges - 1.0)
    
    # Underpass: 1.0 if underpass else 0.0
    df["rank_underpass"] = df["is_underpass"].astype(float)
    
    # Weighted flood_score
    df["flood_score"] = (
        w_rel * df["rank_rel"] +
        w_abs * df["rank_abs"] +
        w_water * df["rank_water"] +
        w_under * df["rank_underpass"]
    )
    
    # Rank percentile among all edges (0 to 1, where 1 = most prone)
    df["flood_rank_pct"] = (df["flood_score"].rank(method="average") - 1.0) / (n_edges - 1.0)
    
    # Write attributes back to graph edges
    for idx, row in df.iterrows():
        u = row["u"]
        v = row["v"]
        k = row["key"]
        d = G[u][v][k]
        d["osmid"] = row["osmid"]
        d["name"] = row["name"]
        d["highway"] = row["highway"]
        d["length_m"] = row["length_m"]
        d["travel_time_s"] = row["travel_time_s"]
        d["flood_score"] = float(row["flood_score"])
        d["flood_rank_pct"] = float(row["flood_rank_pct"])
        d["rel_elev_m"] = float(row["rel_elev_m"])
        d["water_dist_m"] = float(row["water_dist_m"])
        d["is_underpass"] = bool(row["is_underpass"])
        d["is_bridge"] = bool(row["is_bridge"])
        d["geometry"] = row["geometry"]
        
    return G, df
