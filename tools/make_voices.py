"""Generate the kiosk's spoken prompts as MP3 files in audio/<lang>/<key>.mp3.

The prompt text is read from js/data.js (the T table), so the audio always
matches what is shown on screen. To switch voices, change VOICES below (or pass
--set male) and run again:

    python tools/make_voices.py
    python tools/make_voices.py --set male

List every available voice with:  python -m edge_tts --list-voices
"""

import argparse
import asyncio
import pathlib
import re

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent

VOICE_SETS = {
    "female": {"gu": "gu-IN-DhwaniNeural", "hi": "hi-IN-SwaraNeural", "en": "en-IN-NeerjaNeural"},
    "male": {"gu": "gu-IN-NiranjanNeural", "hi": "hi-IN-MadhurNeural", "en": "en-IN-PrabhatNeural"},
}

# Slightly slower than normal speech, which helps first-time and low-literacy listeners.
RATE = "-8%"

# Each clip is one or more T keys from js/data.js, spoken in order.
CLIPS = {
    "greet": ["greet", "greetSub"],
    "whereTo": ["whereTo"],
    "notFound": ["notFound"],
}


def read_texts():
    src = (ROOT / "js" / "data.js").read_text(encoding="utf-8")
    texts = {}
    for key in {k for keys in CLIPS.values() for k in keys}:
        m = re.search(rf"^\s*{key}:\s*\{{(.*)\}},?\s*$", src, re.M)
        if not m:
            raise SystemExit(f"T.{key} not found in js/data.js")
        texts[key] = dict(re.findall(r"(en|gu|hi):\s*'([^']*)'", m.group(1)))
    return texts


async def main(voice_set):
    texts = read_texts()
    voices = VOICE_SETS[voice_set]
    for lang, voice in voices.items():
        out_dir = ROOT / "audio" / lang
        out_dir.mkdir(parents=True, exist_ok=True)
        for clip, keys in CLIPS.items():
            text = " ".join(texts[k][lang] for k in keys)
            out = out_dir / f"{clip}.mp3"
            await edge_tts.Communicate(text, voice, rate=RATE).save(str(out))
            print(f"{out.relative_to(ROOT)}  ({voice}, {out.stat().st_size // 1024} KB)  {text}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--set", choices=VOICE_SETS, default="female", help="which voice set to use")
    asyncio.run(main(parser.parse_args().set))
