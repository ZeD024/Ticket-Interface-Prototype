# Low Literacy Ticket Interface

High-fidelity prototype of an Ahmedabad Metro ticket kiosk designed for low-literacy passengers.
Pictures, colours, voice and numbers carry the meaning; text is kept short and shown in
Gujarati, Hindi or English.

## Flow

1. **Choose language:** ગુજરાતી / हिंदी / English, each written in its own script.
2. **Greeting:** "Namaste" is spoken in the chosen language.
3. **Where do you want to go?** The question is spoken aloud, then the kiosk listens. Say any place in Ahmedabad, or touch a station on the map.
4. **Choose a station:** the three nearest stations light up on the map, each with walking/auto time and the exit gate.
5. **Trip and tickets:** the route is drawn on the map with direction arrows. The panel shows it as a flowchart: landmark pictures for the start, interchange and destination, stops in between as dots, and colour-coded platform badges (with matching footstep stickers in the station) for where to board. Choose the number of tickets with − / +.
6. **Payment:** the UPI QR and the cash slot are shown together. The kiosk detects which one was used (simulated: tap the QR or press `U` for UPI; tap the cash slot or press `C` to insert the next note).

Platform colours: 1 black, 2 white, 3 yellow, 4 orange (3 and 4 are the Red line at Old High Court).

Map on the left, menu on the right (within easy reach for right-handed users).

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000. Use Chrome or Edge for voice input.

## Spoken prompts

The prompts are MP3 clips in `audio/<lang>/`, so they work in every browser without installed voices.
They are generated from the on-screen text in `js/data.js`. To change the wording or switch voices:

```bash
pip install edge-tts
python tools/make_voices.py              # female voices (default)
python tools/make_voices.py --set male   # male voices
```

Edit `VOICE_SETS` in `tools/make_voices.py` to pick other voices (`python -m edge_tts --list-voices`).

Demo without a microphone: open the browser console on the destination screen and run `demoSay('Kankaria')`.

## Notes

- Station positions are approximate. Fares and timings are realistic but made up.
- No backend: speech recognition uses the browser's built-in service, and places not in the built-in list are looked up on OpenStreetMap (Nominatim).
- Map data © OpenStreetMap contributors.
