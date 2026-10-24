# FloodRoute — 10-minute speaker script (one speaker)

Open `presentation/index.html` in Chrome or Edge. Keys: **→ / Space** next, **←** back, **F** fullscreen, **N** speaker notes (the same text as below, shown at the bottom of the screen).

Total ≈ 9 min 40 s, leaving ~20 s of buffer. Then 5 min of Q&A (see `TEAM_CHECKLIST.md` → "Q&A prep").

> Speak slowly. The rule for every number: **if it is on a slide, we computed it from public data and can show the code.** Never add numbers that are not on the slides.

---

### Slide 1 — Title (0:00 – 0:20)
"Good afternoon. We are **[team name]**. Our question is simple: on a heavy-rain day in Mumbai, **which way should the ambulance go?** FloodRoute is our answer — a decision-support prototype built only on public data, with no paid APIs."

### Slide 2 — Problem (0:20 – 1:10)
"Mumbai floods in the same places year after year. In 2005 the Santacruz gauge reported around 944 millimetres in a day. BMC itself identified 336 chronic waterlogging spots, and the traffic police list more than 200 flood-prone locations.

Our users are the **ambulance dispatcher** and the **city's flood-control team**. Their decision: which route and which hospital on a heavy-rain day — and which roads to fix first.

Navigation apps react **after** a road is blocked. A dispatcher planning a trip needs to know **before**. And one number we computed ourselves: 96% of heavy-rain days since 2005 fall in June to September — so this is a predictable, seasonal problem worth planning for."

### Slide 3 — What FloodRoute does (1:10 – 1:50)
"The product is three steps. **One**, pick a rain day — a real past heavy day or tomorrow's forecast — and the most flood-prone roads light up. **Two**, set the patient on the map; we find the nearest of 35 major hospitals, taken from 576 in OpenStreetMap. **Three**, we draw two routes along real streets: the normal route, and a flood-safe route that avoids marked roads — with the extra minutes, a different hospital, or 'cut off'.

Every red road explains why it is marked, and the app shows how reliable the score is. And we are clear: it is a **planning tool, not a live flood detector**."

### Slide 4 — Data (1:50 – 2:30)
"Four public sources. OpenStreetMap: about 5,000 junctions and 9,746 road segments — 1,552 km of main roads — plus 576 named hospitals, of which we route to 35 major ones. Copernicus: a 30-metre elevation model; we never flag the 470 bridges and flyovers. Open-Meteo: 21 years of daily rain, 7,670 days, nothing missing. And 14 reported flood spots from BMC, flood gauges and news — used **only to test**, never to tune.

We are upfront about bias: reported spots favour busy, visible junctions, and the sample is small."

### Slide 5 — Architecture (2:30 – 3:00)
"Public data goes into a Python pipeline that scores every road and tests the score. A FastAPI service holds the road graph and finds routes. A Next.js app shows it on a desktop for dispatchers and on a phone for drivers.

The key design choice: **scoring, flagging and routing live in one shared library**, so what you see on the map is exactly what we evaluated. And no paid maps — our own OpenStreetMap road graph gives real street routes for free."

### Slide 6 — Method and reasoning (3:00 – 3:50)
"Why not machine learning? Because we have about **14 reliable labels, not 14,000**. A model trained on 14 points would just memorise them.

So we built a transparent score from four terrain signals: is the road lower than the area around it, is it low overall, is it near water, is it an underpass. The weights were **fixed before we looked at any result**.

Then a rain day must become blocked roads. Nobody publishes 'at 150 millimetres these roads flood', so this mapping is an **explicit assumption**: shown in the app, adjustable with 'What if', and varied in our sensitivity test. Routing is simple and checkable: the fastest path, then again with flagged roads removed."

### Slide 7 — EDA (3:50 – 4:40)
"Three findings changed how we read our own tool.

**One** — heavy rain is a monsoon problem: 110 heavy days in 21 years, 96% between June and September, peaking in July.

**Two** — weather grids miss the extremes. On 26 July 2005 the gauge reported around 944 mm; the reanalysis grid shows **70**. So we use rain only to **pick and label** real heavy days, never as a water depth.

