// "Mob" reel: fast listicle, dark/light alternating, orange accent, UI mockups per beat (mgh.mobin-style analysis). No footage needed.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame } from "remotion";
import { loadFont as vazir } from "@remotion/google-fonts/Vazirmatn";
const V = vazir("normal", { weights: ["500", "800", "900"], subsets: ["arabic", "latin"] }).fontFamily;
const FPS = 30, CY = "#2BD0F0", VI = "#6A4CF0", DK = "#0B1026", LT = "#F2F5FF";
const GR = "linear-gradient(135deg,#7B5CFF,#14B8E6)";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FA = "۰۱۲۳۴۵۶۷۸۹";
const fa = (n: number | string) => String(n).replace(/\d/g, (d) => FA[+d]);

export type MScene = { kind: "hook" | "intro" | "item" | "warn" | "cta"; start: number; end: number; n?: number; title?: string; acc?: string; mock?: "keys" | "apps" | "agents" | "phone" | "undo"; dark?: boolean; keyword?: string };
export type MobProps = { seconds: number; scenes: MScene[] };

const useT = () => useCurrentFrame() / FPS;
const pop = (t: number, t0: number, d = 12) => (t < t0 ? 0 : spring({ frame: (t - t0) * FPS, fps: FPS, config: { damping: d, stiffness: 190 } }));
const fade = (t: number, t0: number, d = 0.25) => interpolate(t, [t0, t0 + d], [0, 1], cl);

const Grid: React.FC<{ dark: boolean }> = ({ dark }) => (
  <AbsoluteFill style={{ backgroundColor: dark ? DK : LT, backgroundImage: `linear-gradient(${dark ? "#ffffff0d" : "#0000000d"} 2px,transparent 2px),linear-gradient(90deg,${dark ? "#ffffff0d" : "#0000000d"} 2px,transparent 2px)`, backgroundSize: "90px 90px" }}>
    <AbsoluteFill style={{ background: dark ? "radial-gradient(circle at 50% 35%,#2bd0f022 0%,transparent 55%)" : "radial-gradient(circle at 50% 35%,#6a4cf018 0%,transparent 55%)" }} />
  </AbsoluteFill>
);

const Scene: React.FC<{ dark: boolean; children: React.ReactNode }> = ({ dark, children }) => {
  const t = useT();
  const y = interpolate(t, [0, 0.28], [140, 0], cl), b = interpolate(t, [0, 0.22], [20, 0], cl), s = interpolate(t, [0, 0.28], [1.12, 1], cl);
  const sw = interpolate(t, [0, 0.5], [-1700, 1700], cl);
  return (
    <AbsoluteFill style={{ fontFamily: V, direction: "rtl", ["--acc" as any]: dark ? CY : VI }}>
      <Grid dark={dark} />
      <AbsoluteFill style={{ transform: `translateY(${y}px) scale(${s})`, filter: `blur(${b}px)` }}>{children}</AbsoluteFill>
      <div style={{ position: "absolute", top: -300, left: 540 - 450, width: 900, height: 2500, transform: `translateX(${sw}px) rotate(18deg)`, background: "linear-gradient(90deg,transparent,#7B5CFFdd,#14B8E6dd,transparent)", mixBlendMode: "screen", opacity: t < 0.5 ? 1 : 0 }} />
    </AbsoluteFill>
  );
};

const Title: React.FC<{ text: string; acc?: string; dark: boolean; t0?: number; size?: number }> = ({ text, acc, dark, t0 = 0.2, size = 80 }) => {
  const t = useT();
  const words = text.split(" ");
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1340, textAlign: "center", fontSize: size, fontWeight: 900, lineHeight: 1.35, color: dark ? "#fff" : "#161616" }}>
      {words.map((w, i) => {
        const p = pop(t, t0 + i * 0.09, 14);
        return <span key={i} style={{ display: "inline-block", margin: "0 12px", transform: `translateY(${(1 - p) * 40}px) scale(${0.8 + p * 0.2})`, opacity: Math.min(1, p * 1.5), color: acc && w.includes(acc) ? CY : undefined }}>{w}</span>;
      })}
    </div>
  );
};

