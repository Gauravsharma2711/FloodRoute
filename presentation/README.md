# FloodRoute — final presentation

**Format:** 10 minutes of presentation (about 4 of them live demo) plus 5 minutes of Q&A. Slides are minimal on purpose: they set up what the judges are about to see, and the app does the rest.

## Open the deck

- Double-click `presentation/index.html`. It opens in Chrome or Edge. It's one file with the screenshots built in, so it works offline.
- Move between slides with **← →** (or Page Up / Page Down) or the **◀ ▶** buttons under the slide. Clicking on the slide does nothing.
- **F** or the **⛶** button switches to full screen.
- For a PDF: Chrome → Print → Save as PDF, landscape, margins none, background graphics on. You get one slide per page.

## Flow (10 slides, about 10 minutes)

| # | Slide | Time | Purpose |
|---|---|---|---|
| 1 | Title | 0:20 | The question: which hospital, which road, when it pours |
| 2 | The problem | 0:50 | Who decides, what goes wrong today, why it's predictable (110 heavy days, 96% in June–September) |
| 3 | What FloodRoute does | 0:40 | The 4 steps the judges will see in the demo |
| 4 | Where the data comes from | 0:40 | 5 public sources, what we take and what we built |
| 5 | How it decides | 0:50 | Score → rain category → two routes → decision; why not ML |
| 6 | Why it's different | 0:40 | vs Google Maps: the decision is the hospital (BKC example) |
| 7 | Send to driver | 0:30 | The WhatsApp message and the driver's phone view |
| 8 | **Live demo** | 3:30–4:00 | Switch to the app (steps listed on the slide) |
| 9 | Who it helps · roadmap | 0:30 | Users and next steps |
| 10 | Thank you | 0:10 | One-line close, then Q&A |

## Live demo (slide 8)

Before the talk:
1. Start the app: two terminals, see the root README "Run it locally".
2. Open `http://localhost:3000` in a second browser tab, already loaded.
3. Pick the **17 May 2021 (very heavy)** day.

During the demo:

1. **Rain day:** point at the red roads, "likely to flood on a day like this".
2. **BKC (Bandra Kurla Complex)** preset. The normal route goes to Bhabha Hospital and crosses roads likely to flood. The flood-safe route goes to **Shatabdi Hospital, +8 min**. Read the decision card.
3. **Tap a red road** to show why it's marked.
4. **Send to driver → WhatsApp** to show the message. Open the "Route map" link to show the driver's phone view, then **Start navigation** to show Google Maps.
5. **How reliable is this?** (header icon) to show the check against reported flood spots.
6. Back to the slides, slide 9.

**Backup example:** **Marol (Andheri East)**. The normal route to SevenHills uses the Marol Maroshi Road underpass; the flood-safe route goes to Hiranandani, about +6 min.

**On a phone:** open the dashboard at `http://<laptop-ip>:3000` (same Wi-Fi). The driver link then opens on the phone.

## Where every number on the slides comes from

| Number | Source |
|---|---|
| 110 heavy-rain days · 96% in June–September · 7,670 days | Open-Meteo daily rainfall 2005–2025, central Mumbai (`data/raw/rain_archive.csv`, `pipeline/06_precompute.py`) |
| 336 chronic waterlogging spots | BMC figure reported by The Indian Express (via Praja, 2023) |
| 9,746 road segments · 1,552 km · 470 bridges | `data/processed/edges_scored.parquet` (OpenStreetMap + Copernicus) |
| 611 hospital features → 35 major destinations | `pipeline/01b_build_hospitals.py`, names in `config.yaml` |
| 8% / 15% / 25% of roads per rain category | `config.yaml` `flag_share_by_category` |
| 14 reported spots | `data/validation/flood_spots.csv` |
| BKC: Bhabha → Shatabdi, +8.0 min · 10 min · 7.9 km | Live output of the app (`/api/route`), very heavy day 17 May 2021 |

## Updating the screenshots

With the app running locally:

```powershell
cd web
node scripts/capture-screens.mjs     # saves real app screenshots to presentation/screens/
cd ..
python presentation/build_deck.py    # rebuilds presentation/index.html from deck_template.html
```

Edit the slide text in `deck_template.html`, never in `index.html`, because the build script overwrites `index.html`.

## Speaker transcript and Q&A

- [SCRIPT.md](SCRIPT.md): what to say on every slide, with demo actions and timing
- [QA.md](QA.md): likely judge questions with short answers
- [TEAM_CHECKLIST.md](TEAM_CHECKLIST.md): day-of checklist
