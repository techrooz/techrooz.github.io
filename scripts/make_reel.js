// Render a 9:16 TechRooz news reel (MP4) from one queue item.
// Usage: node scripts/make_reel.js <item.json> <out.mp4>
// Needs playwright (chromium) + ffmpeg. Images come from the post's source.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
const item = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), out = process.argv[3];
const strip = s => s.replace(/<[^>]+>/g, "").trim();
const lines = item.caption.split("\n").filter(l => l.trim());
const title = strip((item.caption.match(/<b>(.*?)<\/b>/) || [, lines[0]])[1]);
const body = strip(lines.slice(1).find(l => strip(l).length > 40 && !l.includes("نظر تک‌روز")) || "").slice(0, 120) + "…";
const cats = { news: "خبر", games: "گیم", ai: "هوش مصنوعی", mobile: "موبایل", iran: "تک ایران", viral: "جالب", stories: "داستان برندها", free: "رایگان" };
const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const html = `<!doctype html><meta charset=utf-8>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@500;800&display=block" rel=stylesheet>
<style>html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000;font-family:Vazirmatn;direction:ltr;color:#fff}
.top,.t,.b,.cta{direction:rtl}
.bg{position:absolute;inset:0;background:url('${item.photo}') center/cover;filter:blur(40px) brightness(.45);transform:scale(1.2)}
.img{position:absolute;top:330px;left:60px;right:60px;height:760px;border-radius:44px;background:url('${item.photo}') center/cover;box-shadow:0 40px 90px rgba(0,0,0,.6);animation:zoom 9s linear forwards}
@keyframes zoom{from{transform:scale(1)}to{transform:scale(1.06)}}
.top{position:absolute;top:120px;right:70px;left:70px;display:flex;justify-content:space-between;align-items:center;font-size:44px;font-weight:800}
.chip{font-size:34px;font-weight:500;background:#fff;color:#000;padding:10px 28px;border-radius:999px}
.t{position:absolute;top:1160px;right:70px;left:70px;font-size:70px;line-height:1.45;font-weight:800;opacity:0;animation:up .8s .3s forwards}
.b{position:absolute;top:1520px;right:70px;left:70px;font-size:38px;line-height:1.7;color:#d6d6dc;max-height:194px;overflow:hidden;opacity:0;animation:up .8s 1.4s forwards}
.cta{position:absolute;bottom:90px;right:70px;left:70px;text-align:center;font-size:40px;font-weight:800;background:#0a84ff;padding:28px;border-radius:999px;opacity:0;animation:up .6s 5.5s forwards}
@keyframes up{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}</style>
<div class=bg></div><div class=img></div>
<div class=top><span>⚡ تک‌روز</span><span class=chip>${cats[item.cat] || "خبر"}</span></div>
<div class=t>${esc(title)}</div><div class=b>${esc(body)}</div>
<div class=cta>خبرهای کامل در تلگرام · لینک در بیو</div>`;
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reel-"));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(html); await p.waitForTimeout(2500);
  await p.evaluate(() => document.getAnimations().forEach(a => a.pause()));
  const fps = 30, secs = 9;
  for (let i = 0; i < fps * secs; i++) {
    await p.evaluate(t => document.getAnimations().forEach(a => a.currentTime = t), i * 1000 / fps);
    await p.screenshot({ path: path.join(dir, `f${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 85 });
  }
  await b.close();
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(fps), "-i", path.join(dir, "f%04d.jpg"),
    "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23",
    "-c:a", "aac", "-movflags", "+faststart", out]);
  fs.rmSync(dir, { recursive: true, force: true });
})();
