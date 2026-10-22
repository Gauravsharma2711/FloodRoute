"""Edge flagging logic for flood-prone road segments."""
from typing import Any, List

def flagged_edges(graph: Any, flag_share: float) -> List[Any]:
    """Flag edges whose flood_rank_pct >= 1 - flag_share, excluding bridges.
    
    Formula:
    flagged_edges(graph, flag_share) = edges whose flood_rank_pct >= 1 - flag_share, excluding bridges
    """
    flagged = []
    threshold = 1.0 - flag_share
    for u, v, k, data in graph.edges(keys=True, data=True):
        if data.get("is_bridge", False):
            continue
        rank_pct = data.get("flood_rank_pct", 0.0)
        if rank_pct >= threshold:
            flagged.append((u, v, k, data))
    return flagged