const Badge: React.FC<{ n: number; dark: boolean }> = ({ n, dark }) => {
  const t = useT(); const p = pop(t, 0.15);
  return (
    <div style={{ position: "absolute", top: 230, width: "100%", display: "flex", justifyContent: "center", transform: `scale(${p})` }}>
      <div style={{ background: dark ? "#1f1f1f" : "#161616", color: "#fff", borderRadius: 60, padding: "16px 44px", fontSize: 46, fontWeight: 900, display: "flex", gap: 18, alignItems: "center", border: `3px solid ${CY}` }}>
        <span style={{ color: "var(--acc)" }}>{fa("0" + n)}</span><span>مورد</span>
      </div>
    </div>
  );
};

const Box: React.FC<{ x: number; y: number; w: number; h: number; t0: number; dark: boolean; children?: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, w, h, t0, dark, children, style }) => {
  const t = useT(); const p = pop(t, t0);
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 1.6), background: dark ? "#1e1e1e" : "#fff", borderRadius: 34, boxShadow: dark ? "0 30px 70px #000a" : "0 30px 70px #00000026", border: dark ? "2px solid #ffffff18" : "2px solid #0000000f", overflow: "hidden", ...style }}>{children}</div>;
};

// ---- mockups (area ~ y 380..1100) ----
const Keys: React.FC<{ dark: boolean }> = ({ dark }) => {
  const t = useT(); const press = t > 0.5 && t < 0.9 ? 0.9 : 1;
  const txt = "پوشه‌ی دانلودم رو مرتب کن"; const n = Math.floor(interpolate(t, [1.5, 3.4], [0, txt.length], cl));
  const key = (x: number) => (
    <div style={{ position: "absolute", left: x, top: 430, width: 270, height: 270, borderRadius: 50, background: dark ? "#2a2a2a" : "#fff", border: `4px solid ${t > 0.5 ? CY : dark ? "#444" : "#ddd"}`, boxShadow: t > 0.5 ? `0 0 90px ${CY}99` : "0 20px 50px #0004", transform: `scale(${pop(t, 0.1) * press})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: dark ? "#fff" : "#111" }}>
      <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 1 }}>⌘</div><div style={{ fontSize: 34, fontWeight: 800, opacity: 0.7 }}>command</div>
    </div>);
  return (<>
    {key(215)}{key(595)}
    <Box x={90} y={820} w={900} h={150} t0={1.1} dark={dark}>
      <div style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 36px", gap: 24, direction: "rtl" }}>
        <div style={{ width: 70, height: 70, borderRadius: 35, background: GR, flexShrink: 0, boxShadow: `0 0 40px ${CY}` }}><div style={{ margin: "17px auto", width: 18, height: 36, borderRadius: 9, background: "#fff" }} /></div>
        <div style={{ fontSize: 50, fontWeight: 800, color: dark ? "#fff" : "#111" }}>{txt.slice(0, n)}<span style={{ opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: "var(--acc)" }}>|</span></div>
      </div>
    </Box>
    <div style={{ position: "absolute", top: 1010, width: "100%", display: "flex", justifyContent: "center", gap: 30 }}>
      {["تایپ", "صدا"].map((c, i) => <div key={c} style={{ transform: `scale(${pop(t, 3.4 + i * 0.25)})`, background: GR, color: "#fff", fontSize: 46, fontWeight: 900, padding: "12px 50px", borderRadius: 50 }}>{c}</div>)}
    </div>
  </>);
};

const Apps: React.FC<{ dark: boolean }> = ({ dark }) => {
  const t = useT();
  const apps = [["Mail", "#2f7cf6"], ["Calendar", "#ff453a"], ["Messages", "#30d158"], ["Files", "#ff9f0a"]];
  const files = [["IMG_2041.png", "#2f7cf6", 0], ["invoice.pdf", "#ff453a", 1], ["setup.dmg", "#8e8e93", 2], ["notes.docx", "#2f7cf6", 1], ["trip.mov", "#bf5af2", 0], ["report.xlsx", "#30d158", 1]] as const;
  const fol = ["تصاویر", "اسناد", "ویدیو"];
  return (<>
    <div style={{ position: "absolute", top: 390, width: "100%", display: "flex", justifyContent: "center", gap: 34 }}>
      {apps.map(([n, c], i) => <div key={n} style={{ width: 170, textAlign: "center", transform: `scale(${pop(t, 0.2 + i * 0.12)})` }}><div style={{ width: 150, height: 150, margin: "0 auto", borderRadius: 38, background: c, boxShadow: `0 16px 40px ${c}77` }} /><div style={{ marginTop: 10, fontSize: 30, fontWeight: 800, color: dark ? "#ddd" : "#333" }}>{n}</div></div>)}
    </div>
    <Box x={90} y={640} w={900} h={540} t0={0.9} dark={dark}>
      <div style={{ height: 70, background: dark ? "#2a2a2a" : "#eee", display: "flex", alignItems: "center", padding: "0 26px", gap: 12, direction: "ltr" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />)}
        <div style={{ marginLeft: 24, fontSize: 30, fontWeight: 800, color: dark ? "#ccc" : "#555" }}>Downloads</div>
      </div>
      {files.map(([n, c, f], i) => {
        const go = interpolate(t, [2.2 + i * 0.28, 2.7 + i * 0.28], [0, 1], cl);
        return <div key={n} style={{ margin: "14px 28px", height: 62, display: "flex", alignItems: "center", gap: 22, direction: "ltr", transform: `translateX(${go * 820}px)`, opacity: 1 - go * 0.9 }}>
          <div style={{ width: 46, height: 46, borderRadius: 11, background: c }} /><div style={{ fontSize: 36, fontWeight: 800, color: dark ? "#fff" : "#222" }}>{n}</div></div>;
      })}
    </Box>
    <div style={{ position: "absolute", top: 1220, width: "100%", display: "flex", justifyContent: "center", gap: 34 }}>
      {fol.map((f, i) => <div key={f} style={{ transform: `scale(${pop(t, 3.2 + i * 0.2)})`, background: GR, color: "#fff", fontSize: 44, fontWeight: 900, padding: "12px 42px", borderRadius: 24 }}>{f}</div>)}
    </div>
  </>);
};

const Agents: React.FC<{ dark: boolean }> = ({ dark }) => {
  const t = useT();
  const chips = [["Gemini", 0], ["ChatGPT", 1], ["Model", 2], ["Model", 3], ["Model", 4], ["Model", 5]] as const;
  const cx = 540, cy = 720, R = 290;
  const count = Math.round(interpolate(t, [0.4, 3.2], [0, 20], cl));
  return (<>
    <svg width="1080" height="1920" style={{ position: "absolute", left: 0, top: 0 }}>
      {chips.map(([, i]) => { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; const d = interpolate(t, [0.5 + i * 0.2, 1 + i * 0.2], [1, 0], cl); return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * R} y2={cy + Math.sin(a) * R} stroke={CY} strokeWidth={5} strokeDasharray="300" strokeDashoffset={300 * d} strokeLinecap="round" />; })}
    </svg>
    {chips.map(([n, i]) => { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; const p = pop(t, 0.5 + i * 0.2);
      return <div key={i} style={{ position: "absolute", left: cx + Math.cos(a) * R - 115, top: cy + Math.sin(a) * R - 50, width: 230, height: 100, borderRadius: 30, background: dark ? "#262626" : "#fff", border: `3px solid ${i < 2 ? CY : dark ? "#555" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 900, color: dark ? "#fff" : "#111", transform: `scale(${p})`, boxShadow: "0 14px 36px #0003" }}>{n}</div>; })}
    <div style={{ position: "absolute", left: cx - 120, top: cy - 120, width: 240, height: 240, borderRadius: 120, background: GR, boxShadow: `0 0 ${60 + 30 * Math.sin(t * 6)}px ${CY}`, transform: `scale(${pop(t, 0.1)})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 76, fontWeight: 900 }}>AI</div>
    <div style={{ position: "absolute", top: 1100, width: "100%", textAlign: "center", fontSize: 130, fontWeight: 900, color: "var(--acc)", direction: "ltr" }}>+{fa(count)}</div>
  </>);
};

const Phone: React.FC<{ dark: boolean }> = ({ dark }) => {
  const t = useT();
  const rows = ["گزارش هفتگی", "مرتب‌سازی فایل‌ها", "خلاصه‌ی میل‌ها"];
  return (<>
    <Box x={110} y={420} w={380} h={720} t0={0.2} dark={dark} style={{ borderRadius: 60, border: `6px solid ${dark ? "#555" : "#222"}` }}>
      <div style={{ padding: "60px 26px", display: "flex", flexDirection: "column", gap: 34 }}>
        {rows.map((r, i) => { const w = interpolate(t, [0.8 + i * 0.5, 2.4 + i * 0.5], [0, 100], cl); return <div key={r}><div style={{ fontSize: 34, fontWeight: 800, color: dark ? "#fff" : "#111", marginBottom: 12 }}>{r}</div><div style={{ height: 22, borderRadius: 11, background: dark ? "#333" : "#e4e4e4" }}><div style={{ width: `${w}%`, height: "100%", borderRadius: 11, background: w >= 100 ? "#30d158" : CY }} /></div></div>; })}
      </div>
    </Box>
    <Box x={560} y={620} w={420} h={170} t0={0.5} dark={dark} style={{ borderRadius: 40, background: "linear-gradient(135deg,#e8e8ed,#b9b9c0)" }}>
      <div style={{ width: 14, height: 14, borderRadius: 7, background: "#30d158", margin: "100px auto 0", boxShadow: "0 0 18px #30d158" }} />
    </Box>
    <div style={{ position: "absolute", left: 560, width: 420, top: 830, textAlign: "center", fontSize: 150, fontWeight: 900, color: "var(--acc)", direction: "ltr", transform: `scale(${pop(t, 1.2)})` }}>24/7</div>
    <div style={{ position: "absolute", left: 560, width: 420, top: 1010, textAlign: "center", fontSize: 44, fontWeight: 800, color: dark ? "#ddd" : "#333", opacity: fade(t, 1.6) }}>Mac mini</div>
  </>);
};

const Undo: React.FC<{ dark: boolean }> = ({ dark }) => {
  const t = useT();
  const rows = ["۲۴ فایل جابه‌جا شد", "۸ فایل تغییر نام داد", "پیش‌نویس میل ساخت"];
  return (<>
    {rows.map((r, i) => <Box key={r} x={90} y={400 + i * 170} w={900} h={140} t0={0.2 + i * 0.3} dark={dark}>
      <div style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 34px", gap: 26 }}>
        <div style={{ width: 62, height: 62, borderRadius: 31, background: "#30d158", color: "#fff", fontSize: 40, fontWeight: 900, textAlign: "center", lineHeight: "62px" }}>✓</div>
        <div style={{ flex: 1, fontSize: 44, fontWeight: 800, color: dark ? "#fff" : "#111" }}>{r}</div>
        <div style={{ border: `3px solid ${CY}`, color: "var(--acc)", borderRadius: 40, padding: "8px 28px", fontSize: 36, fontWeight: 900, transform: `scale(${1 + 0.08 * Math.sin(t * 5 + i)})` }}>برگردون</div>
      </div></Box>)}
    <div style={{ position: "absolute", left: 540 - 105, top: 920, width: 210, height: 210, borderRadius: 105, background: "#e5322d", transform: `scale(${pop(t, 1.6) * (1 + 0.05 * Math.sin(t * 8))})`, boxShadow: `0 0 ${70 + 30 * Math.sin(t * 8)}px #e5322d`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 52, fontWeight: 900, border: "10px solid #ffffff55" }}>STOP</div>
  </>);
};

