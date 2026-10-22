from pathlib import Path
from typing import Any, Dict
import yaml

def get_project_root() -> Path:
    """Return the absolute path to the project root directory."""
    return Path(__file__).resolve().parent.parent

def load_config(config_path: Path | str | None = None) -> Dict[str, Any]:
    """Load configuration from config.yaml."""
    if config_path is None:
        config_path = get_project_root() / "config.yaml"
    else:
        config_path = Path(config_path)
    
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    return cfg
