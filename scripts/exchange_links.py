#!/usr/bin/env python3
"""Find same-size, active Persian tech channels with an admin @id and print one-tap
exchange-request links for Mohammad (he sends them himself). No tokens needed.
Skips admins already listed in exchange_done.txt and appends the new ones."""
import concurrent.futures as cf, html, os, re, sys, urllib.parse, urllib.request, datetime as dt

DONE = os.path.join(os.path.dirname(__file__), "exchange_done.txt")
MSG = ("سلام وقت بخیر 🌹 من ادمین کانال تک‌روز هستم (خبر تکنولوژی، هوش مصنوعی و گیم): https://t.me/techrooz_fa\n"
       "کانال شما رو دیدم، خیلی خوبه. تبادل پست به پست انجام می‌دید؟ ممنون می‌شم 🙏")
stems = ("tech techno tekno technology android apple iphone game gaming games ai chatgpt gpt mobile gadget digital app apps "
         "soft linux python code hack security cyber tarfand amozesh hoosh robot computer pc laptop windows samsung xiaomi "
         "crypto startup trick tips news").split()
suf = ["fa", "_fa", "iran", "_iran", "ir", "_ir", "news_fa", "persian", "_persian", "farsi", "_farsi", "ha", "iha",
       "land", "zone", "world", "_channel", "channel", "1", "_tm", "plus", "pro", "_pro", "box", "city", "fa1", "online"]

def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=10).read().decode("utf-8", "ignore")

def check(c):
    try:
        h = get("https://t.me/" + c)
        m = re.search(r'tgme_page_extra">([\d\s]+) subscriber', h)
        if not m: return None
        n = int(re.sub(r"\D", "", m.group(1)))
        if not 40 <= n <= 8000: return None
        d = re.search(r'tgme_page_description[^>]*>(.*?)</div>', h, re.S)
        desc = html.unescape(re.sub("<[^>]+>", " ", d.group(1))) if d else ""
        if not re.search("[؀-ۿ]", desc): return None
        if re.search(r"شرط|کازینو|بت|فیلتر شکن|وی پی ان|v2ray|سرمایه|سیگنال", desc, re.I): return None
        ads = [a for a in re.findall(r"@([A-Za-z][A-Za-z0-9_]{4,31})", desc) if a.lower() != c.lower() and not a.lower().endswith("bot")]
        if not ads: return None
        last = re.findall(r'datetime="(\d{4}-\d\d-\d\d)', get("https://t.me/s/" + c))
        if not last or (dt.date.today() - dt.date.fromisoformat(last[-1])).days > 30: return None
        return c, n, ads[0], desc[:50].replace("\n", " ")
    except Exception:
        return None

done = set(open(DONE).read().split()) if os.path.exists(DONE) else set()
names = sorted({s + x for s in stems for x in suf if 5 <= len(s + x) <= 32})
with cf.ThreadPoolExecutor(16) as ex:
    found = [r for r in ex.map(check, names) if r and r[2].lower() not in done]
want = int(sys.argv[1]) if len(sys.argv) > 1 else 5
new = []
for c, n, a, d in found[:want]:
    print(f"@{c} ({n} عضو) — {d}\nhttps://t.me/{a}?text={urllib.parse.quote(MSG)}\n")
    new.append(a.lower())
open(DONE, "a").write("".join(x + "\n" for x in new))
