#!/usr/bin/env python3
"""TechRooz reel voice: join per-sentence TTS clips into one warm 'dubbing' voice track.

usage: voice_fx.py out.wav part1.wav[:mood] part2.wav[:mood] ...
moods: excited (fast, a bit brighter/higher = smile), warm (default), calm, twist (slower, for the reveal).
Without a mood the last part is "twist", others "warm".
prints the start/end time of every sentence (JSON) for the captions.
"""
import json, subprocess, sys, tempfile, os

FX = ("asetrate=24000*0.975,aresample=24000,atempo=1.0256,highpass=f=70,"
      "equalizer=f=150:t=q:w=1.2:g=2.5,equalizer=f=450:t=q:w=1.5:g=-2,equalizer=f=3000:t=q:w=1.2:g=3,"
      "deesser=i=0.3,acompressor=threshold=-22dB:ratio=3.5:attack=4:release=60:makeup=2,"
      "aecho=0.8:0.25:8:0.03,loudnorm=I=-13:TP=-1.2")
MOODS = {"excited": (1.15, 1.035), "warm": (1.11, 1.015), "calm": (1.05, 1.0), "twist": (1.05, 1.0)}
TRIM = ("silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
        "silenceremove=start_periods=1:start_threshold=-45dB,areverse")

def run(*a):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", p]).decode())

def main(out, parts):
    tmp = tempfile.mkdtemp()
    files, lines, t = [], [], 0.0
    for i, spec in enumerate(parts):
        last = i == len(parts) - 1
        p, _, mood = spec.partition(":")
        mood = mood or ("twist" if last else "warm")
        tempo, pitch = MOODS[mood]
        q = os.path.join(tmp, f"q{i}.wav")
        # pitch up a little for a "smiling" sound, then fix the speed so only tempo changes
        run("-i", p, "-af", f"{TRIM},asetrate=24000*{pitch},aresample=24000,atempo={tempo / pitch:.4f}", "-ar", "24000", "-ac", "1", q)
        if i:
            gap = 0.3 if mood == "twist" else (0.1 if mood == "excited" else 0.14)
            g = os.path.join(tmp, f"g{i}.wav")
            run("-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(gap), g)
            files.append(g); t += gap
        d = dur(q); files.append(q); lines.append({"start": round(t, 2), "end": round(t + d, 2)}); t += d
    lst = os.path.join(tmp, "l.txt")
    open(lst, "w").write("".join(f"file '{f}'\n" for f in files))
    run("-f", "concat", "-safe", "0", "-i", lst, "-af", FX, "-ar", "44100", out)
    # pitch/tempo step keeps length the same (0.975 * 1.0256 = 1)
    print(json.dumps(lines))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2:])
