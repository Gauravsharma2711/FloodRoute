# FloodRoute — speaker transcript (one speaker, about 10 minutes)

**Setup before you start**
- **Deck:** `presentation/index.html` open in full screen (press F), on slide 1.
- **App:** a second tab at `http://localhost:3000`, already loaded, with the **17 May 2021 (very heavy)** day selected.
- **Moving slides:** use **→** or the **▶** button. Clicking on the slide does nothing.
- **Formatting below:** *Italic* lines are actions, not words to say. **Bold** marks the words to stress.

---

## Slide 1 — Title · 0:20

"Good afternoon. Mumbai gets around 2,200 millimetres of rain a year, most of it in four monsoon months, and every monsoon the same question comes up in every ambulance control room: **can the ambulance get through?**

We built **FloodRoute**. When it pours, it tells the dispatcher **which hospital** to send the patient to and **which road** to take, using only public data."

*→ next*

## Slide 2 — The problem · 0:50

"Picture a dispatcher on a heavy-rain day. A call comes in, and they have less than a minute to decide.

Today they send the ambulance to the nearest hospital, on the normal route. Too often the driver discovers a flooded underpass only when they reach it, and has to turn back.

Navigation apps can't help in advance, because they only learn a road is blocked **after** traffic stops or someone reports it. The dispatcher needs to know **before**.

And this is predictable. From 21 years of rainfall data we found **110 heavy-rain days**, and **96%** of them fall between June and September. BMC itself lists **336** chronic waterlogging spots. We know when and roughly where. What's missing is turning that into a dispatch decision."

*→ next*

## Slide 3 — What FloodRoute does · 0:40

"FloodRoute does this in four steps.

**One**, pick the rain day: tomorrow's forecast, or a real heavy day from the past. The roads likely to flood turn red.
**Two**, place the patient on the map.
**Three**, get the decision: which hospital, how many minutes, which roads to avoid.
**Four**, send it to the driver's phone in one tap.

Every red road explains why it's red, routes run on Mumbai's real street network to 35 major hospitals, and the app checks itself against reported flood spots. You'll see all of this live in a minute."

*→ next*

## Slide 4 — Where the data comes from · 0:40

"Everything comes from **five public sources**, and every number in the app traces back to one of them.

- **OpenStreetMap** gives us the road network, about **9,700 road segments**, plus hospitals, rivers and creeks.
- **Copernicus** satellite elevation gives the height of every road.
- **Open-Meteo** gives **21 years of daily rainfall** and tomorrow's forecast.
- **IMD's rain categories** tell us how bad a day is.
- **Reported waterlogging spots** from BMC, flood gauges and news are used only to test our score.

It's built in Python and FastAPI with a Next.js map. No keys, no paid APIs, and anyone can rebuild it."

*→ next*

## Slide 5 — How it decides · 0:50

"This is how it decides. There's no black box.

**First**, every road gets a flood-prone score from four terrain signals: is it lower than the area around it, is it low above sea level, is it close to the sea or a creek, and is it an underpass.

**Second**, the rain day sets how many of the most flood-prone roads count as likely to flood. On a heavy day it's the top 8%, very heavy 15%, extremely heavy 25%.

**Third**, we compute two routes: the fastest path to the nearest major hospital, and the same search again with those roads removed.

**Fourth**, the decision. If both routes match, the trip is not affected. If the safe one is longer, you see the extra minutes, and maybe a different hospital. If there's no path, the area is cut off.

Why not machine learning? Flood reports exist for a handful of spots, not thousands. A score you can explain road by road is easier to trust in an emergency."

*→ next*

## Slide 6 — Why it's different · 0:40

"So how is this different from Google Maps?

Google answers: how do I reach this place fastest, **right now**? FloodRoute answers: **which hospital**, and which way, **if it rains this hard**?

Google learns about a flooded road after traffic stops. We flag it **before**, from terrain. Google keeps your destination fixed. We **choose** the destination. We also know a flyover stays open while an underpass is the first thing to go.

Here's a real example. A patient in **BKC** on a very heavy day: the nearest hospital is Bhabha in Kurla, but its approach runs into roads likely to flood. So FloodRoute sends the ambulance to **Shatabdi Hospital** instead, eight minutes longer, but a route that gets there."

*→ next*

## Slide 7 — Send to driver · 0:30

"And the decision doesn't stay on the dispatcher's screen. **One tap** sends it on WhatsApp or SMS: the hospital, the minutes, and the roads to avoid.

The driver opens the link and sees the route on the phone. **Start navigation** hands our flood-safe path to Google Maps for turn-by-turn directions. No paid messaging service: the dispatcher just taps send."

*→ next*

## Slide 8 — Live demo · 3:30 to 4:00

"Let me show you." *Switch to the app tab.*

1. *Rain day already on 17 May 2021.* "This is a real very heavy day, almost 200 millimetres. The red roads are the ones likely to flood on a day like this."
2. *Click **BKC (Bandra Kurla Complex)**.* "A patient in BKC. The dashed blue line is the normal route to Bhabha Hospital, and the red marks show where it crosses roads likely to flood. The solid teal line is the flood-safe route, to **Shatabdi Hospital**. The card says it directly: send the ambulance to Shatabdi, 10 minutes, eight more than normal, avoid Bandra Kurla Complex Road."
3. *Click a red road on the map.* "Why is this road marked? It tells you: lower than the area around it, near water. Every red road can explain itself."
4. *Click **WhatsApp** under Send to driver.* "This is the message the driver gets." *Open the Route map link.* "And this is the driver's phone view." *Click **Start navigation**.* "One tap and Google Maps follows our safe path."
5. *Back to the dashboard, click the **How reliable is this?** icon in the header.* "And we built the check into the product: our score tested against publicly reported flood spots, so the user can see the evidence."

*If time allows:* *click **Marol (Andheri East)**.* "Another one: the normal route uses the Marol underpass, so the safe route goes to Hiranandani instead."

*Switch back to the slides, → next.*

**If the demo fails:** stay on slide 8 and talk over the screenshot. "Here's the BKC case you would have seen: Bhabha Hospital is blocked, so we send to Shatabdi." Then go to slide 7 for the driver view.

## Slide 9 — Who it helps · what's next · 0:30

"Who is this for?
- The **108 dispatch desk**, to plan before the call.
- **Drivers and patients**, who get one clear instruction with no dead ends.
- **BMC's flood-control team**, to see which roads, once drained, reopen the most ambulance trips.

Next: live forecast refresh, a 'fix-first' view for BMC, driver messages in Hindi and Marathi, and a pilot with one dispatch desk for a monsoon. It stays free for public emergency services."

*→ next*

## Slide 10 — Thank you · 0:10

"Public data in. A hospital, a route and a reason out. Thank you, we'd love your questions."

---

**Time check:** slides 1–7 take about 4:30, the demo 3:30–4:00, and slides 9–10 about 0:40, for **about 9:00–9:40** in total.

**If you're running long:** shorten slide 4 to one sentence and skip the Marol example.

**Likely questions and short answers:** see [QA.md](QA.md).