const MOCK = { keys: Keys, apps: Apps, agents: Agents, phone: Phone, undo: Undo };

const Item: React.FC<{ s: MScene }> = ({ s }) => {
  const dark = !!s.dark, M = MOCK[s.mock!];
  return (<Scene dark={dark}><Badge n={s.n!} dark={dark} /><M dark={dark} /><Title text={s.title!} acc={s.acc} dark={dark} /></Scene>);
};

const Hook: React.FC<{ s: MScene }> = ({ s }) => {
  const t = useT();
  const files = ["IMG_2041.png", "invoice.pdf", "setup.dmg", "trip.mov", "notes.docx"];
  return (<Scene dark>
    <div style={{ position: "absolute", top: 330, width: "100%", textAlign: "center", fontSize: 330, fontWeight: 900, color: "var(--acc)", direction: "ltr", transform: `scale(${pop(t, 0.2, 9)})`, textShadow: `0 0 90px ${CY}88` }}>$20</div>
    <div style={{ position: "absolute", top: 690, width: "100%", textAlign: "center", fontSize: 80, fontWeight: 900, color: "#fff", opacity: fade(t, 0.9) }}>ماهی</div>
    {t > 2.3 && <Box x={140} y={860} w={800} h={430} t0={2.4} dark>
      <div style={{ padding: 24 }}>{files.map((f, i) => { const go = interpolate(t, [4 + i * 0.25, 4.5 + i * 0.25], [0, 1], cl); return <div key={f} style={{ height: 66, display: "flex", alignItems: "center", gap: 22, direction: "ltr", fontSize: 38, fontWeight: 800, color: "#fff", transform: `translateX(${go * 760}px)`, opacity: 1 - go }}><div style={{ width: 44, height: 44, borderRadius: 11, background: i % 2 ? CY : "#2f7cf6" }} />{f}</div>; })}</div>
    </Box>}
    {t > 5.6 && <div style={{ position: "absolute", top: 1380, width: "100%", display: "flex", justifyContent: "center", gap: 22 }}>{[1, 2, 3, 4, 5].map((n) => <div key={n} style={{ width: 150, height: 150, borderRadius: 34, background: n === 5 ? CY : "#242424", border: `3px solid ${n === 5 ? "#fff" : "#444"}`, color: "#fff", fontSize: 80, fontWeight: 900, textAlign: "center", lineHeight: "150px", transform: `scale(${pop(t, 5.6 + n * 0.22)})` }}>{fa(n)}</div>)}</div>}
  </Scene>);
};

