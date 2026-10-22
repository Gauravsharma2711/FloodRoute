# Google Stitch prompts — FloodRoute (simple, light, driver-first)

Lesson from the first attempt: one huge prompt gave a crowded dark dashboard full of jargon. This version is **short prompts, one set of screens at a time, light and white, plain words**.

How to use
1. In Stitch, start a **new project** (do not keep editing the crowded one). Choose **Web**.
2. Paste **Prompt 1** only. Look at the result. Fix with a follow-up if needed.
3. Then paste Prompt 2, 3, 4 one by one. Always say "same style as the previous screens" if Stitch drifts.
4. All numbers and names in the designs are **placeholders for layout only**. The real app shows real data.

---

## ALL-IN-ONE PROMPT (one paste, 8 screens, kept deliberately simple)

```text
Design a simple app called FloodRoute for ambulance drivers and dispatchers in Mumbai on heavy-rain days. It shows which hospital to go to and how many extra minutes the safe route takes, avoiding roads that are likely to flood. Create 8 screens: 6 mobile (390x844) and 2 desktop (1366x768).

STYLE FOR EVERY SCREEN: light, white, friendly and extremely simple, like Google Maps or Uber. NOT a dashboard, NOT dark, NOT a control room. White background, large dark text, lots of empty space, one main action per screen. No jargon, no tiny text, no uppercase labels, no dense tables, no more than three pieces of information on screen at once. Font Inter. Body text at least 16px. Buttons 56px tall, full width on mobile, rounded 14px.
COLOURS: background #FFFFFF, soft card #F6F8FA, text #111827, muted text #6B7280, border #E5E7EB. Accent teal #0B8A7E for primary buttons and the safe route. Normal route blue #2563EB drawn DASHED. Roads likely to flood drawn amber #F5B83D to orange #F97316 to red #DC2626. Patient pin amber #F59E0B. Hospital markers: white circle with a dark "H". Light map style (like CARTO Positron) of Mumbai. Status banners are soft tinted: red for cut off, green for no change, each with an icon.
EVERY SCREEN: a slim 24px amber strip at the very top with small text "Sample design data", and the logo text "FloodRoute". Nothing else in the header.
WORDING: use "likely to flood". Never write "flooded", "flood forecast" or "predicts floods". No login, menus, settings or extra screens.

MOBILE SCREENS (driver)
1 "Rain": heading "How heavy is the rain?". Three large tappable cards, one selected with a teal outline: "Tomorrow · forecast · Heavy", "5 Aug 2020 · 187 mm · Very heavy", "2 Jul 2019 · 231 mm · Extremely heavy". One small grey line: "Roads most likely to flood will be avoided. This is an estimate." Button "Next".
2 "Patient": full-screen light map with some roads in amber-to-red and a yellow patient pin. At the bottom a row of simple chips: Hindmata, Sion, Milan Subway, Chembur, Andheri, Kurla. Big button "Find safe route".
3 "Result": top half is the map with a dashed blue normal route and a thick solid teal safe route, patient pin, hospital marker. Bottom half a white card with: a huge bold number "+14 min" (56px), "Go to Hospital Y", a small grey line "Normal route 18 min · Safe route 32 min", "Avoid: Hindmata Junction". One primary button "Show why" and one text link "Choose another location".
4 "Cut off": same layout as Result. Soft red banner with icon: "No safe route. This area may be cut off." Below: "Nearest hospital: Hospital Z, 2.1 km straight line". Primary button "Choose another location".
5 "No change": soft green banner with a check icon: "Your normal route is not affected." Below: "Hospital X · 18 min". Primary button "Done".
6 "Why these roads?": a white bottom sheet over a dimmed map. Title "Why is this road marked?", road name "Hindmata Junction", three short lines with small icons: "1.8 m lower than the area around it", "120 m from a creek", "Underpass". A grey note: "This is an estimate based on terrain, not a live flood report." Text link "How reliable is this?".

DESKTOP SCREENS (dispatcher), same style and wording
7 "Main": a large light map fills the screen. On the left a clean white panel 340px wide with three numbered steps and nothing else: 1 "Rain day" (the three cards), 2 "Patient location" (the chips, hint "or click the map"), 3 "Result" (card with big "+14 min", "Go to Hospital Y", "Normal 18 min · Safe 32 min", "Avoid: Hindmata Junction"). On the map: roads likely to flood, dashed blue normal route, thick solid teal safe route, patient pin, hospital markers, a small legend. A text link top right: "How reliable is this?". No tabs, no icon sidebars, no tables, no charts.
8 "How reliable is this?": a centred 720px column on white. Section 1: "We checked our marked roads against 17 places where waterlogging was reported." and ONE simple bar chart with 3 bars: "Our method", "Elevation only", "Random guess", with large placeholder numbers. Section 2: "What this does not know" as 4 short bullets (not a live flood report; no drains or pumps; the amount of rain that closes roads is an assumption; only a small number of reported places were used). Section 3: "What we would need next" as a short bullet list. Small grey footer: "Map data © OpenStreetMap contributors · Elevation: Copernicus · Rain: Open-Meteo. Prototype for decision support, not an official warning system."
```

