"""I/O utilities for graph serialization and datasets."""
from pathlib import Path
import pickle
from typing import Any

def save_graph(graph: Any, path: Path | str) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as f:
        pickle.dump(graph, f, protocol=pickle.HIGHEST_PROTOCOL)

def load_graph(path: Path | str) -> Any:
    path = Path(path)
    with open(path, "rb") as f:
        return pickle.load(f)
