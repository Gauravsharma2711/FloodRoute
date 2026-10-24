"""Build data/processed/hospitals.json from OpenStreetMap hospitals in the study bbox.

Rule (transparent, stated in the UI and docs): every OSM feature tagged amenity=hospital,
healthcare=hospital or building=hospital with a name, except those explicitly tagged emergency=no. Of these, the ones whose
exact name is in config.yaml hospitals.destination_names (a team-curated ASSUMPTION: major
general hospitals) are "ambulance destinations" used for routing. Each hospital is snapped to the
nearest node of the largest strongly connected part of the road graph, so a route can
always reach it. Some OSM "hospitals" are small clinics; only some carry emergency=yes.
"""
import json
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import numpy as np
import requests

from floodroute.config import get_project_root, load_config
from floodroute.io import load_graph
from floodroute.routing import routable_nodes, haversine_m


def fetch_osm_hospitals(cache: Path, bbox: dict) -> list[dict]:
    """Raw Overpass elements tagged amenity=hospital, or named healthcare=hospital / building=hospital
    (some major hospitals, e.g. KEM and Cooper, are mapped only that way). Cached on disk."""
    if not cache.exists():
        s, w, n, e = bbox["south"], bbox["west"], bbox["north"], bbox["east"]
        query = f"""[out:json][timeout:60];
(nwr["amenity"="hospital"]({s},{w},{n},{e});
 nwr["healthcare"="hospital"]["name"]({s},{w},{n},{e});
 nwr["building"="hospital"]["name"]({s},{w},{n},{e}););
out center tags;"""
        resp = requests.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": query},
            timeout=120,
            headers={"User-Agent": "FloodRoute-hackathon/1.0"},
        )
        resp.raise_for_status()
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(resp.text, encoding="utf-8")
    return json.loads(cache.read_text(encoding="utf-8"))["elements"]


def main() -> None:
    root = get_project_root()
    cfg = load_config()
    elements = fetch_osm_hospitals(root / "data" / "raw" / "hospitals_osm_v2.json", cfg["bbox"])

    G = load_graph(root / "data" / "processed" / "graph.pkl")
    node_ids = np.array(routable_nodes(G))
    node_lat = np.array([G.nodes[n]["y"] for n in node_ids])
    node_lon = np.array([G.nodes[n]["x"] for n in node_ids])

    destination_names = set(cfg["hospitals"]["destination_names"])
    hospitals: list[dict] = []
    seen: set[tuple[str, int]] = set()
    dropped_unnamed = dropped_no_emergency = 0
    for el in elements:
        tags = el.get("tags", {})
        name = (tags.get("name") or "").strip()
        if not name:
            dropped_unnamed += 1
            continue
        if tags.get("emergency") == "no":
            dropped_no_emergency += 1
            continue
        lat = el.get("lat", el.get("center", {}).get("lat"))
        lon = el.get("lon", el.get("center", {}).get("lon"))
        if lat is None or lon is None:
            continue
        dists = haversine_m(lat, lon, node_lat, node_lon)
        i = int(np.argmin(dists))
        node = int(node_ids[i])
        if (name, node) in seen:  # same hospital mapped as node + building
            continue
        seen.add((name, node))
        emergency = tags.get("emergency")
        hospitals.append({
            "id": f"osm-{el['type']}-{el['id']}",
            "name": name,
            "lat": round(float(lat), 6),
            "lon": round(float(lon), 6),
            "node": node,
            "snap_m": round(float(dists[i]), 1),
            "emergency": True if emergency == "yes" else None,
            "ambulance_destination": name in destination_names,
        })

    out = root / "data" / "processed" / "hospitals.json"
    out.write_text(json.dumps(hospitals, ensure_ascii=False, indent=1), encoding="utf-8")
    snaps = np.array([h["snap_m"] for h in hospitals])
    print(f"OSM hospital features: {len(elements)} | kept: {len(hospitals)} | "
          f"dropped unnamed: {dropped_unnamed} | dropped emergency=no: {dropped_no_emergency}")
    found = {h["name"] for h in hospitals if h["ambulance_destination"]}
    missing = sorted(destination_names - found)
    if missing:
        print(f"WARNING: destination names not found in OSM data: {missing}")
    print(f"ambulance destinations (used for routing): {sum(h['ambulance_destination'] for h in hospitals)}")
    print(f"tagged emergency=yes: {sum(h['emergency'] is True for h in hospitals)}")
    print(f"snap distance to road (m): min {snaps.min():.0f} median {np.median(snaps):.0f} max {snaps.max():.0f}")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
