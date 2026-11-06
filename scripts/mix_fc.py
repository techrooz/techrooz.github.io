#!/usr/bin/env python3
"""Build ffmpeg filter_complex script for a Mob reel: music ducked under voice, whoosh at scene starts, ticks on beats, TechRooz sting at end card.
usage: mix_fc.py props.json out_fc.txt
inputs (in this order): 0 video, 1 voice, 2 music(-stream_loop -1), 3 whoosh, 4 sting, 5 tick.  Then: ffmpeg ... -filter_complex_script out_fc.txt -map 0:v -map "[a]" -t <seconds>"""
import json, sys
d = json.load(open(sys.argv[1])); sc = d['scenes']; total = d['seconds']
ws = [s['start'] for s in sc]; ticks = []
for s in sc:
    for o in ([0.3, 1.0, 2.0, 3.0, 4.2, 5.4, 6.2, 7.0] if s.get('kind','').startswith('hook') else [0.35, 1.1, 1.8, 2.6, 3.4, 4.4, 5.4, 6.4]):
        if s['start'] + o < s['end'] - 0.3: ticks.append(round(s['start'] + o, 2))
f = [f"[2:a]volume=0.9[m0];[m0][1:a]sidechaincompress=threshold=0.02:ratio=9:attack=8:release=350[md];[md]afade=t=out:st={total-2.3:.2f}:d=2[m]"]
f.append(f"[3:a]volume=0.35,asplit={len(ws)}" + "".join(f"[w{i}]" for i in range(len(ws)))); lab = []
for i, w in enumerate(ws): f.append(f"[w{i}]adelay={int(w*1000)}|{int(w*1000)}[x{i}]"); lab.append(f"[x{i}]")
# ticks removed (v2): they sounded like repetitive beeps
hs = int((total - 1.9) * 1000); f.append(f"[4:a]volume=0.8,adelay={hs}|{hs}[h]"); lab.append("[h]")
f.append("[1:a]volume=1.0[v]")
f.append("[v][m]" + "".join(lab) + f"amix=inputs={2+len(lab)}:normalize=0:duration=first,alimiter=limit=0.95[a]")
open(sys.argv[2], 'w').write(";".join(f)); print(len(ws), len(ticks), total)
