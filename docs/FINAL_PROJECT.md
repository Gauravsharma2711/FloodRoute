# FloodRoute — final project definition (agreed scope for the final round)

Status date: 2026-10-24. The demo runs **locally on the presenter's laptop** (judges did not ask for a live link). Deployment is out of scope until after the final.

---

## 1. The product in one sentence

**On a heavy-rain day, FloodRoute tells an ambulance dispatcher which hospital to send a patient to, and which route avoids the roads most likely to flood, and hands that decision to the driver's phone in one tap.**

## 2. One specific user, one moment

- **User:** the ambulance dispatcher at a control room (108 EMS, or a hospital's own ambulance desk) in Mumbai.
- **Moment of use:** an IMD orange/red rain alert. A call comes in: patient at a location. The dispatcher has under a minute to decide **where to send the ambulance** and **which way it should go**. The evening before, the same screen is used to plan: "if it rains this hard tomorrow, which areas lose their usual hospital?"
- **Today's pain:**
  - The hospital is chosen by distance.
  - The driver follows normal navigation or memory.
  - A flooded underpass or junction is discovered on arrival, and the ambulance backtracks.
  - Nobody on the desk can see, ahead of time, which approach roads to a hospital are likely to go under.
- **Second user (supporting, not demoed in depth):** the city flood-control team, who want to know which roads matter most to drain or fix. This is a "next step" slide only.

## 3. Why this is different from Google Maps (the reasoning)

| | Google Maps / Waze | FloodRoute |
|---|---|---|
| Question answered | "How do I get to place X fastest *right now*?" | "**Which hospital** should this patient go to, and which way, **if it rains this hard**?" |
| Knows a road is flooded… | after traffic stops or someone reports it (live data, needs reports) | **before**, from terrain: roads lower than the area around them, near water, underpasses, scaled to the rain category |
| Destination | fixed by the user | **chosen by the tool**. Flooding can change *which* hospital is best (real example: BKC → Bhabha Hospital, Kurla is the normal choice, but the flood-safe choice is **Shatabdi Hospital, Govandi**, +8 min) |
| Explains itself | no | every avoided road says why ("3.8 m lower than its surroundings") and the app shows how reliable the score is |
| Works the night before | no (no live data yet) | yes, from tomorrow's forecast |
| Cost / openness | routing API is paid | free, open data, reproducible |

**The core insight to say on stage:** in a flood, the hard decision is not the turn-by-turn path but **the destination**. A dispatcher who sends the ambulance to the "nearest" hospital may send it into the flooded side of the city. FloodRoute makes that trade-off visible before the ambulance leaves.

**What we do not claim (honesty):**
- We don't know where water is right now.
- Live reports from traffic police and Google are more current once flooding happens. FloodRoute is the planning layer that comes first.
- Our flood-proneness score is terrain-only, and on 13 reported spots it does not beat chance overall (AUC 0.46). It catches true dips and misses spots under flyovers and embankments. We show this in the app.

## 4. Final feature set (deliberately small)

1. **Flood-aware hospital + route decision.** ✅ Real (routing on the OSM road graph, 35 major hospitals).
2. **"Send to driver".** WhatsApp (`wa.me` with prefilled text) and SMS (`sms:`) links that the dispatcher taps. The message carries the hospital, the extra minutes and the roads to avoid, plus a link that opens the phone view with the route. A person taps send; there are no paid messaging APIs.
3. **Evidence built in.** "Why is this road marked?" plus "How reliable is this?" with the real validation numbers.

Not in the final: deployment, city view / fix-first (next-steps slide), chat or LLM agent, live traffic.

## 5. UI: what we change, learned from Google Maps

Google Maps is easy to read because the **routes are the main thing on the map**, and each route carries its time in a bubble. In our current map the red roads everywhere compete with the routes. Changes:

1. **Time bubbles on the routes.** On the dashed blue route: "Normal · 2 min · Bhabha Hospital · crosses roads likely to flood". On the teal route: "Flood-safe · 10 min · Shatabdi Hospital".
2. **Focus mode after a route is shown.** Fade the red roads elsewhere (low opacity). Keep only the flagged stretches that sit **on the normal route** bright, each with a ⚠ marker, so it is obvious *why* we don't take it.
3. **Clear start and end.** A "Patient" pin, "Go to: Shatabdi Hospital" at the destination, and the rejected normal hospital shown greyed out as "approach likely to flood".
4. **The result card reads as a decision, in three lines:** **Send to Shatabdi Hospital** · +8 min vs normal route · Avoid: Bandra Kurla Complex Road. Under it, the **Send to driver** buttons.
5. **Less sidebar clutter.** A compact rain-day picker: "Today's forecast" first, historical days in a collapsed list.

## 6. Final plan (local demo), in order

| # | Work | Why | Est. |
|---|---|---|---|
| 1 | **Real rain days**: `pipeline/03_fetch_rain.py` → `data/processed/scenarios.json` (top-10 real days from the cached archive + forecast, IMD category, flag share from `config.yaml`) | The demo starts here, and the values are still invented | 40 min |
| 2 | **Honest validation**: `pipeline/05_validate.py` → `validation_results.json`; reliability page reads it; delete hard-coded numbers | Integrity is the first tie-breaker | 45 min |
| 3 | **UI clarity** (section 5, items 1–4) | Judges must understand the map in five seconds | 1.5 h |
| 4 | **Send to driver** + phone view opened by the link | The differentiating workflow | 1–1.5 h |
| 5 | **Docs regenerated from the scripts**: `METHOD_REPORT.md` and `DATA_STATEMENT.md` numbers (7,670 rain days; validation from step 2; routing to 35 major hospitals), README "run locally" | Submission package must match the code | 45 min |
| 6 | **Deck + script refresh** with screenshots of the new UI; backup screen recording | Demo safety | 30 min |
| 7 | **Rehearse** the 10-minute run on the presenting laptop (both servers running, opened 5 min before) | — | 30 min |

Total ≈ 6 hours. If time is short, do 1 → 2 → 3 → 6 and present "Send to driver" as the next step.