If Stitch makes it crowded, use the "Fix prompts" at the bottom of this file, or fall back to Prompts 1 to 4 below.

---

## Prompt 1 — the driver's three main screens (mobile)

```text
Design 3 mobile screens (390x844) for a simple app called FloodRoute. It helps an ambulance driver in Mumbai on a heavy-rain day: it shows which hospital to go to and how many extra minutes the safe route takes, avoiding roads that are likely to flood.

STYLE: light, white, friendly and extremely simple, like Google Maps or Uber. White background, large dark text, lots of empty space, one main action per screen. NOT a dashboard, NOT a control room, NOT dark. No jargon, no tiny text, no tables, no charts, no more than three pieces of information on screen at once. Font Inter. Body text at least 16px. Buttons 56px tall, full width, rounded 14px.

COLOURS: background #FFFFFF, soft card #F6F8FA, text #111827, muted text #6B7280, border #E5E7EB. Main accent teal #0B8A7E (primary buttons and the safe route). Normal route blue #2563EB drawn DASHED. Roads likely to flood drawn on the map in amber #F5B83D to orange #F97316 to red #DC2626. Patient pin amber #F59E0B. Hospital markers: white circle with a dark "H". Light map style (like CARTO Positron) of Mumbai.

SCREEN 1 "Rain": big heading "How heavy is the rain?". Three large tappable cards, one selected (teal outline): "Tomorrow · forecast · Heavy", "5 Aug 2020 · 187 mm · Very heavy", "2 Jul 2019 · 231 mm · Extremely heavy". One small grey line: "Roads most likely to flood will be avoided. This is an estimate." Button: "Next".

SCREEN 2 "Patient": full-screen light map with some roads in amber-to-red (likely to flood) and a yellow patient pin. A horizontal row of simple chips at the bottom: Hindmata, Sion, Milan Subway, Chembur, Andheri, Kurla. Big button: "Find safe route".

SCREEN 3 "Result": top half is the map with a dashed blue normal route and a thick solid teal safe route, patient pin, hospital marker. Bottom half is a white card with: a huge number "+14 min" (56px, bold), a line "Go to Hospital Y", a small grey line "Normal route 18 min · Safe route 32 min", one line "Avoid: Hindmata Junction". Two buttons: primary "Start" is NOT needed; use one primary "Show why" and one text link "Choose another location".

A slim 24px amber strip at the very top of each screen with small text "Sample design data" is allowed; nothing else in the header except the logo text "FloodRoute".

WORDING: use "likely to flood". Never write "flooded", "flood forecast" or "predicts floods".
Do not add login, menus, settings, charts, or extra screens.
```

---

## Prompt 2 — the two other driver states (mobile)

