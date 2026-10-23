# FloodRoute — how it works, explained without black boxes

For the whole team, technical and non-technical. Every number here comes from the files in this repo or from data fetched on 2026-10-23 (see `presentation/TEAM_CHECKLIST.md` §4).

---

## 1. The problem in one paragraph

On a heavy-rain day in Mumbai, some roads fill with water: underpasses, low junctions, local "bowls". An ambulance that takes one of them loses time or gets stuck. Today the dispatcher picks the route with normal navigation, which only knows a road is blocked **after** traffic stops or someone reports it. FloodRoute answers one question **before** the trip: *if it rains this hard, which roads are most likely to flood, and what does that do to the route to the nearest hospital?* It also helps the city flood team see which roads matter most to fix.

## 2. What the user sees (non-technical)

1. **Pick a rain day.** For example "a very heavy day like 22 Sep 2016 (251 mm)" or "tomorrow's forecast".
2. **Red roads appear.** These are the roads most likely to flood on a day like that.
3. **Click where the patient is.**
4. **Two routes appear.** A dashed blue line is the normal fastest route. A solid teal line is the flood-safe route that avoids red roads. The app says how many minutes the safe route adds, whether it goes to a different hospital, or that there is **no safe route** (the area is cut off).
5. **Tap a red road** to see why it is red, for example "3.8 m lower than the area around it".
6. **"How reliable is this?"** shows how well the red roads matched places where flooding was actually reported, including where it was wrong.

## 3. How it works inside, step by step (technical, but plain)

### Step A — Build the road network (OpenStreetMap)
We download the main roads of the study area (Colaba up to Andheri/Kurla) as a **graph**: junctions are points (5,041) and road pieces between them are lines (9,746 segments, 1,552 km). Each segment knows its length and a driving time.

### Step B — Give every road a height (Copernicus 30 m elevation)
A free satellite elevation map gives the height of the ground every 30 m. For each junction we read two numbers:
- **Absolute height:** metres above sea level.
- **Relative height:** this junction's height minus the typical (median) height of everything within 300 m. A negative number means the road sits in a dip, where water collects.

We also measure each road's **distance to the nearest water** (sea, creek, canal, drain) and mark **underpasses**. Bridges and flyovers (470) are never marked, because they sit above water.

### Step C — The flood-proneness score (a weighted sum, no AI)
Each of the four signals is turned into a 0–1 rank (1 = the most flood-prone of all roads), then:

```
score = 0.45 × (sunken vs. surroundings)
      + 0.25 × (low absolute height)
      + 0.20 × (close to water)
      + 0.10 × (is an underpass)
```

**Worked example — one segment of Maharshi Karve Road near Churchgate (real data):**

| Signal | Raw value | Rank (0–1) | × weight |
|---|---|---|---|
| Lower than surroundings | 3.8 m below | 0.97 | 0.45 → 0.438 |
| Absolute height | 4.2 m | 0.96 | 0.25 → 0.241 |
| Distance to water | 545 m | 0.25 | 0.20 → 0.050 |
| Underpass | no | 0 | 0.10 → 0 |
| **Score** | | | **0.73**, more flood-prone than 93% of roads |

The weights are in `config.yaml` and were chosen **before** testing. They are a judgement, not learned from data.

### Step D — Rain day → which roads count as "likely to flood"
Rain does not tell us *which* road floods. It tells us *how bad* the day is. We use India Meteorological Department (IMD) categories and an **assumption** about how many of the most prone roads to treat as blocked:

| IMD category (mm/day) | Top roads treated as likely to flood | Segments |
|---|---|---|
| Heavy (64.5–115.5) | 8% | 780 |
| Very heavy (115.6–204.4) | 15% | 1,462 |
| Extremely heavy (≥ 204.5) | 25% | 2,437 |

Nobody publishes this mapping. That is why the app shows it and lets the user change it ("What if?").

### Step E — Routing (shortest path, no AI)
1. Find the nearest hospital (from OpenStreetMap) and the fastest path to it on the full road graph. This is the **normal route**.
2. Delete the red roads from the graph and search again. This is the **flood-safe route**.
3. Compare the two. If they are the same: "not affected". If the safe one is longer: "+N minutes". If no path exists: "cut off".

This is Dijkstra's algorithm, the same idea behind every navigation app, run on our own graph, so it is free and fully explainable.

### Step F — Checking ourselves (validation)
We collected 14 places where waterlogging was publicly reported (BMC lists, flood gauges, news), each with a source link. 13 of them are within 150 m of one of our roads. For each one we ask: *how high did our score rank this road among all 9,746?*
- If the score were perfect, every reported spot would be near the top. That is **AUC = 1.0**.
- If the score were a coin toss, the spots would land anywhere. That is **AUC = 0.5**.
- **Our result: AUC 0.46** (95% range 0.32–0.61). Overall that is no better than chance, on a small sample.
- It ranks the true dips high (Churchgate 88%, the Sion flood gauges 78–83%), but misses Milan Subway and Gandhi Market. There the 30 m elevation map "sees" the rail embankment or flyovers instead of the road underneath.

