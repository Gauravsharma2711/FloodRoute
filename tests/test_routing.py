"""Smoke test: routing on a toy graph (normal route, detour when a road is flagged, cut off)."""
import networkx as nx

from floodroute.flagging import flagged_edge_keys
from floodroute.routing import find_routes

BBOX = {"west": 72.0, "south": 18.0, "east": 74.0, "north": 20.0}


def toy_graph() -> nx.MultiDiGraph:
    # patient 1 -> 2 -> 4 (hospital) is fast; 1 -> 3 -> 4 is a slower detour
    G = nx.MultiDiGraph()
    coords = {1: (19.000, 72.800), 2: (19.000, 72.810), 3: (19.010, 72.805), 4: (19.000, 72.820)}
    for n, (lat, lon) in coords.items():
        G.add_node(n, y=lat, x=lon)
    edges = [(1, 2, 60, 0.95), (2, 4, 60, 0.10), (1, 3, 120, 0.10), (3, 4, 120, 0.10)]
    for u, v, t, rank in edges:
        for a, b in ((u, v), (v, u)):
            G.add_edge(a, b, travel_time_s=t, length_m=t * 10, flood_rank_pct=rank, flood_score=rank,
                       is_bridge=False, name=f"road {u}-{v}")
    return G


HOSPITAL = [{"name": "Toy Hospital", "lat": 19.000, "lon": 72.820, "node": 4}]


def test_route_exists_and_detours_around_flagged_road():
    G = toy_graph()
    flagged = flagged_edge_keys(G, 0.10)  # only road 1-2 (rank 0.95) is flagged
    r = find_routes(G, flagged, 19.0, 72.8, HOSPITAL, BBOX, max_snap_m=500)
    assert r["status"] == "ok"
    assert r["normal"]["minutes"] == 2.0 and r["safe"]["minutes"] == 4.0
    assert r["added_minutes"] == 2.0
    assert r["blocked_on_normal"][0]["name"] == "road 1-2"


def test_cut_off_and_outside_area():
    G = toy_graph()
    everything = flagged_edge_keys(G, 1.0)
    assert find_routes(G, everything, 19.0, 72.8, HOSPITAL, BBOX, 500)["status"] == "cut_off"
    assert find_routes(G, set(), 25.0, 72.8, HOSPITAL, BBOX, 500)["status"] == "outside_area"
