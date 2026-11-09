# Low Literacy Ticket Interface

High-fidelity prototype of an Ahmedabad Metro ticket kiosk designed for low-literacy passengers.
Pictures, colours, voice and numbers carry the meaning; text is kept short and shown in
Gujarati, Hindi or English.

## Flow

1. **Choose language:** ગુજરાતી / हिंदी / English, each written in its own script.
2. **Greeting:** "Namaste".
3. **Where do you want to go?** The question is spoken aloud, then the kiosk listens. Say any place in Ahmedabad, or touch a station on the map.
4. **Choose a station:** the three stations with the shortest *road* route to the place light up, each with its real walking or auto route drawn on the map, the time and the exit gate. Routes come from OSRM (routing.openstreetmap.de) on OpenStreetMap roads. Up to 2 km is shown as a walk, longer as an auto/cab, with drive times scaled up for city traffic.
5. **Trip and tickets:** the route is drawn on the map with direction arrows. The panel shows it as a flowchart: landmark pictures for the start, interchange and destination, stops in between as dots, and colour-coded platform badges (with matching footstep stickers in the station) for where to board. Choose the number of tickets with − / +. **Every picture can be tapped to hear it** in the chosen language: the stations ("Change trains at Old High Court and take the Red line"), platforms ("Board the train from platform 2. Follow the white footsteps"), the line between stations, exit gate, walk/auto leg, next train, total time and fare. The tapped item glows while it speaks.
6. **Payment:** the UPI QR and the cash slot are shown together. The kiosk detects which one was used (simulated: tap the QR or press `U` for UPI; tap the cash slot or press `C` to insert the next note).

7. **Ticket:** printed in pure black and white: destination, the route as a flow of station pictograms (each station has its own symbol), the platforms to board, exit gate, journey time, valid-till time, passengers, fare and a QR to scan at the gate. Text is in the chosen language with a second language beneath the names.
8. **Demo preview (not part of the kiosk):** after printing, the tickets are shown on screen. Every passenger has a separate ticket with its own number and QR, marked 1 / 3, 2 / 3 and so on. Page through them with the arrows, download the current ticket or all of them as one PDF, or use **Exit preview** to return to the kiosk.

Platform colours: 1 black, 2 white, 3 yellow, 4 orange (3 and 4 are the Red line at Old High Court).

Map on the left, menu on the right (within easy reach for right-handed users).

## Run locally

```bash
python tools/serve.py
```

Then open http://localhost:8000. This server turns off browser caching, so edits show up on a normal reload. Use Chrome or Edge for voice input.

**Voice not heard?** While listening, the bars around the mic follow the input volume. If they stay flat and "No sound from the microphone" appears, Chrome is using the wrong mic. Click the mic icon in the address bar (or open `chrome://settings/content/microphone`) and pick the microphone you're speaking into. Speech recognition always uses Chrome's selected mic.

## Spoken prompts

The prompts are MP3 clips in `audio/<lang>/`, so they work in every browser without installed voices.
They are generated from the text in `js/data.js`: prompts from `T`, the trip-review phrases from `SAY`, plus every station name, known place name and the numbers 1–99, which the kiosk joins into sentences. Only missing clips are made, so after editing a phrase just run the script again. To change the wording or switch voices:

```bash
pip install edge-tts
python tools/make_voices.py              # female voices (default)
python tools/make_voices.py --set male   # male voices
```

Edit `VOICE_SETS` in `tools/make_voices.py` to pick other voices (`python -m edge_tts --list-voices`).

Demo without a microphone: open the browser console on the destination screen and run `demoSay('Kankaria')`.

## Notes

- Station positions are approximate. Fares and timings are realistic but made up.
- No backend: speech recognition uses the browser's built-in service, places not in the built-in list are looked up on OpenStreetMap (Nominatim), and road routes come from the public OSRM server. Without internet it falls back to straight-line estimates.
- Map data © OpenStreetMap contributors.