**What this means:** the routing machinery works whatever the score is. The weak part is the *input*, terrain-only flood-proneness. We say so openly and show what data would fix it.

## 4. What is real in the live app today vs. after the fixes

| Part | Today (live) | After P0 fixes (see `CLAUDE.md`) |
|---|---|---|
| Red roads | Real (Steps A–C) | Real |
| Rain-day cards | Invented values | Real top-10 days from Open-Meteo + forecast |
| Hospitals | 10 hand-picked | 550 named OSM hospitals (34 tagged emergency) |
| Routes, minutes, cut off | A fixed, hand-drawn example | Real shortest paths along streets (Step E) |
| "How reliable is this?" | Hard-coded numbers that do not match the data | Real numbers from Step F |

## 5. Is this a good project? An honest assessment

**Strong for a hackathon:**
- One clear user, one city, one decision. That is exactly what the brief asks for.
- Every step can be explained on a whiteboard. Judges reward reasoning over complexity.
- 100% public data, no keys, reproducible.
- An honest evaluation with named failure causes. Evaluation integrity is the first tie-breaker.

**Weak today:**
- Most of the live app is placeholder data (section 4). This is the biggest risk, and it must be fixed.
- The score does not beat chance on 13 spots. That is acceptable if reported honestly, not if hidden.
- The "fix first" city view (very distinctive) is not built.

## 6. Existing tools and competitors, and how we differ

| Tool | What it does | What it does not do | FloodRoute's angle |
|---|---|---|---|
| Google Maps / Waze | Live traffic and reported closures; best for live driving | Reacts after a road is jammed or reported; no "what if it rains this hard"; routing API is paid | Plans **before** rain; free; says *why* a road is risky |
| City flood-warning systems (e.g. iFLOWS-Mumbai, government; verify details before quoting) | Forecast flooding / rainfall at area level for authorities | Not built around an ambulance trip or the hospital decision | Turns risk into a **route + hospital** decision |
| BMC flood-spot lists / news | Lists of chronic spots | Static lists; no routing; no ranking of what matters most | Uses them to **test** our score; ranks roads by impact on trips (city view) |

**Our honest differentiator** is not "better flood detection". Official systems with drains, tides and gauges will always know more. It is three things together:
1. **Decision, not a map:** "which hospital, how many extra minutes, or cut off" for a dispatcher.
2. **Explainable:** every red road states its reason; every assumption is visible and adjustable.
3. **Self-checking:** the app shows how reliable it is, including its failures.

The most unique feature to build next is the **fix-first city view**: which few roads, if drained, reopen the most ambulance trips. No navigation app answers that.

## 7. Should we add an LLM (Ollama + Qwen, Groq, tool calling)?

**Short answer: not for the core, and only one small, honest use if time allows.**

The core questions (which roads, which route, how reliable) are geometry and arithmetic. An LLM cannot make them more correct, and it can make up numbers. The brief warns against that. Judges reward evidence, not "AI added".

| Idea | Fits the brief? | Verdict |
|---|---|---|
| LLM decides which roads flood | No. No data to learn from; unverifiable | ✗ |
| Pre-trained flood model weights | No suitable public model for Mumbai roads; 14 labels can't validate it | ✗ |
| Chat agent with tool calling ("route from Dadar station") | Possible, but fragile in a live demo and adds no evidence | ✗ for now |
| **Plain-language dispatcher briefing in Marathi / Hindi / English**, generated from the route result | Yes, as an optional feature. The numbers come from our API; the LLM only rewrites wording. Template fallback when no LLM. | ✓ Tier C, only after P0 |
| LLM to help extract more flood spots from news articles (human checks every row) | Yes, as an offline helper; grows the test set | ✓ optional, offline |

If we build the briefing:
- **Engine:** local Qwen through Ollama (no key, works offline). Groq is optional through an environment variable.
- **Fallback:** a fixed template, so judges can run it without any LLM.
- **Guard:** the code checks that every number in the LLM text matches the API numbers; if not, it shows the template.

## 8. Plan

**If the final is today (Saturday) and we have only a few hours:** do only P0 #1 (real routing), #4 (honest validation numbers), #2 (real rain days) and #5 (honest labels). Present the deck, and skip the LLM entirely.

**Order of work (P0 → P1 → optional):**
1. Real routing + the route drawn along streets on the map (P0 #1, #6).
2. Honest validation numbers in the app (P0 #4, #5).
3. Real rain days and all named hospitals (P0 #2, #3).
4. Backup demo recording (P0 #7).
5. Fix-first city view, the strongest differentiator (Tier B).
6. Optional: multilingual dispatcher briefing with Qwen/Ollama + template fallback (Tier C).
