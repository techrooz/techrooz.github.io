#!/usr/bin/env python3
"""Prepare Persian text for TTS: apply fa_lexicon.json (pronunciation fixes),
turn digits into words and keep it warm/natural. usage: fa_tts_text.py "متن" -> prints fixed text."""
import json, os, re, sys

LEX = json.load(open(os.path.join(os.path.dirname(__file__), "fa_lexicon.json"), encoding="utf-8"))
ONES = "صفر یک دو سه چهار پنج شش هفت هشت نه".split()
TEENS = "ده یازده دوازده سیزده چهارده پانزده شانزده هفده هجده نوزده".split()
TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"]
HUND = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"]

def words(n):
    if n < 10: return ONES[n]
    if n < 20: return TEENS[n - 10]
    if n < 100: return TENS[n // 10] + ("" if n % 10 == 0 else " و " + ONES[n % 10])
    if n < 1000: return HUND[n // 100] + ("" if n % 100 == 0 else " و " + words(n % 100))
    for d, name in ((10**9, "میلیارد"), (10**6, "میلیون"), (1000, "هزار")):
        if n >= d:
            r = n % d
            return (words(n // d) + " " + name) + ("" if r == 0 else " و " + words(r))

def fix(t):
    t = t.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٬", "0123456789,"))
    t = re.sub(r"\$\s?([\d,]+)", lambda m: words(int(m.group(1).replace(",", ""))) + " دُلار", t)
    t = re.sub(r"([\d,]+)\s?[%٪]", lambda m: words(int(m.group(1).replace(",", ""))) + " درصد", t)
    t = re.sub(r"\d[\d,]*", lambda m: words(int(m.group(0).replace(",", ""))), t)
    for k in sorted((k for k in LEX if not k.startswith("_")), key=len, reverse=True):
        t = t.replace(k, LEX[k])
    return t

if __name__ == "__main__":
    print(fix(" ".join(sys.argv[1:])))