const Intro: React.FC<{ s: MScene }> = () => {
  const t = useT();
  return (<Scene dark={false}>
    <div style={{ position: "absolute", top: 520, width: "100%", textAlign: "center", direction: "ltr", fontSize: 130, fontWeight: 900, color: "#161616", lineHeight: 1.1, transform: `scale(${0.8 + 0.2 * pop(t, 0.15)})`, opacity: fade(t, 0.1) }}>Perplexity<br /><span style={{ color: "var(--acc)" }}>Personal</span><br />Computer</div>
    <div style={{ position: "absolute", top: 1130, width: "100%", textAlign: "center", fontSize: 76, fontWeight: 900, color: "#161616", opacity: fade(t, 1.0) }}>این <span style={{ color: "var(--acc)" }}>۵ تا</span> کارش رو ببین</div>
  </Scene>);
};

const Warn: React.FC<{ s: MScene }> = () => {
  const t = useT();
  return (<Scene dark>
    <Box x={90} y={470} w={380} h={300} t0={0.2} dark><div style={{ textAlign: "center", paddingTop: 70, color: "#fff", fontSize: 64, fontWeight: 900 }}>Mac<div style={{ fontSize: 34, color: "#ffffff99", marginTop: 8 }}>macOS 14+</div></div></Box>
    <Box x={610} y={470} w={380} h={300} t0={0.9} dark style={{ border: `3px solid ${CY}` }}><div style={{ textAlign: "center", paddingTop: 50, color: "var(--acc)", fontSize: 130 }}>☁</div><div style={{ textAlign: "center", color: "#fff", fontSize: 29, fontWeight: 800, whiteSpace: "nowrap" }}>سرورهای پرپلکسیتی</div></Box>
    <svg width="1080" height="1920" style={{ position: "absolute", left: 0, top: 0 }}><line x1="470" y1="620" x2="610" y2="620" stroke={CY} strokeWidth="8" strokeDasharray="16 14" strokeDashoffset={-t * 120} /></svg>
    <div style={{ position: "absolute", top: 860, width: "100%", textAlign: "center", fontSize: 190, fontWeight: 900, color: "var(--acc)", transform: `scale(${pop(t, 1.6)})` }}>مغز اینجاست</div>
    <Title text="فقط مک؛ مغزش توی سرور" acc="سرور" dark t0={2.4} size={78} />
  </Scene>);
};

