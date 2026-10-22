"""FastAPI HTTP service for FloodRoute."""
import os
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.backend import get_backend

app = FastAPI(
    title="FloodRoute API",
    description="Ambulance navigation and flood-prone road proxy API for Mumbai",
    version="1.0.0"
)

# CORS configuration for local Next.js development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"ok": True}

@app.get("/api/meta")
def get_meta():
    backend = get_backend()
    return backend.meta()

@app.get("/api/scenarios")
def get_scenarios():
    backend = get_backend()
    return backend.scenarios()

@app.get("/api/flagged")
def get_flagged(
    scenario_id: str = Query(..., description="ID of scenario"),
    share: Optional[float] = Query(None, description="Optional override of flag share (0.0 to 1.0)")
):
    backend = get_backend()
    return backend.flagged_geojson(scenario_id=scenario_id, share_override=share)

@app.get("/api/hospitals")
def get_hospitals():
    backend = get_backend()
    return backend.hospitals()

@app.get("/api/route")
def get_route(
    lat: float = Query(..., description="Patient latitude"),
    lon: float = Query(..., description="Patient longitude"),
    scenario_id: str = Query(..., description="ID of scenario"),
    share: Optional[float] = Query(None, description="Optional override of flag share")
):
    backend = get_backend()
    return backend.route(lat=lat, lon=lon, scenario_id=scenario_id, share_override=share)

@app.get("/api/validation")
def get_validation():
    backend = get_backend()
    return backend.validation()

@app.get("/api/eda")
def get_eda():
    backend = get_backend()
    return backend.eda()

@app.get("/api/city_view")
def get_city_view(
    scenario_id: str = Query(..., description="ID of scenario"),
    fix_top_n: int = Query(0, description="Top N roads to prioritize for mitigation")
):
    backend = get_backend()
    return backend.city_view(scenario_id=scenario_id, fix_top_n=fix_top_n)

# Serve EDA charts if static directory exists
eda_dir = Path(__file__).resolve().parent.parent / "data" / "processed" / "eda"
if eda_dir.exists():
    app.mount("/static/eda", StaticFiles(directory=str(eda_dir)), name="eda")

# Serve exported Next.js static build if present
web_out_dir = Path(__file__).resolve().parent.parent / "web" / "out"
if web_out_dir.exists():
    app.mount("/", StaticFiles(directory=str(web_out_dir), html=True), name="static_web")
