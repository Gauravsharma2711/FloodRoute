# FloodRoute — speaker transcript, explained (one speaker, about 10 minutes)

**How to use this file.** Each slide has three parts:
- **Say:** the words to speak. **Bold** marks the words to stress. *Italic* lines are actions, not words.
- **What this slide means:** the idea in plain language, so you understand it rather than memorise it.
- **Remember:** the one thing the judges should take away from that slide.

**Setup before you start**
- **Deck:** `presentation/index.html` open in full screen (press F), on slide 1.
- **App:** a second tab at `http://localhost:3000`, already loaded, with the **17 May 2021 (very heavy)** day selected.
- **Moving slides:** use **→** or the **▶** button. Clicking on the slide does nothing.

**The whole story in one breath:** *On heavy-rain days the dispatcher picks the hospital as if it were a dry day. FloodRoute uses public terrain and rain data to see which roads are likely to flood, picks a hospital the ambulance can actually reach, explains why, and sends it to the driver's phone.*

---

## Slide 1 — Title · 0:20

**Say:**
"Good afternoon. Mumbai gets around 2,200 millimetres of rain a year, most of it in four monsoon months, and every monsoon the same question comes up in every ambulance control room: **can the ambulance get through?**

We built **FloodRoute**. When it pours, it tells the dispatcher **which hospital** to send the patient to and **which road** to take, using only public data."

**What this slide means:** we open with the question, not the technology. "Which hospital and which road" is the whole product in six words. The 2,200 mm is our own average from 21 years of Open-Meteo data.

**Remember:** FloodRoute answers *which hospital, which road* on a heavy-rain day.

*→ next*

## Slide 2 — The problem · 0:50

**Say:**
"Picture a dispatcher on a heavy-rain day. A call comes in, and they have less than a minute to decide.

Today they send the ambulance to the nearest hospital, on the normal route. Too often the driver discovers a flooded underpass only when they reach it, and has to turn back.

Navigation apps can't help in advance, because they only learn a road is blocked **after** traffic stops or someone reports it. The dispatcher needs to know **before**.

And this is predictable. From 21 years of rainfall data we found **110 heavy-rain days**, and **96%** of them fall between June and September. BMC itself lists **336** chronic waterlogging spots. We know when and roughly where. What's missing is turning that into a dispatch decision."

**What this slide means:**
- **The user:** the dispatcher, one person making one decision under time pressure.
- **The gap:** existing tools react after flooding; we plan before it.
- **The numbers:** 110 days and 96% come from our own analysis, so the problem is seasonal and plannable. The 336 is BMC's own count of chronic spots, as reported in the news.

**Remember:** the problem is predictable, but nobody turns it into a dispatch decision.

*→ next*

## Slide 3 — What FloodRoute does · 0:40

**Say:**
"FloodRoute does this in four steps.

**One**, pick the rain day: tomorrow's forecast, or a real heavy day from the past. The roads likely to flood turn red.
**Two**, place the patient on the map.
**Three**, get the decision: which hospital, how many minutes, which roads to avoid.
**Four**, send it to the driver's phone in one tap.

Every red road explains why it's red, routes run on Mumbai's real street network to 35 major hospitals, and the app checks itself against reported flood spots. You'll see all of this live in a minute."

**What this slide means:** this is the user journey, the same four steps you'll click in the demo. Once the judges have seen the steps here, they'll recognise them on screen and follow easily.

**Remember:** rain day → patient → decision → driver.

*→ next*

## Slide 4 — Where the data comes from · 0:40

**Say:**
"Everything comes from **five public sources**, and every number in the app traces back to one of them.

- **OpenStreetMap** gives us the road network, about **9,700 road segments**, plus hospitals, rivers and creeks.
- **Copernicus** satellite elevation gives the height of every road.
- **Open-Meteo** gives **21 years of daily rainfall** and tomorrow's forecast.
- **IMD's rain categories** tell us how bad a day is.
- **Reported waterlogging spots** from BMC, flood gauges and news are used only to test our score.

It's built in Python and FastAPI with a Next.js map. No keys, no paid APIs, and anyone can rebuild it."

