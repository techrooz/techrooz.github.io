#!/usr/bin/env python3
"""Small generator for the Iso reel: timings -> props JSON + audio mix (voice + ducked music + whooshes + sting).
usage: build_iso.py <workdir with p1.wav p2.wav p3.wav voice.wav> <props_out.json> <audio_out.m4a>"""
import json, subprocess, sys, os
W, PROPS, AOUT = sys.argv[1:4]
B = "/home/user/my-work/automations/brand"
dur = lambda f: float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]).decode())
d1, d2, d3, dv = (dur(f"{W}/{x}.wav") for x in ("p1", "p2", "p3", "voice"))
LEAD, GAP = 0.3, 0.15
a1 = LEAD; b1 = a1 + d1; a2 = b1 + GAP; b2 = a2 + d2; a3 = b2 + GAP; b3 = a3 + d3
# proportional sentence split by character counts (no STT)
c2 = [62, 21, 42]; t2 = a2 + d2 * (c2[0] + c2[1]) / sum(c2)
c3 = [58, 31, 50, 38]; s = sum(c3); u = d3 / s
t4 = a3 + u * c3[0]; t5 = t4 + u * c3[1]; t6 = t5 + u * c3[2]
secs = round(b3 + 2.1, 2)
sc = [
 dict(start=0, end=round(b1+GAP/2, 2), img="iso1.png", iz=0.9, iy=60, title="۱۲۸ گیگ خریدی؛ بقیه‌ش کجا رفت؟", hl=["کجا"], sub="You bought 128 GB. Where did the rest go?"),
 dict(start=round(b1+GAP/2, 2), end=round(t2, 2), img="iso2.png", iz=0.8, iy=60, oy=10, title="۱۲۸ گیگ می‌شه ۱۱۹", hl=["۱۱۹"], sub="1 GB = 1,000,000,000 bytes  →  about 119 GiB",
      labels=[dict(x=305, y=720, text="128 GB", c="or"), dict(x=775, y=820, text="119 GB", c="cy")]),
 dict(start=round(t2, 2), end=round(a3, 2), img="iso3.png", bg="#171a1f", iz=1.25, iy=-60, ox=55, oy=35, title="قفسه‌ها رو دو جور اندازه می‌گیرن", hl=["دو"], sub="Same warehouse, two different rulers"),
 dict(start=round(a3, 2), end=round(t4, 2), img="iso4.png", iz=0.95, iy=0, title="سیستم‌عامل هم سهم داره", hl=["سهم"], sub="OS + pre-installed apps: roughly 10 to 20 GB", pills=["۱۰ تا ۲۰ گیگ"]),
 dict(start=round(t4, 2), end=round(t5, 2), img="iso5.png", bg="#12151a", iz=0.82, iy=30, oy=10, title="حدود ۱۰۰ گیگ مال خودته", hl=["۱۰۰"], sub="128  →  119  →  ~100 GB",
      labels=[dict(x=380, y=235, text="128", c="cy"), dict(x=560, y=465, text="119", c="cy"), dict(x=745, y=735, text="~100", c="or")]),
 dict(start=round(t5, 2), end=round(t6, 2), img="iso6.png", iz=1.05, iy=50, ox=45, oy=30, title="کَش و ویدیوهای سنگین رو پاک کن", hl=["کَش"], sub="Clear app cache and big videos", pills=["تنظیمات", "حافظه"]),
 dict(start=round(t6, 2), end=secs, kind="cta", title="", kw="حافظه"),
]
json.dump(dict(seconds=secs, scenes=sc), open(PROPS, "w"), ensure_ascii=False, indent=1)
print("seconds", secs, "voice", round(dv, 2), [x["start"] for x in sc])
# audio
cuts = [x["start"] for x in sc[1:6]]
inp = ["-i", f"{W}/voice.wav", "-stream_loop", "-1", "-i", f"{B}/techrooz_music2.wav", "-i", f"{B}/techrooz_sting.wav"]
flt = [f"[0:a]adelay={int(LEAD*1000)}:all=1,apad[v]", "[v]asplit=2[vm][vs]",
       f"[1:a]atrim=0:{secs},volume=0.55,afade=t=in:d=1,afade=t=out:st={secs-1.5}:d=1.5[m0]",
       "[m0][vs]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=450[m]"]
# whooshes: filtered noise bursts at scene changes
w = []
for i, c in enumerate(cuts + [sc[6]["start"]]):
    flt.append(f"anoisesrc=d=0.6:c=pink:a=0.5,highpass=f=500,lowpass=f=6000,afade=t=in:d=0.25,afade=t=out:st=0.25:d=0.35,volume=0.35,adelay={int(max(0,c-0.3)*1000)}:all=1[w{i}]")
    w.append(f"[w{i}]")
flt.append(f"[2:a]adelay={int((secs-1.9)*1000)}:all=1,volume=0.9[st]")
flt.append("[vm]atrim=0:%s,volume=1.0[vv]" % secs)
flt.append(f"[vv][m]{''.join(w)}[st]amix=inputs={3+len(w)}:normalize=0:duration=first,alimiter=limit=0.95,atrim=0:{secs}[o]")
subprocess.check_call(["ffmpeg","-v","error","-y",*inp,"-filter_complex",";".join(flt),"-map","[o]","-ar","44100","-ac","2","-c:a","aac","-b:a","160k",AOUT])
print("audio ok")
