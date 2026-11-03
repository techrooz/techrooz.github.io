"""Video radar for TechRooz: legal, ready-to-post videos for today (cheap: Claude reads ~15 lines).

Sources:
  - Steam store: official game/hardware trailers (publishers' promo material) -> HLS stream
  - NASA image & video library: public-domain space/science videos -> mp4
Usage: python3 scripts/find_videos.py
Output lines: <kind> | <title> | <video_src> | <photo> | <source page>
Put video_src into a queue item's "video_src"; the posting workflow downloads,
trims (max ~75s) and uploads it to Telegram.
"""
import json, urllib.request

UA = {"User-Agent": "Mozilla/5.0"}


def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25))


def steam():
    seen, out = set(), []
    d = get("https://store.steampowered.com/api/featuredcategories?cc=us&l=english")
    for key in ("top_sellers", "new_releases", "coming_soon"):
        for it in d.get(key, {}).get("items", [])[:6]:
            if it["id"] in seen:
                continue
            seen.add(it["id"])
            try:
                x = list(get(f"https://store.steampowered.com/api/appdetails?appids={it['id']}&cc=us&l=english").values())[0]["data"]
            except Exception:
                continue
            for m in x.get("movies", [])[:1]:
                src = m.get("hls_h264") or (m.get("mp4") or {}).get("max") or ""
                if src:
                    out.append(("steam/" + key, f"{x['name']} - {m.get('name', 'trailer')}", src, x.get("header_image", ""),
                                f"https://store.steampowered.com/app/{it['id']}"))
    return out[:8]


def nasa():
    out = []
    d = get("https://images-api.nasa.gov/search?media_type=video&year_start=2026")
    items = sorted(d["collection"]["items"], key=lambda i: i["data"][0].get("date_created", ""), reverse=True)[:6]
    for i in items:
        nid = i["data"][0]["nasa_id"]
        try:
            files = get(f"https://images-api.nasa.gov/asset/{nid}")["collection"]["items"]
        except Exception:
            continue
        mp4 = [f["href"] for f in files if f["href"].endswith("~mobile.mp4")] or [f["href"] for f in files if f["href"].endswith(".mp4")]
        thumb = next((f["href"] for f in files if f["href"].endswith(".jpg")), "")
        if mp4:
            out.append(("nasa", i["data"][0]["title"][:90], mp4[0].replace("http://", "https://"), thumb,
                        f"https://images.nasa.gov/details/{nid}"))
    return out


if __name__ == "__main__":
    for row in steam() + nasa():
        print(" | ".join(row))
