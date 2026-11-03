"""TechRooz invite bot: every member gets a personal invite link, the bot counts who
joined through it, and a weekly leaderboard is posted. Runs inside the posting daemon.

State (user ids, names, counts) is encrypted with a key derived from the bot token,
so the public repo never shows who is who.
"""
import base64, hashlib, json, os, urllib.parse, urllib.request, urllib.error
from datetime import datetime, timedelta, timezone

from cryptography.fernet import Fernet

CHAT = "@techrooz_fa"
STATE = "referral.enc"
TEH = timezone(timedelta(hours=3, minutes=30))
BOT_LINK = "https://t.me/TechRooz_fa_bot?start=invite"


def _fernet(token):
    return Fernet(base64.urlsafe_b64encode(hashlib.sha256(("techrooz-ref:" + token).encode()).digest()))


def load(token):
    try:
        return json.loads(_fernet(token).decrypt(open(STATE, "rb").read()))
    except Exception:
        return {"offset": 0, "users": {}, "links": {}, "joined": {}, "board_week": ""}


def save(token, st):
    open(STATE, "wb").write(_fernet(token).encrypt(json.dumps(st, ensure_ascii=False).encode()))


def api(token, method, **p):
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/{method}", data=json.dumps(p).encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req, timeout=40))
    except urllib.error.HTTPError as e:
        return json.load(e)


def welcome(token, st, user):
    uid = str(user["id"])
    if uid not in st["users"]:
        link = api(token, "createChatInviteLink", chat_id=CHAT, name=f"ref{uid}"[:32]).get("result", {}).get("invite_link")
        if not link:
            return
        st["users"][uid] = {"name": (user.get("first_name") or "دوست")[:20], "link": link, "count": 0, "week": 0}
        st["links"][link] = uid
    u = st["users"][uid]
    share = "https://t.me/share/url?" + urllib.parse.urlencode({"url": u["link"], "text": "بهترین کانال اخبار تکنولوژی، گیم و هوش مصنوعی 👇"})
    text = (f"سلام {u['name']} 👋\n\nاین <b>لینک دعوت اختصاصی</b> توئه:\n{u['link']}\n\n"
            f"هر کی با این لینک عضو تک‌روز بشه، برات حساب می‌شه 🎯\n"
            f"تا الان دعوت کردی: <b>{u['count']}</b> نفر\n\n"
            "🏆 هر جمعه شب، اسم برترین دعوت‌کننده‌های هفته توی کانال اعلام می‌شه.\n\n"
            "برای دیدن امتیازت هر وقت خواستی /start بزن.")
    api(token, "sendMessage", chat_id=user["id"], text=text, parse_mode="HTML", disable_web_page_preview=True,
        reply_markup={"inline_keyboard": [[{"text": "📤 ارسال لینک برای دوستان", "url": share}]]})


def joined(token, st, upd):
    new, old = upd.get("new_chat_member", {}), upd.get("old_chat_member", {})
    if new.get("status") != "member" or old.get("status") in ("member", "administrator", "creator"):
        return
    link = (upd.get("invite_link") or {}).get("invite_link")
    uid = st["links"].get(link)
    member = str(new.get("user", {}).get("id"))
    if not uid or member == uid or member in st["joined"]:
        return  # unknown link, self-invite, or someone who already counted once
    st["joined"][member] = uid
    st["users"][uid]["count"] += 1
    st["users"][uid]["week"] += 1


def leaderboard(token, st):
    now = datetime.now(TEH)
    week = now.strftime("%G-%V")
    if now.weekday() != 4 or now.hour < 20 or st["board_week"] == week:  # Friday 20:00 Tehran
        return False
    top = sorted(st["users"].values(), key=lambda u: -u["week"])[:5]
    top = [u for u in top if u["week"] > 0]
    medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"]
    lines = "\n".join(f"{medals[i]} {u['name']} - {u['week']} نفر" for i, u in enumerate(top)) or "این هفته هنوز کسی دعوت نکرده؛ اولین نفر تو باش! 😉"
    text = (f"🏆 <b>برترین دعوت‌کننده‌های این هفته‌ی تک‌روز</b>\n\n{lines}\n\n"
            "تو هم لینک اختصاصیت رو بگیر و دوستات رو دعوت کن 👇\n\n⚡ تک‌روز | @techrooz_fa")
    api(token, "sendMessage", chat_id=CHAT, text=text, parse_mode="HTML",
        reply_markup={"inline_keyboard": [[{"text": "🎁 گرفتن لینک دعوت من", "url": BOT_LINK}]]})
    for u in st["users"].values():
        u["week"] = 0
    st["board_week"] = week
    return True


def process(token):
    """One cheap pass: read new bot updates, answer /start, count joins, post the weekly board."""
    st = load(token)
    r = api(token, "getUpdates", offset=st["offset"], timeout=0,
            allowed_updates=["message", "chat_member", "channel_post", "my_chat_member"])
    changed = False
    for u in r.get("result", []):
        st["offset"] = u["update_id"] + 1; changed = True
        m = u.get("message")
        if m and m.get("chat", {}).get("type") == "private" and (m.get("text") or "").startswith("/start"):
            welcome(token, st, m["from"])
        if u.get("chat_member"):
            joined(token, st, u["chat_member"])
    if leaderboard(token, st):
        changed = True
    if changed:
        save(token, st)
    return changed