const Cta: React.FC<{ s: MScene }> = ({ s }) => {
  const t = useT(); const kw = s.keyword || "";
  const n = Math.floor(interpolate(t, [0.8, 1.9], [0, kw.length], cl));
  return (<Scene dark>
    <Box x={140} y={420} w={800} h={560} t0={0.15} dark>
      <div style={{ padding: 40 }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: "#ffffff88" }}>@techrooz.fa</div>
        <div style={{ marginTop: 40, height: 120, borderRadius: 60, background: "#2a2a2a", display: "flex", alignItems: "center", padding: "0 40px", fontSize: 56, fontWeight: 900, color: "#fff", justifyContent: "space-between" }}>
          <div>{kw.slice(0, n)}<span style={{ color: "var(--acc)", opacity: Math.floor(t * 3) % 2 }}>|</span></div>
          <div style={{ width: 80, height: 80, borderRadius: 40, background: GR, color: "#fff", textAlign: "center", lineHeight: "80px", transform: `scale(${t > 2 ? 0.88 : 1})` }}>↑</div>
        </div>
        <div style={{ marginTop: 44, fontSize: 56, fontWeight: 900, color: "#30d158", opacity: fade(t, 2.2) }}>✓ ارسال شد</div>
      </div>
    </Box>
    <div style={{ position: "absolute", top: 1070, width: "100%", textAlign: "center", fontSize: 84, fontWeight: 900, color: "#fff", opacity: fade(t, 0.4) }}>کامنت کن: <span style={{ color: "var(--acc)" }}>«{kw}»</span></div>
    <div style={{ position: "absolute", top: 1230, width: "100%", textAlign: "center", fontSize: 50, fontWeight: 800, color: "#ffffffaa", opacity: fade(t, 1.2) }}>تا نظرِ کامل تک‌روز رو برات بفرستم</div>
  </Scene>);
};

