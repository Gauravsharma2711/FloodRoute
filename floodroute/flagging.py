"""Edge flagging logic for flood-prone road segments (the single definition used everywhere)."""
from typing import Any, List, Set, Tuple

EdgeKey = Tuple[Any, Any, Any]


def is_flagged(data: dict, flag_share: float) -> bool:
    """An edge is flagged when flood_rank_pct >= 1 - flag_share; bridges/flyovers never are."""
    if data.get("is_bridge", False):
        return False
    return float(data.get("flood_rank_pct", 0.0)) >= 1.0 - flag_share


def flagged_edges(graph: Any, flag_share: float) -> List[Any]:
    """Flag edges whose flood_rank_pct >= 1 - flag_share, excluding bridges.

    Formula:
    flagged_edges(graph, flag_share) = edges whose flood_rank_pct >= 1 - flag_share, excluding bridges
    """
    return [(u, v, k, d) for u, v, k, d in graph.edges(keys=True, data=True) if is_flagged(d, flag_share)]


def flagged_edge_keys(graph: Any, flag_share: float) -> Set[EdgeKey]:
    """Same rule as flagged_edges, returned as a set of (u, v, key) for fast lookup during routing."""
    return {(u, v, k) for u, v, k, d in graph.edges(keys=True, data=True) if is_flagged(d, flag_share)}
