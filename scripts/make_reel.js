// Kinetic-typography 9:16 reel renderer (scenes synced to the voice-over).
// Usage: node scripts/make_reel.js <spec.json> <out.mp4>
// spec: {scenes:[{text,start,dur}], photos:[url], cat, seconds}
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
const S = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), out = process.argv[3];
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ACC = "#ff2d3d", T = S.seconds, OUT = 2.6;
const cats = { news: "خبر", games: "گیم", ai: "هوش مصنوعی", mobile: "موبایل", iran: "تک ایران", viral: "جالب", stories: "داستان برندها", free: "رایگان", digest: "خلاصه" };
const photo = i => S.photos.length ? S.photos[i % S.photos.length] : "";
// layouts rotate so every few seconds the screen looks different
const LAYOUTS = ["dark", "phone", "light", "big", "grid", "phone", "red", "light"];
function words(text, start, dur) {
  const ws = text.split(/\s+/), step = Math.min(0.32, (dur * 0.6) / ws.length);
  return ws.map((w, i) => {
    const em = /^\*.*\*[.!؟,،]*$/.test(w) || /\*/.test(w);
    const clean = w.replace(/\*/g, "");
    return `<span class="w${em ? " em" : ""}" style="animation-delay:${(start + 0.05 + i * step).toFixed(2)}s">${esc(clean)}</span>`;
  }).join(" ");
}
const ICONS = { ai: ["🤖", "🧠", "⚡", "💬"], games: ["🎮", "🕹", "👾", "🏆"], mobile: ["📱", "🔋", "📸", "⚡"], iran: ["📶", "📱", "💰", "🇮🇷"],
  news: ["🔥", "📰", "⚡", "👀"], viral: ["😲", "🔥", "👀", "✨"], free: ["🆓", "🎁", "💸", "🔥"] };
