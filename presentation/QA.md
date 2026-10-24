# FloodRoute — likely judge questions (short answers)

Answer in one or two sentences, then stop. Every number here comes from our code and data.

## The idea

**Q: Who is the user?**
The ambulance dispatcher (108 or a hospital desk) on a heavy-rain day. The driver gets the result on the phone.

**Q: What decision does it support?**
Which hospital to send the patient to, which route to take, and which roads to avoid.

**Q: Is this a flood forecast?**
No. It ranks roads by how likely they are to flood, from terrain, and scales that to the rain category. It doesn't measure water on the road right now.

**Q: Why not just use Google Maps?**
Google finds the fastest way to a destination you choose, and learns about flooding after traffic stops. We pick the destination and flag likely flooding before it happens. Google's routing API is also paid, and the brief doesn't allow paid APIs.

**Q: What's new here?**
The destination changes with the rain. In BKC on a very heavy day, the nearest hospital's approach is likely to flood, so we send to Shatabdi instead.

## Data

**Q: What data do you use?**
OpenStreetMap (roads, hospitals, water), Copernicus 30 m elevation, Open-Meteo rainfall (7,670 days) and forecast, IMD rain categories, and 14 publicly reported flood spots. All free and public.

**Q: Did you use any paid API or private data?**
No. No keys, no paid services, no personal data.

**Q: How many roads and hospitals?**
9,746 road segments (1,552 km of main roads). 611 hospital features in OpenStreetMap, of which we route to 35 major hospitals.

**Q: Why only 35 hospitals?**
Ambulances should go to big general hospitals, not clinics or eye centres. We route to BMC municipal and large general hospitals: KEM, Sion, Nair, JJ, Cooper, Hinduja, Lilavati and others. The list is in `config.yaml` and easy to change.

**Q: Where does the rain data come from?**
Open-Meteo's free archive for central Mumbai. We show the 10 heaviest real days since 2005, plus tomorrow's forecast.

**Q: Does the forecast update automatically?**
It updates when we run the data script. Automatic refresh every few hours is the first item on the roadmap.

## Method

**Q: How do you decide a road is likely to flood?**
A score from four terrain signals: lower than its surroundings, low height, close to water, underpass. The rain category then decides how many of the top roads count as likely to flood: 8%, 15% or 25%.

**Q: Why not machine learning?**
We have reports for about a dozen spots, not thousands. A model would memorise them. A transparent score is easier to check and trust.

**Q: How did you choose the weights?**
Fixed up front from how flooding works: being lower than the area around you matters most. We did not tune them afterwards.

**Q: How is the route computed?**
The fastest path on the real road network to the nearest major hospital, then the same search again with likely-to-flood roads removed.

**Q: Why are your minutes lower than Google's?**
Ours are travel-time estimates from speed limits, without traffic, used to compare the normal and safe routes. Google gives the live arrival time.

**Q: What does "cut off" mean?**
Every main road out of that area is likely to flood in that scenario, so the dispatcher should send a different resource or wait.

## Evidence

**Q: How accurate is it?**
We tested the score against 13 publicly reported waterlogging spots. It ranks true local dips high, such as Churchgate and the Sion flood gauges. It misses spots under flyovers and rail embankments, because 30 m satellite elevation sees the flyover, not the road beneath. The full result is in the app under "How reliable is this?".

**Q: Give me a number.**
On 13 spots the overall AUC is 0.46, with a wide interval of 0.32–0.61 because the sample is small. Elevation alone gives 0.45. It's a starting point, and better ground-level elevation data is the clear next step.

**Q: Did you validate the routes?**
The routes run on the real OpenStreetMap network, and we checked the cases by hand on the map. For example, BKC goes to Shatabdi to avoid Bandra Kurla Complex Road.

**Q: Isn't 13 spots too few?**
Yes, it's small, so we treat the result as a sanity check, not proof. More dated flood reports from BMC would make the test much stronger.

## Product and tech

**Q: What's the tech stack?**
Python (OSMnx, NetworkX, rasterio, pandas) for data and routing, FastAPI for the API, and Next.js with MapLibre for the map.

**Q: How fast is it?**
A route takes well under a second on a laptop.

**Q: How does the driver get the route?**
The dispatcher taps WhatsApp or SMS, which sends the hospital, minutes, roads to avoid and a link. The link opens the route on the phone, with a button that starts Google Maps along our safe path.

**Q: Is the driver link secure?**
It carries only a map location and the rain day, no patient details. A real deployment would add dispatcher login and expiring links.

**Q: Does it work on a phone?**
Yes. The driver view is built for phones, and the dispatcher view also works on a phone.

**Q: Can it work for other cities?**
Yes. It only needs OpenStreetMap, the global elevation model and Open-Meteo, which all cover any city. You change the map area in `config.yaml`.

**Q: Did you use AI tools?**
Yes, for coding assistance, and we disclose it as the rules ask. The method, data choices and results are ours, and we can explain every step.

## Impact and next steps

**Q: Who would pay for this?**
It stays free for public emergency services. Private hospital networks and ambulance fleets could pay for integration and support.

**Q: What would you build next?**
Automatic forecast refresh, a "fix-first" view showing BMC which roads reopen the most trips, Hindi and Marathi driver messages, and a one-monsoon pilot with a dispatch desk.

**Q: What data would make it better?**
Ground-level (LiDAR) elevation, BMC drain and pump data, and dated flood reports. Those would turn the ranking into a stronger prediction.
