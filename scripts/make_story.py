"""Illustrated story reel (e.g. «داستان برندها»): scene images + narration -> 9:16 MP4.

Usage: python3 scripts/make_story.py <story_dir> <out.mp4> [title]
story_dir has story.json ({"scenes":[{"t": caption, ...}]}), s00.jpg.. images and vo.wav (narration).
Heavy work is all ffmpeg/Remotion; no model calls.
"""
import json, os, shutil, subprocess, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from make_reel import CLEAN_VO  # same voice clean-up as the news reels


def run(*a, **k):
    subprocess.run(list(a), check=True, **k)


def main(d, out, title=""):
    st = json.load(open(os.path.join(d, "story.json"), encoding="utf-8"))
    pub = os.path.join(HERE, "..", "reel", "public", "story")
    shutil.rmtree(pub, ignore_errors=True); os.makedirs(pub)
    scenes = []
    for i, sc in enumerate(st["scenes"]):
        im = Image.open(os.path.join(d, f"s{i:02d}.jpg")).convert("RGB")
        w, h = im.size
        im = im.crop((0, 0, w, int(h * 0.94)))  # drop the generator's footer mark
        im = im.resize((1080, int(1080 * im.size[1] / im.size[0])), Image.LANCZOS)
        im.save(os.path.join(pub, f"s{i:02d}.jpg"), quality=92)
        scenes.append({"text": sc["t"], "img": f"story/s{i:02d}.jpg"})
    vo = os.path.join(d, "vo_clean.wav")
    run("ffmpeg", "-loglevel", "error", "-y", "-i", os.path.join(d, "vo.wav"), "-af", CLEAN_VO, vo)
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", vo]).decode())
    w = [len(s["text"]) + 14 for s in scenes]; acc = 0.4
    for s, k in zip(scenes, w):
        s["start"], s["dur"] = round(acc, 2), round(dur * k / sum(w), 2); acc += dur * k / sum(w)
    total = round(dur + 1.5, 2)
    props = os.path.join(d, "props.json")
    json.dump({"scenes": scenes, "seconds": total, "title": title}, open(props, "w"), ensure_ascii=False)
    vid = os.path.join(d, "v.mp4")
    args = ["npx", "remotion", "render", "src/index.ts", "Story", vid, f"--props={props}", "--log=error", "--concurrency=4"]
    if os.environ.get("REEL_BROWSER"):
        args += ["--browser-executable", os.environ["REEL_BROWSER"]]
    run(*args, cwd=os.path.join(HERE, "..", "reel"))
    music = os.path.join(d, "m.wav")
    run(sys.executable, os.path.join(HERE, "make_music.py"), str(total + 1), "84", music)
    fc = ("[1:a]adelay=400|400,apad,asplit=2[vo][vk];[2:a]lowpass=f=2500,volume=0.16[mu];"
          "[mu][vk]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck];[duck][vo]amix=inputs=2:normalize=0[a]")
    run("ffmpeg", "-loglevel", "error", "-y", "-i", vid, "-i", vo, "-i", music, "-filter_complex", fc, "-map", "0:v", "-map", "[a]",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "25", "-maxrate", "3000k", "-bufsize", "6000k",
        "-c:a", "aac", "-b:a", "128k", "-t", str(total), "-movflags", "+faststart", out)
    print(out, total, "s")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "")
