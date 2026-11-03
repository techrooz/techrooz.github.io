// Render the visual track of a 9:16 TechRooz reel.
// Usage: node scripts/make_reel.js <spec.json> <out_video.mp4>
// spec: {photo, cat, hook, title, body, seconds}
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
const s = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), out = process.argv[3];
const esc = t => String(t).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const cats = { news: "خبر", games: "گیم", ai: "هوش مصنوعی", mobile: "موبایل", iran: "تک ایران", viral: "جالب", stories: "داستان برندها", free: "رایگان", digest: "خلاصه" };
const T = s.seconds, HOOK = 1.8, CTA = 2.6, MAIN = T - HOOK - CTA;
const words = s.title.split(/\s+/);
const wordSpans = words.map((w, i) => `<span style="animation-delay:${(HOOK + 0.15 + i * Math.min(0.28, (MAIN * 0.55) / words.length)).toFixed(2)}s">${esc(w)}</span>`).join(" ");
const html = `<!doctype html><meta charset=utf-8>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@500;800;900&display=block" rel=stylesheet>
<style>
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000;font-family:Vazirmatn;color:#fff;direction:ltr}
.rtl{direction:rtl}
.scene{position:absolute;inset:0}
/* hook */
.hook{display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#1d4ed8,#000 70%);animation:hide 0s ${HOOK}s forwards}
.hook div{font-size:118px;font-weight:900;text-align:center;line-height:1.35;padding:0 70px;animation:punch .45s cubic-bezier(.2,1.6,.4,1) both,shake .5s .45s 2}
@keyframes punch{from{transform:scale(1.8);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes shake{25%{transform:translateX(-10px) rotate(-1deg)}75%{transform:translateX(10px) rotate(1deg)}}
.flash{background:#fff;opacity:0;animation:flash .35s ${HOOK - 0.1}s}
@keyframes flash{0%{opacity:0}30%{opacity:.85}100%{opacity:0}}
/* main */
.main{opacity:0;animation:show 0s ${HOOK}s forwards}
.bg{position:absolute;inset:-80px;background:url('${s.photo}') center/cover;filter:blur(46px) brightness(.4)}
.img{position:absolute;top:300px;left:60px;right:60px;height:800px;border-radius:46px;background:url('${s.photo}') center/cover;
 box-shadow:0 40px 100px rgba(0,0,0,.7);animation:kb ${MAIN + 1}s ${HOOK}s linear both,pop .5s ${HOOK}s cubic-bezier(.2,1.4,.4,1) both}
@keyframes kb{from{background-size:112%}to{background-size:128%}}
@keyframes pop{from{transform:translateY(140px) scale(.9);opacity:0}to{transform:none;opacity:1}}
.top{position:absolute;top:110px;right:70px;left:70px;display:flex;justify-content:space-between;align-items:center;font-size:46px;font-weight:900}
.chip{font-size:34px;font-weight:800;background:#0a84ff;padding:10px 30px;border-radius:999px}
.bar{position:absolute;top:0;right:0;height:12px;background:#0a84ff;animation:bar ${T}s linear both}
@keyframes bar{from{width:0}to{width:100%}}
.t{position:absolute;top:1170px;right:70px;left:70px;font-size:74px;line-height:1.42;font-weight:900}
.t span{display:inline-block;opacity:0;animation:w .35s both}
@keyframes w{from{opacity:0;transform:translateY(30px) scale(.9);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
.b{position:absolute;top:1560px;right:70px;left:70px;font-size:40px;line-height:1.7;color:#d1d5db;max-height:205px;overflow:hidden;opacity:0;
 animation:fade .6s ${(HOOK + MAIN * 0.6).toFixed(2)}s both}
@keyframes fade{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
/* cta */
.cta{display:grid;place-items:center;text-align:center;background:linear-gradient(160deg,#0a84ff,#000 75%);opacity:0;animation:fadein .4s ${T - CTA}s forwards}
.cta .l{font-size:150px;font-weight:900}.cta .s{font-size:52px;font-weight:800;margin-top:10px}.cta .h{font-size:64px;font-weight:900;margin-top:40px;background:#fff;color:#000;padding:18px 50px;border-radius:999px}
@keyframes fadein{to{opacity:1}} @keyframes hide{to{opacity:0}} @keyframes show{to{opacity:1}}
</style>
<div class="scene main"><div class=bg></div><div class=img></div>
 <div class="top rtl"><span>⚡ تک‌روز</span><span class=chip>${cats[s.cat] || "خبر"}</span></div>
 <div class="t rtl">${wordSpans}</div><div class="b rtl">${esc(s.body)}</div></div>
<div class="scene hook rtl"><div>${esc(s.hook)}</div></div>
<div class="scene flash"></div>
<div class="scene cta rtl"><div><div class=l>⚡ تک‌روز</div><div class=s>خبرهای کامل هر روز در تلگرام</div><div class=h dir=ltr>@techrooz_fa</div></div></div>
<div class=bar></div>`;
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reel-"));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(html); await p.waitForTimeout(2500);
  await p.evaluate(() => document.getAnimations().forEach(a => a.pause()));
  const fps = 30;
  for (let i = 0; i < Math.ceil(fps * T); i++) {
    await p.evaluate(t => document.getAnimations().forEach(a => a.currentTime = t), i * 1000 / fps);
    await p.screenshot({ path: path.join(dir, `f${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 85 });
  }
  await b.close();
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(fps), "-i", path.join(dir, "f%04d.jpg"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-movflags", "+faststart", out]);
  fs.rmSync(dir, { recursive: true, force: true });
})();