const Brand: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame(); const t = f / FPS;
  return (<>
    <div style={{ position: "absolute", left: 60, top: 235, display: "flex", alignItems: "center", gap: 14, direction: "rtl", fontFamily: V }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: GR, color: "#fff", fontWeight: 900, fontSize: 34, textAlign: "center", lineHeight: "64px", boxShadow: "0 8px 24px #14B8E688" }}>AI</div>
      <div style={{ fontWeight: 900, fontSize: 44, color: "#fff", mixBlendMode: "difference" }}>تک‌روز</div>
    </div>
    <div style={{ position: "absolute", left: 60, right: 60, top: 205, height: 6, borderRadius: 3, background: "#7f7f7f33" }}><div style={{ width: `${Math.min(100, (t / total) * 100)}%`, height: "100%", borderRadius: 3, background: GR }} /></div>
  </>);
};

const EndCard: React.FC<{ start: number }> = ({ start }) => {
  const t = useCurrentFrame() / FPS - start; if (t < 0) return null;
  const p = pop(t, 0.1, 11), o = fade(t, 0, 0.2);
  return (<AbsoluteFill style={{ background: DK, opacity: o, fontFamily: V, direction: "rtl", alignItems: "center", justifyContent: "center" }}>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%,#6a4cf044,transparent 60%)" }} />
    <div style={{ transform: `scale(${0.7 + 0.3 * p})`, textAlign: "center" }}>
      <div style={{ width: 260, height: 260, margin: "0 auto", borderRadius: 70, background: GR, color: "#fff", fontWeight: 900, fontSize: 140, lineHeight: "260px", boxShadow: "0 0 120px #14B8E6aa" }}>AI</div>
      <div style={{ marginTop: 50, fontSize: 200, fontWeight: 900, color: "#fff", lineHeight: 1 }}>تک‌روز</div>
      <div style={{ marginTop: 26, fontSize: 52, fontWeight: 800, color: "#ffffffaa", opacity: fade(t, 0.5) }}>هوش مصنوعی و تکنولوژی</div>
      <div style={{ marginTop: 18, fontSize: 46, fontWeight: 800, color: CY, direction: "ltr", opacity: fade(t, 0.7) }}>@techrooz.fa</div>
    </div>
  </AbsoluteFill>);
};

export const Mob: React.FC<MobProps> = ({ scenes, seconds }) => (
  <AbsoluteFill style={{ backgroundColor: DK }}>
    {scenes.map((s, i) => (
      <Sequence key={i} from={Math.round(s.start * FPS)} durationInFrames={Math.max(1, Math.round((s.end - s.start) * FPS))}>
        {s.kind === "hook" ? <Hook s={s} /> : s.kind === "intro" ? <Intro s={s} /> : s.kind === "item" ? <Item s={s} /> : s.kind === "warn" ? <Warn s={s} /> : <Cta s={s} />}
      </Sequence>
    ))}
    <Brand total={seconds} />
    <EndCard start={seconds - 1.9} />
  </AbsoluteFill>
);
