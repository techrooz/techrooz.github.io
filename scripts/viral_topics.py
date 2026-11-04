#!/usr/bin/env python3
"""Free daily 'what's hot' list for TechRooz video topics (no tokens, no paid APIs).

Sources: Google Trends Iran + US (daily searches), Hacker News top (points),
Techmeme (top tech news), Persian tech channels on Telegram (views).
Prints one ranked list; Claude only reads the top lines and picks 1-3 video topics.
"""
import html, json, re, urllib.request

UA = {"User-Agent": "Mozilla/5.0 techrooz-research"}
TECH = re.compile(r"ai|gpt|chatgpt|gemini|claude|apple|iphone|samsung|galaxy|android|google|pixel|xiaomi|"
                  r"tesla|musk|spacex|nasa|starlink|game|gaming|playstation|ps5|ps6|xbox|nintendo|switch|steam|gta|"
                  r"nvidia|intel|amd|chip|meta|instagram|whatsapp|telegram|tiktok|youtube|netflix|hack|bitcoin|crypto|"
                  r"robot|openai|microsoft|windows|laptop|phone|vpn|"
                  r"هوش|آیفون|اپل|سامسونگ|گوشی|اندروید|بازی|تلگرام|اینستاگرام|واتساپ|فیلتر|اینترنت|ربات|"
                  r"تسلا|ایلان|ماسک|ناسا|بیت|کوین|ارز|دیجیتال|لپ|شیائومی|پلی|کنسول|هک", re.I)

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=15).read().decode("utf-8", "ignore")

def trends(geo):
    out = []
    try:
        x = get(f"https://trends.google.com/trending/rss?geo={geo}")
        for item in re.findall(r"<item>(.*?)</item>", x, re.S):
            t = html.unescape(re.search(r"<title>(.*?)</title>", item).group(1))
            n = int(re.sub(r"\D", "", (re.search(r"approx_traffic>([^<]*)", item) or [0, "0"])[1]) or 0)
            out.append((n / 100, f"Trends-{geo}", t, n))
    except Exception as e:
        print("# trends", geo, e)
    return out

def hn():
    out = []
    try:
        ids = json.loads(get("https://hacker-news.firebaseio.com/v0/topstories.json"))[:30]
        for i in ids:
            s = json.loads(get(f"https://hacker-news.firebaseio.com/v0/item/{i}.json"))
            out.append((s.get("score", 0) / 50, "HN", s.get("title", ""), s.get("score", 0)))
    except Exception as e:
        print("# hn", e)
    return out

def techmeme():
    out = []
    try:
        x = get("https://www.techmeme.com/feed.xml")
        for k, t in enumerate(re.findall(r"<item>.*?<title>(.*?)</title>", x, re.S)[:15]):
            out.append((15 - k, "Techmeme", html.unescape(re.sub(r"<[^>]+>", "", t)), 15 - k))
    except Exception as e:
        print("# techmeme", e)
    return out

def telegram(chs=("thezoomit", "digiato", "gadgetnews", "technolife", "mobile140")):
    out = []
    for c in chs:
        try:
            x = get(f"https://t.me/s/{c}")
            for m in re.finditer(r'tgme_widget_message_text[^>]*>(.*?)</div>.*?tgme_widget_message_views">([^<]+)', x, re.S):
                t = html.unescape(re.sub(r"<[^>]+>", " ", m.group(1))).strip().split("\n")[0][:90]
                v = m.group(2).strip().upper()
                n = float(v[:-1]) * (1000 if v.endswith("K") else 1e6) if v[-1] in "KM" else float(v)
                out.append((n / 2000, f"TG-{c}", t, int(n)))
        except Exception as e:
            print("# tg", c, e)
    return out

rows = trends("IR") + trends("US") + hn() + techmeme() + telegram()
rows = [r for r in rows if TECH.search(r[2]) or r[1] in ("Techmeme",) or r[1].startswith("TG")]
for s, src, t, n in sorted(rows, key=lambda r: -r[0])[:40]:
    print(f"{s:6.1f} | {src:14} | {n:>8} | {t}")
