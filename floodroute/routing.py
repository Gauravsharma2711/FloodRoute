"""Routing logic for finding normal and flood-safe routes."""
from typing import Any, Dict, List, Optional

def find_routes(
    graph: Any,
    flagged_graph: Any,
    origin_lat: float,
    origin_lon: float,
    hospitals: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Find normal and flood-safe routes to nearest hospital.
    
    Returns:
      status: 'ok' | 'cut_off' | 'no_change' | 'outside_area',
      normal: {hospital, coords: [[lat, lon], ...], minutes, km},
      safe:   {hospital, coords, minutes, km} | None,
      added_minutes: float | None,
      blocked_on_normal: [{name, score}],
      note: str
    """
    pass
