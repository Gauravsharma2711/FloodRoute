# SETUP — Windows step by step (also works on macOS/Linux with small changes)

Project folder: `D:\Project\random project dumps\FloodRoute`

## 1. Install once

1. **Python 3.11** (64-bit) from https://www.python.org/downloads/ — tick "Add python.exe to PATH". (3.12 usually works too; if a package fails to install, use 3.11.)
2. **Git** from https://git-scm.com/downloads
3. **VS Code** (optional) from https://code.visualstudio.com/
4. **Claude Code** (you said you will code with it) — install and sign in following the current official instructions; open it in the project folder. If unsure how, ask the planning chat.
5. A **GitHub** account (needed for free deployment).
6. **Node.js 20 LTS** from https://nodejs.org/ (for the Next.js UI in `web/`; check with `node -v`).

## 2. Create the environment (PowerShell)

```powershell
cd "D:\Project\random project dumps\FloodRoute"
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1          # if blocked:  Set-ExecutionPolicy -Scope Process Bypass
python -m pip install --upgrade pip
pip install -r requirements-pipeline.txt
```

If `geopandas` / `rasterio` / `osmnx` fail to install with pip: install Miniforge (https://github.com/conda-forge/miniforge), then
`conda create -n floodroute python=3.11 -c conda-forge geopandas rasterio osmnx networkx scipy pyarrow pyyaml` and `conda activate floodroute`; then `pip install fastapi "uvicorn[standard]"`.

## 3. Quick reachability test (2 minutes)

```powershell
python -c "import requests; print(requests.get('https://archive-api.open-meteo.com/v1/archive?latitude=19.076&longitude=72.8777&start_date=2024-07-01&end_date=2024-07-03&daily=precipitation_sum&timezone=Asia%2FKolkata', timeout=30).json())"
python -c "import requests; r=requests.head('https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N19_00_E072_00_DEM/Copernicus_DSM_COG_10_N19_00_E072_00_DEM.tif', timeout=30); print(r.status_code, r.headers.get('Content-Length'))"
```

Expected: a JSON with daily rainfall; status 200 with a file size. If the second is not 200, tell Claude Code — the URL pattern in docs/DATA_SOURCES.md needs correcting (or use the fallback).

## 4. Build the data and run the app

```powershell
python pipeline/run_all.py                    # builds data/processed/ (first run takes a while; downloads are cached)
uvicorn api.main:app --reload --port 8000     # API on http://localhost:8000
```

In a second terminal, the UI:

```powershell
cd web
npm install
npm run dev                                   # opens http://localhost:3000 and calls the API on :8000
```

UI work before data is ready (API on the synthetic fixture):

```powershell
$env:FLOODROUTE_BACKEND = "fixture"
uvicorn api.main:app --reload --port 8000
```

## 5. Deploy free (one service: FastAPI serving the built Next.js UI)

Build the UI once (`cd web && npm run build` produces `web/out/`); FastAPI serves it next to `/api/*`, so there is a single URL and no CORS. Use a free host that runs a Docker image or a Python web service (Render, Hugging Face Spaces, Railway). A `Dockerfile` (Python 3.11 slim, install `requirements.txt`, copy `api/`, `floodroute/`, `data/processed/`, `web/out/`, run `uvicorn api.main:app --host 0.0.0.0 --port $PORT`) is created in the deploy phase. The steps below for GitHub still apply.

1. Create a GitHub repo (public is simplest) and push the project:
   ```powershell
   git init
   git add .
   git commit -m "FloodRoute v1"
   git branch -M main
   git remote add origin https://github.com/<you>/floodroute.git
   git push -u origin main
   ```
   Check `data/processed/` is committed and no single file is over 100 MB (GitHub limit; keep under 50 MB).
2. On the chosen host, create a new web service from the GitHub repo (Docker). No secrets are required. Set the health check path to `/api/health`.
3. Make sure `web/out/` is built and included (either commit it or build it in the Dockerfile with a Node stage).
4. Open the URL in a private window on desktop and on a phone and run the demo path. Copy the URL into the README and the submission.

Note: free apps sleep when idle; open the URL a few minutes before judging.

## 6. Before submitting

- [ ] Fresh clone in a new folder → new venv → `pip install -r requirements.txt` → `cd web && npm install && npm run build` → `uvicorn api.main:app` works with no internet except optional forecast and map tiles
- [ ] `pip freeze > requirements.lock.txt` saved (pins versions that worked)
- [ ] No keys or `.env` committed (`git grep -i "api_key"` returns nothing)
- [ ] README links and attribution checked; backup recording in `assets/`
