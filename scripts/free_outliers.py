#!/usr/bin/env python3
"""Free vidIQ-style outlier finder (no API key, no credits).

Searches YouTube (Shorts or long videos) for each keyword, then compares every video's
views with its channel's subscriber count. outlier = views / max(subs, 1000).
A score >= 5 means the video did far better than the channel normally would -> the
TOPIC or HOOK is what made it viral, so it is a good idea to borrow (idea only).

usage: free_outliers.py [--long] "keyword 1" "keyword 2" ...
"""
import concurrent.futures as cf, json, re, sys, urllib.parse, urllib.request

UA = {"User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.9"}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20).read().decode("utf-8", "ignore")

def num(t):
    t = t.lower().replace(",", "")
    m = re.search(r"([\d.]+)\s*(k|m|b|thousand|million|billion)?", t)
    if not m:
        return 0
    mult = {"k": 1e3, "thousand": 1e3, "m": 1e6, "million": 1e6, "b": 1e9, "billion": 1e9}.get(m.group(2), 1)
    return int(float(m.group(1)) * mult)

def search(q, shorts=True):
    sp = "EgIYAQ%253D%253D" if shorts else "EgIQAQ%253D%253D"
    h = get(f"https://www.youtube.com/results?search_query={urllib.parse.quote(q)}&sp={sp}")
    out = {}
    for m in re.finditer(r'"videoId":"([\w-]{11})"', h):
        vid = m.group(1)
        seg = h[m.start(): m.start() + 4000]
        acc = re.search(r'"accessibilityText":"([^"]*?), ([\d.,]+ (?:thousand |million |billion )?views)', seg)
        vc = re.search(r'"viewCountText":\{"simpleText":"([\d,]+) views"', seg)
        ti = re.search(r'"title":\{"runs":\[\{"text":"([^"]+)"', seg)
        if vid in out:
            continue
        if acc:
            out[vid] = (acc.group(1), num(acc.group(2)))
        elif vc and ti:
            out[vid] = (ti.group(1), num(vc.group(1)))
    return [(v, t, n) for v, (t, n) in out.items() if n > 0][:20]

def subs(vid):
    try:
        h = get(f"https://www.youtube.com/watch?v={vid}")
        s = re.search(r'"label":"([\d.,]+ (?:thousand |million |billion )?subscribers)"', h)
        ch = re.search(r'"canonicalBaseUrl":"/@([^"]+)"', h)
        return num(s.group(1)) if s else 0, ch.group(1) if ch else "?"
    except Exception:
        return 0, "?"

def main(args):
    shorts = "--long" not in args
    kws = [a for a in args if a != "--long"]
    rows = []
    for q in kws:
        found = search(q, shorts)
        with cf.ThreadPoolExecutor(8) as ex:
            info = list(ex.map(lambda r: subs(r[0]), found))
        for (vid, title, views), (sb, ch) in zip(found, info):
            rows.append((views / max(sb, 1000), views, sb, ch, title, vid, q))
    seen = set()
    for sc, v, sb, ch, t, vid, q in sorted(rows, key=lambda r: -r[0]):
        if vid in seen or v < 20000:
            continue
        seen.add(vid)
        try: print(f"{sc:7.1f}x | {v:>10,} views | {sb:>9,} subs | {ch[:20]:20} | {t[:80]} | youtu.be/{vid}")
        except BrokenPipeError: return

if __name__ == "__main__":
    main(sys.argv[1:])
