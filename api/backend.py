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

class RealBackend:
    """RealBackend connects to data/processed/ pipeline outputs."""
    def __init__(self):
        # As specified in Prompt B, RealBackend is stubbed during UI development
        pass

    def meta(self) -> Dict[str, Any]:
        raise NotImplementedError("filled in by the data session")

    def scenarios(self) -> Dict[str, Any]:
        raise NotImplementedError("filled in by the data session")

    def flagged_geojson(self, scenario_id: str, share_override: Optional[float] = None) -> Dict[str, Any]:
        raise NotImplementedError("filled in by the data session")

    def hospitals(self) -> List[Dict[str, Any]]:
        raise NotImplementedError("filled in by the data session")

    def route(self, lat: float, lon: float, scenario_id: str, share_override: Optional[float] = None) -> Dict[str, Any]:
        raise NotImplementedError("filled in by the data session")

    def validation(self) -> Dict[str, Any]:
        raise NotImplementedError("filled in by the data session")

    def eda(self) -> Dict[str, Any]:
        raise NotImplementedError("filled in by the data session")

    def city_view(self, scenario_id: str, fix_top_n: int = 0) -> Dict[str, Any]:
        raise NotImplementedError("filled in by the data session")

_backend_instance: Optional[Backend] = None

def get_backend() -> Backend:
    """Retrieve backend singleton based on FLOODROUTE_BACKEND env var (default: 'fixture')."""
    global _backend_instance
    if _backend_instance is None:
        mode = os.getenv("FLOODROUTE_BACKEND", "fixture").strip().lower()
        if mode == "real":
            _backend_instance = RealBackend()
        else:
            _backend_instance = FixtureBackend()
    return _backend_instance
