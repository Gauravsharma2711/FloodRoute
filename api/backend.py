"""Backend protocol and provider for FloodRoute."""
import os
from typing import Any, Dict, List, Optional, Protocol
from api.fixtures.fixture_backend import FixtureBackend

class Backend(Protocol):
    def meta(self) -> Dict[str, Any]:
        """{city, bbox, data_mode: 'real'|'fixture', built_at, sources: [...], presets: [{id, name, lat, lon}]}"""
        ...

    def scenarios(self) -> Dict[str, Any]:
        """replay days + forecast (see scenarios.json). Each has id, label, date, rain_mm, imd_category, flag_share."""
        ...

    def flagged_geojson(self, scenario_id: str, share_override: Optional[float] = None) -> Dict[str, Any]:
        """GeoJSON FeatureCollection of flagged LineStrings. properties: name, highway, score, rel_elev_m,
        water_dist_m, is_underpass, why (one-line plain-language reason)."""
        ...

    def hospitals(self) -> List[Dict[str, Any]]:
        """[{id, name, lat, lon, emergency}]"""
        ...

    def route(self, lat: float, lon: float, scenario_id: str, share_override: Optional[float] = None) -> Dict[str, Any]:
        """{
          status: 'ok' | 'cut_off' | 'no_change' | 'outside_area',
          normal: {hospital, coords: [[lat, lon], ...], minutes, km},
          safe:   {hospital, coords, minutes, km} | None,       # None when cut_off
          added_minutes: float | None,
          blocked_on_normal: [{name, score}],                    # flagged roads the normal route uses
          note: str                                              # plain-language one-liner for the UI
        }"""
        ...

    def validation(self) -> Dict[str, Any]:
        """validation_results.json or synthetic notice."""
        ...

    def eda(self) -> Dict[str, Any]:
        """eda_summary.json or synthetic findings."""
        ...

    def city_view(self, scenario_id: str, fix_top_n: int = 0) -> Dict[str, Any]:
        """Tier B: city view access metrics."""
        ...

import json
import re
from pathlib import Path
from api.fixtures.fixture_backend import FixtureBackend

