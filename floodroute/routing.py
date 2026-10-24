"""Routing logic: normal route vs flood-safe route to the nearest hospital.

The normal route is the fastest path (by free-flow travel time from OSM speeds) on the full
road graph. The flood-safe route is the fastest path after removing the flagged edges
(see floodroute.flagging). Both go to the nearest reachable hospital, so they can end at
different hospitals.
"""
from typing import Any, Callable, Dict, Iterable, List, Optional, Set, Tuple

import networkx as nx
import numpy as np

EdgeKey = Tuple[Any, Any, Any]

EARTH_RADIUS_M = 6_371_000.0


def haversine_m(lat1: float, lon1: float, lat2: Any, lon2: Any) -> Any:
    """Great-circle distance in metres; lat2/lon2 may be numpy arrays."""
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dlat = p2 - p1
    dlon = np.radians(lon2) - np.radians(lon1)
    a = np.sin(dlat / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_M * np.arcsin(np.sqrt(a))


def routable_nodes(graph: Any) -> List[Any]:
    """Nodes of the largest strongly connected component (every node can reach every other)."""
    return list(max(nx.strongly_connected_components(graph), key=len))


def _weight(flagged: Set[EdgeKey]) -> Callable[[Any, Any, Dict[Any, Dict[str, Any]]], Optional[float]]:
    """Dijkstra weight for a MultiDiGraph: fastest parallel edge that is not flagged; None = no edge."""
    def w(u: Any, v: Any, edges: Dict[Any, Dict[str, Any]]) -> Optional[float]:
        times = [d["travel_time_s"] for k, d in edges.items() if (u, v, k) not in flagged]
        return min(times) if times else None
    return w


def _best_key(graph: Any, u: Any, v: Any, flagged: Set[EdgeKey]) -> Any:
    edges = graph[u][v]
    allowed = [(d["travel_time_s"], k) for k, d in edges.items() if (u, v, k) not in flagged]
    return min(allowed)[1]


def _edge_coords(graph: Any, u: Any, v: Any, k: Any) -> List[List[float]]:
    """Edge geometry as [[lat, lon], ...] oriented from u to v."""
    d = graph[u][v][k]
    geom = d.get("geometry")
    if geom is None:
        pts = [(graph.nodes[u]["x"], graph.nodes[u]["y"]), (graph.nodes[v]["x"], graph.nodes[v]["y"])]
    else:
        pts = list(geom.coords)
        ux, uy = graph.nodes[u]["x"], graph.nodes[u]["y"]
        if (pts[0][0] - ux) ** 2 + (pts[0][1] - uy) ** 2 > (pts[-1][0] - ux) ** 2 + (pts[-1][1] - uy) ** 2:
            pts.reverse()
    return [[round(lat, 6), round(lon, 6)] for lon, lat in pts]


def _road_name(d: Dict[str, Any]) -> str:
    name = d.get("name")
    if isinstance(name, list):
        name = " / ".join(str(n) for n in name if n)
    return str(name) if name else "Unnamed road"


def _nearest_hospital_path(
    graph: Any, source: Any, hospital_by_node: Dict[Any, Dict[str, Any]], flagged: Set[EdgeKey]
) -> Optional[Tuple[Dict[str, Any], List[Any], float]]:
    dist, paths = nx.single_source_dijkstra(graph, source, weight=_weight(flagged))
    reachable = [(dist[n], n) for n in hospital_by_node if n in dist]
    if not reachable:
        return None
    seconds, node = min(reachable)
    return hospital_by_node[node], paths[node], seconds


def _leg(graph: Any, path: List[Any], seconds: float, hospital: Dict[str, Any],
         origin: Tuple[float, float], flagged: Set[EdgeKey]) -> Tuple[Dict[str, Any], List[EdgeKey]]:
    keys = [(u, v, _best_key(graph, u, v, flagged)) for u, v in zip(path[:-1], path[1:])]
    coords: List[List[float]] = [[round(origin[0], 6), round(origin[1], 6)]]
    for u, v, k in keys:
        coords.extend(_edge_coords(graph, u, v, k))
    coords.append([hospital["lat"], hospital["lon"]])
    meters = sum(graph[u][v][k]["length_m"] for u, v, k in keys)
    return {
        "hospital": hospital["name"],
        "hospital_lat": hospital["lat"],
        "hospital_lon": hospital["lon"],
        "coords": coords,
        "minutes": round(seconds / 60.0, 1),
        "km": round(meters / 1000.0, 1),
    }, keys


def find_routes(
    graph: Any,
    flagged: Set[EdgeKey],
    origin_lat: float,
    origin_lon: float,
    hospitals: Iterable[Dict[str, Any]],
    bbox: Dict[str, float],
    max_snap_m: float,
    node_ids: Optional[np.ndarray] = None,
) -> Dict[str, Any]:
    """Find the normal and flood-safe routes from a patient location to the nearest hospital.

    Returns:
      status: 'ok' | 'cut_off' | 'no_change' | 'outside_area',
      normal: {hospital, hospital_lat, hospital_lon, coords: [[lat, lon], ...], minutes, km} | None,
      safe:   same shape | None (None when cut_off),
      added_minutes: float | None,
      blocked_on_normal: [{name, score}],
      nearest_hospital_straight_line: {name, distance_km} (cut_off only),
      note: str
    """
    hospitals = list(hospitals)
    outside = {
        "status": "outside_area", "normal": None, "safe": None, "added_minutes": None,
        "blocked_on_normal": [], "note": "Tap inside the highlighted study area (Colaba to Andheri / Kurla).",
    }
    if not (bbox["south"] <= origin_lat <= bbox["north"] and bbox["west"] <= origin_lon <= bbox["east"]):
        return outside

    if node_ids is None:
        node_ids = np.array(routable_nodes(graph))
    node_lat = np.array([graph.nodes[n]["y"] for n in node_ids])
    node_lon = np.array([graph.nodes[n]["x"] for n in node_ids])
    d = haversine_m(origin_lat, origin_lon, node_lat, node_lon)
    i = int(np.argmin(d))
    if d[i] > max_snap_m:
        return outside
    source = node_ids[i]
    origin = (origin_lat, origin_lon)

    hospital_by_node = {h["node"]: h for h in hospitals}

    normal = _nearest_hospital_path(graph, source, hospital_by_node, set())
    if normal is None:
        return outside
    normal_leg, normal_keys = _leg(graph, normal[1], normal[2], normal[0], origin, set())

    blocked: Dict[str, Dict[str, Any]] = {}
    for key in normal_keys:
        if key in flagged:
            data = graph[key[0]][key[1]][key[2]]
            name = _road_name(data)
            score = float(data.get("flood_score", 0.0))
            if name not in blocked or score > blocked[name]["score"]:
                pts = _edge_coords(graph, *key)
                mid = pts[len(pts) // 2]
                blocked[name] = {"name": name, "score": round(score, 2), "lat": mid[0], "lon": mid[1]}
    blocked_list = sorted(blocked.values(), key=lambda b: -b["score"])[:5]

    safe = _nearest_hospital_path(graph, source, hospital_by_node, flagged)
    if safe is None:
        dists = [(float(haversine_m(origin_lat, origin_lon, h["lat"], h["lon"])), h) for h in hospitals]
        meters, nearest = min(dists, key=lambda x: x[0])
        return {
            "status": "cut_off",
            "normal": normal_leg,
            "safe": None,
            "added_minutes": None,
            "blocked_on_normal": blocked_list,
            "nearest_hospital_straight_line": {"name": nearest["name"], "distance_km": round(meters / 1000.0, 1)},
            "note": "No flood-safe route on the main road network: every main road out of this area is likely to flood in this scenario.",
        }
    safe_leg, _ = _leg(graph, safe[1], safe[2], safe[0], origin, flagged)

    if not blocked_list:
        return {
            "status": "no_change",
            "normal": normal_leg,
            "safe": normal_leg,
            "added_minutes": 0.0,
            "blocked_on_normal": [],
            "note": f"Normal route is not affected. Go to {normal_leg['hospital']}.",
        }

    added = round(safe_leg["minutes"] - normal_leg["minutes"], 1)
    avoid = ", ".join(b["name"] for b in blocked_list[:2])
    return {
        "status": "ok",
        "normal": normal_leg,
        "safe": safe_leg,
        "added_minutes": added,
        "blocked_on_normal": blocked_list,
        "note": f"Go to {safe_leg['hospital']}; avoid {avoid}.",
    }