**What this slide means:**
- **OpenStreetMap:** a free, community-built world map, which gives us the roads and the hospitals.
- **Copernicus:** a European satellite elevation map that gives the height of the ground every 30 m. Low places collect water.
- **Open-Meteo:** a free weather service, with past daily rainfall and the forecast.
- **IMD categories:** the Indian Meteorological Department's official labels (heavy, very heavy, extremely heavy), set by millimetres of rain per day.
- **Reported spots:** places the news or BMC said flooded. We never use them to build the score, only to check it, which keeps the test fair.

The rules forbid paid data, so "no keys, no paid APIs" matters to judges.

**Remember:** all public, all free, all traceable.

*→ next*

## Slide 5 — How it decides · 0:50

**Say:**
"This is how it decides. There's no black box.

**First**, every road gets a flood-prone score from four terrain signals: is it lower than the area around it, is it low above sea level, is it close to the sea or a creek, and is it an underpass.

**Second**, the rain day sets how many of the most flood-prone roads count as likely to flood. On a heavy day it's the top 8%, very heavy 15%, extremely heavy 25%.

**Third**, we compute two routes: the fastest path to the nearest major hospital, and the same search again with those roads removed.

**Fourth**, the decision. If both routes match, the trip is not affected. If the safe one is longer, you see the extra minutes, and maybe a different hospital. If there's no path, the area is cut off.

Why not machine learning? Flood reports exist for a handful of spots, not thousands. A score you can explain road by road is easier to trust in an emergency."

**What this slide means:**
1. **Score:** each road gets a number from 0 to 1. The biggest factor (45%) is whether the road sits in a dip compared with the 300 m around it, because water runs into dips. Then low height (25%), nearness to water (20%) and underpasses (10%). Flyovers are never marked.
2. **Rain:** rain doesn't tell us *which* road floods, only how bad the day is. So a heavier day means more of the top-ranked roads are treated as blocked. These percentages are our chosen settings, stored in `config.yaml`.
3. **Routes:** a standard shortest-path search (the same idea as any navigation app) on the real road map, run twice: once normally, once with the risky roads deleted.
4. **Decision:** compare the two results.

On ML: with only about a dozen known flood spots, a model would just memorise them. A simple, explainable score is the honest choice.

**Remember:** score → rain level → two routes → compare. Every step can be explained.

*→ next*

## Slide 6 — Why it's different · 0:40

**Say:**
"So how is this different from Google Maps?

Google answers: how do I reach this place fastest, **right now**? FloodRoute answers: **which hospital**, and which way, **if it rains this hard**?

Google learns about a flooded road after traffic stops. We flag it **before**, from terrain. Google keeps your destination fixed. We **choose** the destination. We also know a flyover stays open while an underpass is the first thing to go.

Here's a real example. A patient in **BKC** on a very heavy day: the nearest hospital is Bhabha in Kurla, but its approach runs into roads likely to flood. So FloodRoute sends the ambulance to **Shatabdi Hospital** instead, eight minutes longer, but a route that gets there."

**What this slide means:**
- **The key insight:** in a flood, the important decision is *where to go*, not *how to turn*. Google can't change your destination; we can.
- **The BKC example** is computed live by our app on a real rain day: normal choice Bhabha Hospital (2 min, blocked), safe choice Shatabdi Hospital (10 min, +8).
- **Not anti-Google:** the driver still uses Google Maps for turn-by-turn directions (next slide). We decide; Google navigates.

**Remember:** "The hard decision is not the turn. It's the hospital."

*→ next*

## Slide 7 — Send to driver · 0:30

**Say:**
"And the decision doesn't stay on the dispatcher's screen. **One tap** sends it on WhatsApp or SMS: the hospital, the minutes, and the roads to avoid.

The driver opens the link and sees the route on the phone. **Start navigation** hands our flood-safe path to Google Maps for turn-by-turn directions. No paid messaging service: the dispatcher just taps send."

**What this slide means:** this closes the loop from analysis to action.
- WhatsApp and SMS open with the message already written, and the dispatcher taps send. That's free and needs no account or API.
- The link opens our driver page on the phone, which recomputes the same route.
- "Start navigation" passes our safe route to Google Maps as stops, so the driver gets voice directions that follow *our* path.