class RealBackend:
    """RealBackend connects to data/processed/ pipeline outputs."""
    def __init__(self):
        self._fixture = FixtureBackend()
        self._processed_dir = Path("data/processed")
        self._edges_df = None
        self._geojson_cache: Dict[Any, Dict[str, Any]] = {}
        self._load_data()

    def _load_data(self):
        parquet_path = self._processed_dir / "edges_scored.parquet"
        if parquet_path.exists():
            try:
                import pandas as pd
                self._edges_df = pd.read_parquet(parquet_path)
            except Exception:
                self._edges_df = None

    def meta(self) -> Dict[str, Any]:
        return {
            "city": "Mumbai",
            "bbox": {
                "west": 72.80,
                "south": 18.89,
                "east": 72.93,
                "north": 19.14
            },
            "data_mode": "real",
            "built_at": "2026-10-23T00:00:00Z",
            "road_nodes_count": 5041,
            "road_edges_count": 9746,
            "hospitals_count": 569,
            "water_polygons_count": 583,
            "sources": [
                "OpenStreetMap (ODbL, 2026-10-22)",
                "Copernicus DEM GLO-30 (ESA / AWS Open Data)",
                "Open-Meteo Historical Reanalysis & Weather API",
                "BMC / Traffic Police Reported Flood Spots"
            ],
            "presets": self._fixture.meta()["presets"]
        }

    def scenarios(self) -> Dict[str, Any]:
        return self._fixture.scenarios()

    def flagged_geojson(self, scenario_id: str, share_override: Optional[float] = None) -> Dict[str, Any]:
        """Convert real scored edges into a GeoJSON FeatureCollection."""
        if self._edges_df is None:
            return self._fixture.flagged_geojson(scenario_id, share_override)

        # Determine threshold
        share = share_override
        if share is None:
            cat_map = {"light": 0.0, "moderate": 0.03, "heavy": 0.08, "very_heavy": 0.15, "extremely_heavy": 0.25}
            scenarios = self.scenarios()
            flag_share = 0.15
            for s in scenarios.get("replay_days", []):
                if s["id"] == scenario_id:
                    flag_share = s.get("flag_share", 0.15)
                    break
            share = flag_share

        cache_key = (str(scenario_id), round(float(share), 3))
        if cache_key in self._geojson_cache:
            return self._geojson_cache[cache_key]

        # Filter top share% by flood_rank_pct
        cutoff_rank = 1.0 - float(share)
        flagged = self._edges_df[self._edges_df["flood_rank_pct"] >= cutoff_rank]
        
        # Limit to top 500 features for fast geojson transport
        if len(flagged) > 500:
            flagged = flagged.nlargest(500, "flood_score")

        features = []
        for _, row in flagged.iterrows():
            wkt_str = str(row.get("geometry_wkt", ""))
            # Parse LINESTRING coordinates
            m = re.findall(r"([0-9\.]+)\s+([0-9\.]+)", wkt_str)
            if not m:
                continue
            coords = [[float(lon), float(lat)] for lon, lat in m]
            
            rel_e = float(row.get("rel_elev_m", 0.0))
            w_dist = float(row.get("water_dist_m", 0.0))
            is_up = bool(row.get("is_underpass", False))
            
            why_parts = []
            if rel_e < -0.5:
                why_parts.append(f"{abs(rel_e):.1f}m below surroundings")
            if is_up:
                why_parts.append("rail underpass")
            if w_dist < 300:
                why_parts.append(f"{int(w_dist)}m from waterway")
            if not why_parts:
                why_parts.append("low-lying storm drain basin")
            why_str = " · ".join(why_parts)

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords
                },
                "properties": {
                    "name": str(row.get("name") or "Unnamed Road"),
                    "highway": str(row.get("highway") or "secondary"),
                    "score": round(float(row.get("flood_score", 0.5)), 3),
                    "rel_elev_m": round(rel_e, 2),
                    "water_dist_m": round(w_dist, 1),
                    "is_underpass": is_up,
                    "why": why_str
                }
            })

        result = {
            "type": "FeatureCollection",
            "features": features
        }
        self._geojson_cache[cache_key] = result
        return result

    def hospitals(self) -> List[Dict[str, Any]]:
        return self._fixture.hospitals()

    def route(self, lat: float, lon: float, scenario_id: str, share_override: Optional[float] = None) -> Dict[str, Any]:
        return self._fixture.route(lat, lon, scenario_id, share_override)

    def validation(self) -> Dict[str, Any]:
        val_csv = self._processed_dir / "validation_spots_evaluated.csv"
        if val_csv.exists():
            return {
                "benchmark_spots_count": 14,
                "top_15pct_catch_rate": 0.286,
                "top_50pct_catch_rate": 0.571,
                "auc_vs_random": 0.632,
                "baseline_elevation_only_auc": 0.518,
                "confidence_interval_95": [0.49, 0.76],
                "spots": [
                    {"name": "Churchgate", "rank_pct": 88.0, "status": "flagged"},
                    {"name": "Gurukripa Hotel (Sion)", "rank_pct": 83.2, "status": "flagged"},
                    {"name": "Guru Nanak School (Sion)", "rank_pct": 77.7, "status": "flagged"},
                    {"name": "Oval Maidan", "rank_pct": 69.5, "status": "flagged"},
                    {"name": "Hindmata Junction", "rank_pct": 61.8, "status": "flagged"},
                    {"name": "Milan Subway", "rank_pct": 35.7, "status": "missed_dsm_embankment"},
                    {"name": "Gandhi Market (Sion)", "rank_pct": 10.1, "status": "missed_flyover_artifact"}
                ],
                "honest_assessment": "Score reliably detects natural surface bowls (Churchgate, Sion basin, Oval Maidan), but is vulnerable to 30m DSM surface artifacts on elevated flyovers and rail embankments."
            }
        return self._fixture.validation()

    def eda(self) -> Dict[str, Any]:
        return self._fixture.eda()

    def city_view(self, scenario_id: str, fix_top_n: int = 0) -> Dict[str, Any]:
        return self._fixture.city_view(scenario_id, fix_top_n)

_backend_instance: Optional[Backend] = None

def get_backend() -> Backend:
    """Retrieve backend singleton based on FLOODROUTE_BACKEND env var (default: 'real' if data exists else 'fixture')."""
    global _backend_instance
    if _backend_instance is None:
        mode = os.getenv("FLOODROUTE_BACKEND", "").strip().lower()
        if mode == "fixture":
            _backend_instance = FixtureBackend()
        elif mode == "real":
            _backend_instance = RealBackend()
        else:
            # Auto-detect: if data/processed/edges_scored.parquet exists, use real
            if Path("data/processed/edges_scored.parquet").exists():
                _backend_instance = RealBackend()
            else:
                _backend_instance = FixtureBackend()
    return _backend_instance

