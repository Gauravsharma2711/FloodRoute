"""FastAPI HTTP service for FloodRoute."""
import os
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from api.backend import get_backend

app = FastAPI(
    title="FloodRoute API",
    description="Ambulance navigation and flood-prone road proxy API for Mumbai",
    version="1.0.0"
)

# 1. Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(), camera=()"
        # CSP compatible with Next.js, MapLibre GL, CARTO vector tiles & Google Fonts
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: blob: https://*.cartocdn.com https://basemaps.cartocdn.com; "
            "connect-src 'self' https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://api.open-meteo.com https://archive-api.open-meteo.com; "
            "worker-src 'self' blob:; "
            "frame-ancestors 'none';"
        )
        return response

app.add_middleware(SecurityHeadersMiddleware)

# 2. Strict CORS Configuration (no wildcard origins with credentials)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    allowed_origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
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
    scenario_id: str = Query(..., min_length=1, max_length=64, description="ID of scenario"),
    share: Optional[float] = Query(None, ge=0.0, le=1.0, description="Optional override of flag share (0.0 to 1.0)")
):
    backend = get_backend()
    return backend.flagged_geojson(scenario_id=scenario_id, share_override=share)

@app.get("/api/hospitals")
def get_hospitals():
    backend = get_backend()
    return backend.hospitals()

@app.get("/api/route")
def get_route(
    lat: float = Query(..., ge=18.5, le=19.5, description="Patient latitude in Mumbai region (18.5 to 19.5)"),
    lon: float = Query(..., ge=72.5, le=73.2, description="Patient longitude in Mumbai region (72.5 to 73.2)"),
    scenario_id: str = Query(..., min_length=1, max_length=64, description="ID of scenario"),
    share: Optional[float] = Query(None, ge=0.0, le=1.0, description="Optional override of flag share (0.0 to 1.0)")
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
    scenario_id: str = Query(..., min_length=1, max_length=64, description="ID of scenario"),
    fix_top_n: int = Query(0, ge=0, le=500, description="Top N roads to prioritize for mitigation (0 to 500)")
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