**Remember:** decision → driver's phone → navigation, in one tap.

*→ next*

## Slide 8 — Live demo · 3:30 to 4:00

**Say and do:**
"Let me show you." *Switch to the app tab.*

1. *Rain day already on 17 May 2021.* "This is a real very heavy day, almost 200 millimetres. The red roads are the ones likely to flood on a day like this."
2. *Click **BKC (Bandra Kurla Complex)**.* "A patient in BKC. The dashed blue line is the normal route to Bhabha Hospital, and the red marks show where it crosses roads likely to flood. The solid teal line is the flood-safe route, to **Shatabdi Hospital**. The card says it directly: send the ambulance to Shatabdi, 10 minutes, eight more than normal, avoid Bandra Kurla Complex Road."
3. *Click a red road on the map.* "Why is this road marked? It tells you: for example, lower than the area around it, near water. Every red road can explain itself."
4. *Click **WhatsApp** under Send to driver.* "This is the message the driver gets." *Open the Route map link.* "And this is the driver's phone view." *Click **Start navigation**.* "One tap and Google Maps follows our safe path."
5. *Back to the dashboard, click the **How reliable is this?** icon in the header.* "And we built the check into the product: our score tested against publicly reported flood spots, so the user can see the evidence."

*If time allows:* *click **Marol (Andheri East)**.* "Another one: the normal route uses the Marol underpass, so the safe route goes to Hiranandani instead."

*Switch back to the slides, → next.*

**What this slide means:** the demo proves the slides are real. Every number on screen is computed live: nothing is pre-recorded or typed in.
- **Map colours:** red = likely to flood; dashed blue = normal route; solid teal = flood-safe route; red "!" = where the normal route hits a risky road; grey label = the hospital we rejected.
- **"How reliable is this?"** compares our score with places that really flooded. Say only that it's "tested against reported spots". If a judge asks for the number, the answer is in `QA.md`.
- **If the demo fails:** stay on slide 8 and talk over the screenshot: "Here's the BKC case you would have seen: Bhabha is blocked, so we send to Shatabdi." Then go back to slide 7 for the driver view.

**Remember:** stay calm and slow. Point before you click, and say what the judges should look at.

## Slide 9 — Who it helps · what's next · 0:30

**Say:**
"Who is this for?
- The **108 dispatch desk**, to plan before the call.
- **Drivers and patients**, who get one clear instruction with no dead ends.
- **BMC's flood-control team**, to see which roads, once drained, reopen the most ambulance trips.

Next: live forecast refresh, a 'fix-first' view for BMC, driver messages in Hindi and Marathi, and a pilot with one dispatch desk for a monsoon. It stays free for public emergency services."

**What this slide means:**
- **The users:** three groups get value from the same engine.
- **The roadmap** is realistic and specific:
  - forecast refresh: the forecast is updated today by running a script, and the next step is to make it automatic;
  - fix-first: rank roads by how many ambulance trips they block;
  - local-language messages for drivers;
  - a real pilot.
- **The business line** is one sentence on purpose. The judges score evidence and usefulness, not revenue.

**Remember:** useful today for dispatch; the same engine helps the city fix roads.

*→ next*

## Slide 10 — Thank you · 0:10

**Say:**
"Public data in. A hospital, a route and a reason out. Thank you, we'd love your questions."

**What this slide means:** one memorable closing line that repeats the whole idea. The three cards behind you map to the hackathon's own theme: **Discover** (roads scored), **Explain** (every road says why), **Act** (hospital and route sent to the driver).

**Remember:** stop talking after "questions". Let them ask.

---

## Time check
- **Slides 1–7:** about 4:30
- **Demo:** 3:30–4:00
- **Slides 9–10:** about 0:40
- **Total:** about 9:00–9:40

**If you're running long:** shorten slide 4 to one sentence ("five public sources, all free") and skip the Marol example.

## Words to use, words to avoid
- **Use:** "likely to flood", "flood-safe route", "planning tool", "public data".
- **Avoid:** "flooded" (we don't see water), "predicts floods" or "forecast of floods", "Mumbai's first", and any number that isn't on the slides or in `QA.md`.

**Likely questions and short answers:** [QA.md](QA.md).