function floaters(i, start) {
  const set = ICONS[S.cat] || ICONS.news;
  return [0, 1, 2].map(k => `<div class="fl" style="top:${[260, 980, 1500][k] + (i * 37 % 90)}px;${k % 2 ? "left" : "right"}:${60 + (i * 53 + k * 90) % 160}px;animation-delay:${(start + k * 0.25).toFixed(2)}s">${set[(i + k) % set.length]}</div>`).join("");
}
const scenes = S.scenes.map((sc, i) => {
  const L = i === 0 ? "hook" : LAYOUTS[(i - 1) % LAYOUTS.length];
  const end = sc.start + sc.dur, num = (sc.text.match(/^[۰-۹0-9]+/) || [""])[0];
  const media = (L === "phone" && photo(i)) ? `<div class="phone"><div class="screen" style="background-image:url('${photo(i)}')"></div></div>`
    : (L === "big" && photo(i)) ? `<div class="hero" style="background-image:url('${photo(i)}')"></div>` : "";
  const IN = ["in", "slideR", "whip", "circle", "slideU", "in"][i % 6];
  const pos = ["50% 30%", "20% 50%", "80% 40%", "50% 70%"][i % 4];
  return `<section class="sc ${L}" style="--pos:${pos};animation:${IN} .5s ${sc.start.toFixed(2)}s both,outs .3s ${(end - 0.15).toFixed(2)}s forwards">
    ${floaters(i, sc.start)}
    <div class="deco"></div>${media}${num ? `<div class="num">#${esc(num)}</div>` : ""}
    <div class="txt">${words(sc.text.replace(/^[۰-۹0-9]+[.)-]?\s*/, ""), sc.start, sc.dur)}</div></section>`;
}).join("");
const html = `<!doctype html><meta charset=utf-8>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=block" rel=stylesheet>
<style>
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#0b0b0d;font-family:Vazirmatn;direction:ltr}
.sc{position:absolute;inset:0;opacity:0;overflow:hidden}
@keyframes in{0%{opacity:0;transform:scale(1.12);filter:blur(10px)}100%{opacity:1;transform:none;filter:none}}
@keyframes outs{to{opacity:0;transform:scale(.94)}}
@keyframes slideR{from{opacity:0;transform:translateX(-1080px)}to{opacity:1;transform:none}}
@keyframes slideU{from{opacity:0;transform:translateY(600px)}to{opacity:1;transform:none}}
@keyframes whip{from{opacity:0;transform:rotate(-12deg) scale(1.3);filter:blur(16px)}to{opacity:1;transform:none;filter:none}}
@keyframes circle{from{clip-path:circle(0% at 50% 50%);opacity:1}to{clip-path:circle(150% at 50% 50%);opacity:1}}
.fl{position:absolute;font-size:110px;opacity:0;z-index:3;animation:flt 3.5s both;filter:drop-shadow(0 12px 24px rgba(0,0,0,.4))}
@keyframes flt{0%{opacity:0;transform:scale(0) rotate(-30deg)}15%{opacity:1;transform:scale(1.15) rotate(8deg)}25%{transform:scale(1) rotate(0)}100%{opacity:1;transform:translateY(-60px) rotate(10deg)}}
.txt{position:absolute;left:80px;right:80px;direction:rtl;text-align:right;font-weight:700;line-height:1.35}
.w{display:inline-block;opacity:0;animation:wi .4s cubic-bezier(.2,1.5,.4,1) both;margin-left:14px}
.w.em{font-weight:900;color:#fff;font-size:1.5em;padding:0 18px;border-radius:18px;
 background:linear-gradient(${ACC},${ACC}) no-repeat right/0% 100%;animation:wi .4s cubic-bezier(.2,1.5,.4,1) both,mark .45s both;animation-delay:inherit}
.light .w.em{color:#fff}
@keyframes mark{to{background-size:100% 100%}}
@keyframes wi{from{opacity:0;transform:translateY(60px) rotate(-4deg) scale(.7)}to{opacity:1;transform:none}}
.deco{position:absolute;inset:0}
/* hook */
.hook{background:radial-gradient(circle at 50% 45%,#2a0006,#000 70%);color:#fff}
.hook .txt{top:700px;font-size:120px;text-align:center;font-weight:900;text-shadow:6px 0 #ff2d3d,-6px 0 #00e5ff;animation:gl .6s steps(2) 3}
@keyframes gl{50%{transform:translateX(8px) skewX(-6deg)}}
.hook .deco{background:repeating-linear-gradient(0deg,transparent 0 119px,rgba(255,255,255,.05) 119px 120px)}
/* dark with ruler + curve */
.dark{background:#0d0d10;color:#fff}.dark .txt{top:760px;font-size:84px}
.dark .deco{background:linear-gradient(90deg,transparent 60px,rgba(255,255,255,.12) 60px 62px,transparent 62px),repeating-linear-gradient(0deg,transparent 0 47px,rgba(255,255,255,.18) 47px 49px) left/40px 100% no-repeat}
/* light paper */
.light{background:#f4f4f2;color:#111}.light .txt{top:820px;font-size:88px}
.light .deco{background-image:linear-gradient(rgba(0,0,0,.06) 2px,transparent 2px),linear-gradient(90deg,rgba(0,0,0,.06) 2px,transparent 2px);background-size:120px 120px}
/* grid */
.grid{background:#151518;color:#fff}.grid .txt{top:1260px;font-size:76px}
.grid .deco{background-image:linear-gradient(rgba(255,255,255,.08) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.08) 2px,transparent 2px);background-size:270px 270px}
/* red */
.red{background:${ACC};color:#fff}.red .txt{top:760px;font-size:96px;font-weight:900}.red .w.em{color:#000}
/* big photo */
.big{background:#000;color:#fff}.big .txt{top:1380px;font-size:78px}
.hero{position:absolute;inset:0 0 560px 0;background:var(--pos)/cover;animation:kb 8s linear both;mask-image:linear-gradient(#000 70%,transparent)}
@keyframes kb{from{transform:scale(1.02)}to{transform:scale(1.15)}}
/* phone mockup */
.phone{position:absolute;top:170px;left:250px;width:580px;height:1060px;border-radius:80px;background:#111;border:14px solid #2b2b30;box-shadow:0 50px 120px rgba(0,0,0,.6);animation:ph .7s cubic-bezier(.2,1.4,.4,1) both,float 4s ease-in-out infinite}
.screen{position:absolute;inset:18px;border-radius:60px;background:center/cover;animation:kb 8s linear both}
@keyframes ph{from{transform:translateY(500px) rotate(8deg)}to{transform:none}}
@keyframes float{50%{transform:translateY(-16px) rotate(-1deg)}}
.phone~.txt{top:1330px;font-size:72px}
.sc.phone{background:radial-gradient(circle at 50% 30%,#2b2b33,#09090b 70%);color:#fff}
.num{position:absolute;top:180px;right:80px;font-size:220px;font-weight:900;color:transparent;-webkit-text-stroke:5px currentColor;opacity:.9}
/* frame chrome */
.top{position:absolute;top:70px;left:80px;right:80px;display:flex;justify-content:space-between;direction:rtl;font-size:42px;font-weight:900;z-index:5;mix-blend-mode:difference;color:#fff}
.chip{font-size:30px;border:3px solid #fff;padding:6px 24px;border-radius:999px;font-weight:700}
.bar{position:absolute;bottom:0;right:0;height:14px;background:${ACC};z-index:6;animation:bar ${T}s linear both}
@keyframes bar{from{width:0}to{width:100%}}
.outro{position:absolute;inset:0;display:grid;place-items:center;background:#000;color:#fff;text-align:center;opacity:0;z-index:8;animation:fo .5s ${(T - OUT).toFixed(2)}s forwards}
.outro b{display:block;font-size:170px;font-weight:900}.outro i{display:block;font-style:normal;font-size:52px;margin:10px 0 40px;color:#bbb}
.outro span{font-size:70px;font-weight:900;background:${ACC};padding:18px 56px;border-radius:999px}
@keyframes fo{to{opacity:1}}
</style>
${scenes}
<div class=top><span>⚡ تک‌روز</span><span class=chip>${cats[S.cat] || "خبر"}</span></div>
<div class=bar></div>
<div class=outro><div><b>⚡ تک‌روز</b><i>هر روز داغ‌ترین خبرهای تکنولوژی</i><span dir=ltr>@techrooz_fa</span></div></div>`;
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reel-"));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(html); await p.waitForTimeout(3000);
  await p.evaluate(() => document.getAnimations().forEach(a => a.pause()));
  const fps = 24;
  for (let i = 0; i < Math.ceil(fps * T); i++) {
    await p.evaluate(t => document.getAnimations().forEach(a => a.currentTime = t), i * 1000 / fps);
    await p.screenshot({ path: path.join(dir, `f${String(i).padStart(5, "0")}.jpg`), type: "jpeg", quality: 82 });
  }
  await b.close();
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(fps), "-i", path.join(dir, "f%05d.jpg"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-movflags", "+faststart", out]);
  fs.rmSync(dir, { recursive: true, force: true });
})();