**Three** — and this surprised us — reported flood spots are **not** nearer the sea and **not** lower overall. They are local bowls inland. Mumbai's waterlogging is a drainage story more than a coastline story."

### Slide 8 — Evaluation (4:40 – 5:40)
"This is the slide we are proudest of, because it is honest.

We tested the score on 13 reported flood spots. Overall it is **not better than random**: AUC 0.46, interval 0.32 to 0.61 because the sample is small — and elevation alone does no better.

But look at **where** it fails. It catches the real sunken bowls — Churchgate, the Sion flood gauges, Oval Maidan. It misses Milan Subway because the 30-metre surface model sees the **rail embankment above** the underpass, and Gandhi Market reads as higher ground — most likely flyovers and buildings in the surface model.

So the failure has a cause we can name, and a fix: bare-earth elevation and drainage data. **We did not re-tune the weights to make this number look better.**"

### Slide 9 — Live demo (5:40 – 8:20)
*[Switch to the browser with the app already open. Do not type URLs live.]*

1. "Here is a very heavy real rain day." → click the rain card. "The most flood-prone roads light up across the city."
2. "Why is this road red?" → click a red road. Read the reason out loud.
3. "A patient in BKC." → click the **BKC (Bandra Kurla Complex)** preset. "Dashed blue is the normal route to Bhabha Hospital in Kurla — it crosses Bandra Kurla Complex Road, likely to flood near the Mithi river. Teal is the flood-safe route, along real streets: it goes to **Shatabdi Hospital in Govandi** instead, about **8 minutes** longer." *(Read the numbers on screen; they are computed live.)*
   *(Backup example: **Marol (Andheri East)** — the normal route to SevenHills uses the Marol Maroshi Road underpass; the flood-safe route goes to Hiranandani, about 6 minutes longer. **Hindmata** now goes to KEM with a small detour.)*
4. "Now Colaba Causeway." → click the preset. "No flood-safe route on the main road network — that is when a dispatcher sends a different resource."
   *(Optional, if asked: Bandra West shows "normal route not affected".)*
5. "Now the dispatcher hands it over." → back to BKC, click **WhatsApp** (or **Copy**) under "Send to driver". "The driver gets the hospital, the minutes, the roads to avoid and a link. On the phone the link opens the route, and one button starts Google Maps navigation along *our* safe path." *(If a phone is on the same Wi-Fi and the app was opened at http://<laptop-ip>:3000, open the link on the phone.)*
6. "And 'How reliable is this?'" → open it. "The same evaluation you just saw, inside the product."

*If anything fails: "Let me show you the recording" → play `assets/demo_backup.mp4`, or go back to the map on this slide.*

### Slide 10 — Limits (8:20 – 8:50)
"What could make us wrong: it is not a flood forecast; it does not know drains, pumps or tides — because that data is not public; the rain-to-roads share is an assumption; the elevation model includes buildings; and 13 spots is a small test.

Each has a fix: bare-earth elevation, BMC drain and tide data, and dated waterlogging reports — that last one is what would turn this ranking into a real prediction."

### Slide 11 — Impact and next (8:50 – 9:25)
"Dispatchers plan before the call. BMC gets a 'fix first' list: the roads whose repair reopens the most ambulance trips. Hospitals see when their catchment loses access.

Next: bare-earth elevation with the same weights, the fix-first city view, and a one-monsoon pilot with a dispatch desk. It is built on open data, so any city with OpenStreetMap and an elevation model can reuse it."

### Slide 12 — Close (9:25 – 9:40)
"Public data in — **a route, a reason, and an honest reliability check out.** Thank you. We're happy to take questions."

---

## If you are running short of time
Cut in this order: slide 11 (say one line), slide 5 (one sentence), the demo's step 5 (the evaluation was already shown).

## If the live demo depends on fixes that are not finished
Check `TEAM_CHECKLIST.md` → "Slide claims that depend on fixes". If real routing is not live, **do not** read minutes from the screen. Say: "routing is being finished; here is the scoring and explanation", and demo only the rain day → red roads → why → reliability.