```text
Same style, same colours and same components as the previous 3 screens. Create 3 more mobile screens (390x844), equally simple.

SCREEN 4 "Cut off": same map layout as the result screen. Bottom card with a soft red banner and an icon: "No safe route. This area may be cut off." Below: "Nearest hospital: Hospital Z, 2.1 km straight line". One primary button "Choose another location".

SCREEN 5 "No change": bottom card with a soft green banner and a check icon: "Your normal route is not affected." Below: "Hospital X · 18 min". One primary button "Done".

SCREEN 6 "Why these roads?": a white bottom sheet over a dimmed map. Title "Why is this road marked?". Road name "Hindmata Junction". Three short lines with small icons: "1.8 m lower than the area around it", "120 m from a creek", "Underpass". At the bottom a grey note: "This is an estimate based on terrain, not a live flood report." A text link "How reliable is this?".

Keep text large, one idea per screen, no tables.
```

---

## Prompt 3 — dispatcher on a computer (desktop)

```text
Same style, colours and wording as the mobile screens. Create ONE desktop screen (1366x768) for a dispatcher. Keep it as simple as the phone version.

Layout: a large light map fills the screen. On the left, a clean white panel 340px wide with three numbered steps and nothing else: 1 "Rain day" (three cards as on mobile), 2 "Patient location" (chips: Hindmata, Sion, Milan Subway, Chembur, Andheri, Kurla; hint "or click the map"), 3 "Result" (a card with a big "+14 min", "Go to Hospital Y", "Normal 18 min · Safe 32 min", "Avoid: Hindmata Junction"). On the map: roads likely to flood in amber-to-red, dashed blue normal route, thick solid teal safe route, patient pin, hospital markers, a small legend in a corner. A text link top right: "How reliable is this?".

Do not add tabs, sidebars with icons, dense tables, charts, status bars, or tiny text.
```

---

## Prompt 4 — "How reliable is this?" page (desktop, optional, simple)

```text
Same style. One simple desktop page (1366x768) titled "How reliable is this?". A centred column about 720px wide on white. Section 1: a short plain sentence "We checked our marked roads against 17 places where waterlogging was reported." followed by ONE simple bar chart with 3 bars: "Our method", "Elevation only", "Random guess", with the labels as large numbers (placeholders). Section 2: "What this does not know" as a short bullet list of four items: it is not a live flood report; it does not include drains or pumps; the amount of rain that closes roads is an assumption; only a small number of reported places were used. Section 3: "What we would need next" as a short bullet list. Footer text in small grey: "Map data © OpenStreetMap contributors · Elevation: Copernicus · Rain: Open-Meteo. Prototype for decision support, not an official warning system."
No other charts, cards or tables.
```

---

## Fix prompts (use if the result is still crowded)

- "Simplify this screen. Remove everything except the heading, the main content and one button. Increase font sizes and spacing."
- "Make the background white and use the light colour palette from the first prompt. Remove all dark panels."
- "Replace technical words with plain words a driver understands. Remove all uppercase labels and tiny text."
- "Make the number of minutes much larger and the rest of the card quieter."

## What to download from Stitch (put in `design/stitch/`)

| What | Name it |
|---|---|
| PNG of every screen | `M1_rain.png`, `M2_patient.png`, `M3_result.png`, `M4_cutoff.png`, `M5_nochange.png`, `M6_why.png`, `D1_main.png`, `D2_reliable.png` |
| HTML/CSS code of every screen | same names with `.html` |
| Colour and font tokens, if offered | `design_tokens.md` |

Check Stitch's Export menu for what is available. The front end is Next.js + Tailwind, so the exported HTML/CSS translates into components easily; the map itself is MapLibre, so the map area in the design is only a style reference.

Next step: tell Claude Code "Read docs/PRD.md, docs/UI_SPEC.md and every file in design/stitch/, then follow Prompt B in prompts/KICKOFF_PROMPT.md."
