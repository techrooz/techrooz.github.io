"""Make a full TechRooz reel (voice-over + animated video) from one queue item.

Usage: python3 scripts/make_reel.py <item.json> <out.mp4>
Voice: free Microsoft neural TTS (edge-tts, fa-IR-FaridNeural). Item may carry
"hook" (2-4 words shown + spoken first) and "voice" (the narration); otherwise
they are derived from the caption.
"""
import asyncio, json, os, re, ssl, subprocess, sys, tempfile

HOOKS = {"games": "گیمرها حواستون باشه!", "ai": "این هوش مصنوعی رو ببین!", "iran": "خبر مهم برای ایرانی‌ها!",
         "mobile": "قبل از خرید گوشی ببین!", "viral": "باورت می‌شه؟", "free": "رایگان شد!", "news": "خبر داغ امروز!"}


def strip(t):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", t)).strip()


async def tts(text, out):
    import edge_tts
    kw = {}
    if os.environ.get("REEL_CA"):  # local sandbox only (corporate proxy CA)
        import edge_tts.communicate as c
        c._SSL_CTX = ssl.create_default_context(cafile=os.environ["REEL_CA"])
    await edge_tts.Communicate(text, "fa-IR-FaridNeural", rate="+10%").save(out)


def main(item_path, out):
    it = json.load(open(item_path, encoding="utf-8"))
    cap = it["caption"]
    title = strip((re.search(r"<b>(.*?)</b>", cap) or [None, cap.split("\n")[0]])[1])
    title = re.sub(r"^[^\w؀-ۿ«]+", "", title)
    paras = [strip(l) for l in cap.split("\n") if len(strip(l)) > 40 and "نظر تک‌روز" not in l and not l.startswith("💬")]
    body = (paras[0] if paras else "")[:130]
    hook = it.get("hook") or HOOKS.get(it.get("cat"), "خبر داغ امروز!")
    voice = it.get("voice") or f"{hook} {title}. {body.split('.')[0]}. خبرهای کامل، توی کانال تلگرام تک‌روز."
    d = tempfile.mkdtemp()
    mp3, vid = os.path.join(d, "v.mp3"), os.path.join(d, "v.mp4")
    asyncio.run(tts(voice, mp3))
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).decode())
    secs = max(8.0, min(dur + 1.2, 30.0))
    spec = os.path.join(d, "spec.json")
    json.dump({"photo": it.get("photo") or (it.get("photos") or [""])[0], "cat": it.get("cat"), "hook": hook,
               "title": title, "body": body, "seconds": secs}, open(spec, "w"), ensure_ascii=False)
    subprocess.run(["node", os.path.join(os.path.dirname(__file__), "make_reel.js"), spec, vid], check=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", vid, "-i", mp3, "-filter_complex",
                    "[1:a]adelay=300|300,apad[a]", "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-shortest",
                    "-movflags", "+faststart", out], check=True)
    print(out, round(secs, 1), "s")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
