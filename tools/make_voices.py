"""Generate the kiosk's recorded voice clips as MP3 files under audio/<lang>/.

Everything spoken is read from js/data.js, so the audio always matches the screen:

    audio/<lang>/<clip>.mp3            prompts built from T (greeting, question, not found)
    audio/<lang>/say/<key>.mp3         trip-review phrases from SAY
    audio/<lang>/station/<id>.mp3      every station name
    audio/<lang>/place/<slug>.mp3      every known place name
    audio/<lang>/num/<n>.mp3           the numbers 1 to 99

Only missing clips are made, so editing one phrase and running again is quick.
Switching voices remakes everything:

    python tools/make_voices.py              # female voices (default)
    python tools/make_voices.py --set male   # male voices
    python tools/make_voices.py --force      # remake every clip

List every available voice with:  python -m edge_tts --list-voices
"""

import argparse
import asyncio
import json
import pathlib
import re

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"

VOICE_SETS = {
    "female": {"gu": "gu-IN-DhwaniNeural", "hi": "hi-IN-SwaraNeural", "en": "en-IN-NeerjaNeural"},
    "male": {"gu": "gu-IN-NiranjanNeural", "hi": "hi-IN-MadhurNeural", "en": "en-IN-PrabhatNeural"},
}

# Slightly slower than normal speech, which helps first-time and low-literacy listeners.
RATE = "-8%"

# Prompts made of one or more T keys, spoken in order.
CLIPS = {
    "greet": ["greet", "greetSub"],
    "whereTo": ["whereTo"],
    "notFound": ["notFound"],
}

NUMBERS = range(1, 100)
LANGS = ("gu", "hi", "en")
PARALLEL = 6


def names_in(line):
    return dict(re.findall(r"\b(en|gu|hi):\s*'([^']*)'", line))


def table(src, name):
    """Entries of a one-entry-per-line object such as `const SAY = { key: { en: ... }, ... };`."""
    body = re.search(rf"^const {name} = \{{\n(.*?)^\}};", src, re.M | re.S).group(1)
    # The names sit on the entry's first line, even when aliases continue on the next.
    return {m.group(1): names_in(m.group(2)) for m in re.finditer(r"^\s*'?([\w-]+)'?:\s*\{(.*)$", body, re.M)}


def place_slug(en):
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", en.lower()))


def jobs():
    """(output path, text) for every clip in every language."""
    src = (ROOT / "js" / "data.js").read_text(encoding="utf-8")
    t, say, stations = table(src, "T"), table(src, "SAY"), table(src, "STATIONS")
    places_src = re.search(r"^const PLACES = \[\n(.*?)^\];", src, re.M | re.S).group(1)
    places = [names_in(line) for line in places_src.splitlines() if "en:" in line]
    out = []
    for lang in LANGS:
        d = AUDIO / lang
        out += [(d / f"{clip}.mp3", " ".join(t[k][lang] for k in keys)) for clip, keys in CLIPS.items()]
        out += [(d / "say" / f"{k}.mp3", v[lang]) for k, v in say.items() if v.get(lang)]
        out += [(d / "station" / f"{k}.mp3", v[lang]) for k, v in stations.items()]
        out += [(d / "place" / f"{place_slug(p['en'])}.mp3", p[lang]) for p in places]
        out += [(d / "num" / f"{n}.mp3", str(n)) for n in NUMBERS]
    return out


async def main(voice_set, force):
    voices = VOICE_SETS[voice_set]
    stamp = AUDIO / "voices.json"
    if stamp.exists() and json.loads(stamp.read_text()) != voices:
        print("Voice set changed: remaking every clip.")
        force = True
    todo = [(path, text) for path, text in jobs() if force or not path.exists()]
    print(f"{len(todo)} clips to make.")
    sem = asyncio.Semaphore(PARALLEL)

    async def make(path, text):
        lang = path.relative_to(AUDIO).parts[0]
        path.parent.mkdir(parents=True, exist_ok=True)
        async with sem:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text, voices[lang], rate=RATE).save(str(path))
                    return
                except Exception as err:  # the service occasionally drops a request
                    if attempt == 2:
                        print(f"FAILED {path.relative_to(ROOT)}: {err}")
                    await asyncio.sleep(1 + attempt)

    await asyncio.gather(*(make(p, t) for p, t in todo))
    AUDIO.mkdir(exist_ok=True)
    stamp.write_text(json.dumps(voices, indent=2))
    size = sum(f.stat().st_size for f in AUDIO.rglob("*.mp3"))
    print(f"Done. audio/ now holds {len(list(AUDIO.rglob('*.mp3')))} clips, {size / 1024 / 1024:.1f} MB.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--set", choices=VOICE_SETS, default="female", help="which voice set to use")
    parser.add_argument("--force", action="store_true", help="remake clips that already exist")
    args = parser.parse_args()
    asyncio.run(main(args.set, args.force))
