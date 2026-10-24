# FloodRoute — day-of checklist

## Bring
- [ ] Laptop (charged) with the repo and both servers able to start
- [ ] Charger and phone hotspot (backup internet for the map tiles)
- [ ] College ID and Aadhaar; formal dress

## 30 minutes before
- [ ] Terminal 1: `python -m uvicorn api.main:app --host 0.0.0.0 --port 8000`
- [ ] Terminal 2: `cd web` then `npm run dev -- --hostname 0.0.0.0`
- [ ] Open `http://localhost:3000`, pick **17 May 2021 (very heavy)**, click **BKC**, and check that the route appears
- [ ] Open `presentation/index.html` (**not** `deck_template.html`), press F for full screen, go to slide 1
- [ ] Optional phone demo: open the dashboard at `http://<laptop-ip>:3000` (`ipconfig` shows the IP)

## During the talk
- Follow `SCRIPT.md` (about 9–10 minutes; the demo is slide 8)
- Move slides with → or the ▶ button

## Q&A
- Short answers in `QA.md`: one or two sentences, then stop

## Your own backup recording
- [ ] Screen-record the demo path once: rain day → BKC → red road → WhatsApp → driver view → How reliable is this?
