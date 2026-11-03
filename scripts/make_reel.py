"""Make a TechRooz reel (30-60s): human-like deep Persian voice-over + kinetic-typography video.

Usage: python3 scripts/make_reel.py <item.json> <out.mp4>
Item fields used: "voice" (5-8 short spoken sentences; wrap key words in *stars* to
emphasise them on screen), "hook", "photo"/"photos", "cat", "caption".
Voice: free Microsoft neural TTS (edge-tts) with a lower pitch, warmed up with EQ.
"""
import asyncio, json, os, re, ssl, subprocess, sys, tempfile

VOICE, RATE, PITCH = "fa-IR-FaridNeural", "-4%", "-14Hz"


def strip(t):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", t)).strip()


def auto_voice(it):
    cap = it["caption"]
    title = strip((re.search(r"<b>(.*?)</b>", cap) or [None, cap.split("\n")[0]])[1])
    title = re.sub(r"^[^\w؀-ۿ«]+", "", title)
    paras = [strip(l) for l in cap.split("\n") if len(strip(l)) > 40 and not l.startswith("💬")]
    sents = [s.strip() for p in paras for s in re.split(r"(?<=[.!؟])\s+", p) if len(s.strip()) > 15][:5]
    hook = it.get("hook") or "یه خبر داغ داریم!"
    return " ".join([hook, title + "."] + sents + ["خبرهای کامل، هر روز توی کانال تلگرام *تک‌روز*."])


async def tts(text, mp3):
    import edge_tts
    import edge_tts.communicate as c
    if os.environ.get("REEL_CA"):  # local sandbox only (proxy CA)
        c._SSL_CTX = ssl.create_default_context(cafile=os.environ["REEL_CA"])
    com = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH, boundary="SentenceBoundary")
    marks = []
    with open(mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] in ("SentenceBoundary", "WordBoundary"):
                marks.append({"start": ch["offset"] / 1e7, "dur": ch["duration"] / 1e7, "text": ch["text"]})
    return marks


def main(item_path, out):
    it = json.load(open(item_path, encoding="utf-8"))
    script = it.get("voice") or auto_voice(it)
    spoken = script.replace("*", "")
    d = tempfile.mkdtemp()
    raw, mp3, vid = (os.path.join(d, n) for n in ("raw.mp3", "v.m4a", "v.mp4"))
    marks = asyncio.run(tts(spoken, raw))
    # warmer, deeper, radio-like voice
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", raw, "-af",
                    "equalizer=f=110:t=q:w=1.1:g=5,equalizer=f=3200:t=q:w=1:g=2,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,loudnorm=I=-15",
                    "-c:a", "aac", "-b:a", "160k", mp3], check=True)
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).decode())
    # map each spoken sentence back to its *emphasis* marks in the script
    sents = [s.strip() for s in re.split(r"(?<=[.!؟?])\s+", script) if s.strip()]
    scenes = []
    for i, s in enumerate(sents):
        start = marks[i]["start"] if i < len(marks) else (scenes[-1]["start"] + scenes[-1]["dur"] if scenes else 0)
        scenes.append({"text": s, "start": round(start + 0.35, 2), "dur": 0})
    for i, s in enumerate(scenes):
        s["dur"] = round((scenes[i + 1]["start"] if i + 1 < len(scenes) else dur + 0.4) - s["start"], 2)
    total = round(dur + 2.8, 2)  # + outro
    photos = it.get("photos") or ([it["photo"]] if it.get("photo") else [])
    spec = os.path.join(d, "spec.json")
    json.dump({"scenes": scenes, "photos": photos, "cat": it.get("cat"), "seconds": total}, open(spec, "w"), ensure_ascii=False)
    subprocess.run(["node", os.path.join(os.path.dirname(os.path.abspath(__file__)), "make_reel.js"), spec, vid], check=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", vid, "-i", mp3, "-filter_complex", "[1:a]adelay=350|350,apad[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-shortest", "-movflags", "+faststart", out], check=True)
    print(out, total, "s,", len(scenes), "scenes")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
