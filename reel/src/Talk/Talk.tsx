import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, Easing } from "remotion";
import { V } from "../fontLocal";
import { OFF, NFR, CHUNKS, SEGS, Seg } from "./data";

const FPS = 30;
const CY = "#19c9ff", OR = "#ff7a1a", INK = "#0e1116";
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const prog = (t: number, a: number, d = 0.35) => ease(clamp((t - a) / d));
const pop = (f: number, t0: number) => spring({ frame: f - t0 * FPS, fps: FPS, config: { damping: 11, stiffness: 150, mass: 0.7 } });

// ---------- backgrounds ----------
type Th = Seg["th"];
const THEME: Record<Th, { base: string; b1: string; b2: string; b3: string; dot: string; rim: string }> = {
  A: { base: "linear-gradient(165deg,#070b12 0%,#0c1a2c 55%,#0e1116 100%)", b1: "rgba(25,201,255,.55)", b2: "rgba(255,122,26,.42)", b3: "rgba(25,201,255,.25)", dot: "rgba(255,255,255,.06)", rim: "drop-shadow(0 0 10px rgba(25,201,255,.55)) drop-shadow(0 0 34px rgba(25,201,255,.28))" },
  B: { base: "linear-gradient(165deg,#fbf9f4 0%,#eef2f7 60%,#e3ebf3 100%)", b1: "rgba(25,201,255,.38)", b2: "rgba(255,122,26,.34)", b3: "rgba(255,190,120,.3)", dot: "rgba(14,17,22,.09)", rim: "drop-shadow(0 18px 28px rgba(14,17,22,.28))" },
  C: { base: "linear-gradient(170deg,#04161d 0%,#08303c 60%,#0b2530 100%)", b1: "rgba(25,201,255,.5)", b2: "rgba(40,255,200,.22)", b3: "rgba(255,122,26,.25)", dot: "rgba(255,255,255,.06)", rim: "drop-shadow(0 0 10px rgba(25,201,255,.6)) drop-shadow(0 0 36px rgba(25,201,255,.3))" },
  D: { base: "linear-gradient(170deg,#140a06 0%,#2a1409 55%,#190c07 100%)", b1: "rgba(255,122,26,.55)", b2: "rgba(255,70,30,.3)", b3: "rgba(25,201,255,.2)", dot: "rgba(255,255,255,.05)", rim: "drop-shadow(0 0 10px rgba(255,140,50,.6)) drop-shadow(0 0 34px rgba(255,122,26,.3))" },
  E: { base: "linear-gradient(165deg,#19c9ff 0%,#0d8fc0 55%,#09628a 100%)", b1: "rgba(255,255,255,.55)", b2: "rgba(255,122,26,.5)", b3: "rgba(255,255,255,.25)", dot: "rgba(255,255,255,.12)", rim: "drop-shadow(0 0 12px rgba(255,255,255,.55)) drop-shadow(0 0 38px rgba(255,122,26,.35))" },
};
const Bg: React.FC<{ th: Th; f: number }> = ({ th, f }) => {
  const c = THEME[th];
  const s = (k: number, p = 0) => Math.sin(f / k + p);
  const blob = (x: number, y: number, r: number, col: string) => (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", background: `radial-gradient(circle, ${col} 0%, transparent 68%)` }} />
  );
  return (
    <AbsoluteFill style={{ background: c.base }}>
      {blob(180 + 90 * s(70), 330 + 70 * s(55, 1), 620, c.b1)}
      {blob(930 + 80 * s(60, 2), 1300 + 100 * s(75), 700, c.b2)}
      {blob(540 + 160 * s(90, 4), 900 + 120 * s(65, 3), 520, c.b3)}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${c.dot} 2.5px, transparent 3px)`, backgroundSize: "54px 54px", backgroundPosition: `${(f * 0.3) % 54}px ${(f * 0.2) % 54}px` }} />
      {/* light leaks */}
      <div style={{ position: "absolute", left: -400 + ((f * 5) % 2200), top: -200, width: 260, height: 2400, transform: "rotate(18deg)", background: "linear-gradient(90deg,transparent,rgba(255,200,140,.16),transparent)", mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", left: 1500 - ((f * 3.2) % 2300), top: -300, width: 180, height: 2400, transform: "rotate(18deg)", background: "linear-gradient(90deg,transparent,rgba(120,220,255,.14),transparent)", mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

// ---------- camera ----------
const state = (sg: Seg, t: number) => {
  const k = clamp((t - sg.t0) / (sg.t1 - sg.t0));
  const e = k * k * (3 - 2 * k) * 0.0 + k;
  return { s: sg.s0 + (sg.s1 - sg.s0) * e, x: sg.x, y: sg.y };
};
const camera = (t: number, f: number) => {
  let i = SEGS.findIndex((s) => t >= s.t0 && t < s.t1);
  if (i < 0) i = SEGS.length - 1;
  const sg = SEGS[i];
  let st = state(sg, t);
  if (sg.mv && i > 0) {
    const prev = state(SEGS[i - 1], SEGS[i - 1].t1);
    const k = ease(clamp((f - sg.t0 * FPS) / sg.mv));
    st = { s: prev.s + (st.s - prev.s) * k, x: prev.x + (st.x - prev.x) * k, y: prev.y + (st.y - prev.y) * k };
  }
  return { st, i, sg };
};

// ---------- text helpers ----------
const Neon: React.FC<{ f: number; t0: number; t1: number; text: string; col: string; size: number; top: number; rot?: number; left?: number }> = ({ f, t0, t1, text, col, size, top, rot = -3, left = 540 }) => {
  const t = f / FPS;
  if (t < t0 || t > t1) return null;
  const sc = pop(f, t0);
  const out = clamp((t1 - t) / 0.2);
  const words = text.split(" ");
  const flick = 0.85 + 0.15 * Math.sin(f * 0.9);
  return (
    <div style={{ position: "absolute", left, top, transform: `translateX(-50%) rotate(${rot}deg) scale(${sc * (0.9 + 0.1 * out)})`, opacity: out, direction: "rtl", fontFamily: V, fontWeight: 900, fontSize: size, color: "#fff", whiteSpace: "nowrap", textAlign: "center", lineHeight: 1.15,
      textShadow: `0 0 6px #fff, 0 0 18px ${col}, 0 0 40px ${col}, 0 0 90px ${col}`, filter: `brightness(${flick})` }}>
      {words.map((w, i) => <span key={i} style={{ display: "inline-block", margin: "0 .12em" }}>{w}</span>)}
    </div>
  );
};
const Pill: React.FC<{ f: number; t0: number; t1: number; text: string; col?: string; top: number; dark?: boolean }> = ({ f, t0, t1, text, col = OR, top, dark }) => {
  const t = f / FPS;
  if (t < t0 || t > t1) return null;
  const k = prog(t, t0, 0.4) * clamp((t1 - t) / 0.25);
  return (
    <div style={{ position: "absolute", left: 540, top, transform: `translateX(-50%) translateY(${(1 - k) * -40}px)`, opacity: k, direction: "rtl", fontFamily: V, fontWeight: 900, fontSize: 50, color: "#fff", background: col, padding: "6px 38px 12px", borderRadius: 60, whiteSpace: "nowrap", boxShadow: `0 10px 40px ${col}88` }}>
      {text.split(" ").map((w, i) => <span key={i} style={{ display: "inline-block", margin: "0 .12em" }}>{w}</span>)}
    </div>
  );
};

// ---------- icons (line style) ----------
const Ic: React.FC<{ d: string; size?: number; col?: string; sw?: number; style?: React.CSSProperties }> = ({ d, size = 90, col = "#fff", sw = 5, style }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}><path d={d} /></svg>
);
const P = {
  bubble: "M10 14h44a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H30l-12 10V44h-8a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z",
  check: "M12 34l14 14 26-30",
  cross: "M16 16l32 32M48 16L16 48",
  star: "M32 6l7.5 16.5 18 2-13.5 12 4 17.5L32 44.5 16 54l4-17.5-13.5-12 18-2z",
  person: "M32 30a11 11 0 1 0 0-22 11 11 0 0 0 0 22zM10 58c0-13 10-20 22-20s22 7 22 20",
  loop: "M52 24a22 22 0 1 0 2 14M52 8v16H36",
  card: "M8 14h48a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4zM14 26h14M14 36h10M40 26a6 6 0 1 0 0 .01",
  stop: "M20 8h24l12 12v24L44 56H20L8 44V20z",
  spark: "M32 6v14M32 44v14M6 32h14M44 32h14M15 15l9 9M40 40l9 9M49 15l-9 9M24 40l-9 9",
  msg: "M8 12h48v32H24L12 54V44H8z",
};
const Lines: React.FC<{ n: number; col: string; w?: number[]; h?: number; gap?: number; k: number }> = ({ n, col, w = [1, .85, .95, .6, .8], h = 14, gap = 16, k }) => (
  <div style={{ display: "flex", flexDirection: "column", gap, alignItems: "flex-end" }}>
    {Array.from({ length: n }).map((_, i) => <div key={i} style={{ width: `${(w[i % w.length] * 100) * clamp(k * n - i, 0, 1)}%`, height: h, borderRadius: h, background: col }} />)}
  </div>
);
const Glass: React.FC<{ x: number; y: number; w: number; h: number; col: string; k: number; children?: React.ReactNode; rot?: number }> = ({ x, y, w, h, col, k, children, rot = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `scale(${0.6 + 0.4 * k}) rotate(${rot}deg)`, opacity: clamp(k * 1.5), borderRadius: 38, background: "rgba(10,14,22,.88)", border: `4px solid ${col}`, boxShadow: `0 0 40px ${col}66, 0 20px 50px rgba(0,0,0,.35)`, padding: 28, direction: "rtl", fontFamily: V, color: "#fff", overflow: "hidden" }}>{children}</div>
);
const Txt: React.FC<{ s: string; size?: number; col?: string; w?: number }> = ({ s, size = 40, col = "#fff", w = 900 }) => (
  <div style={{ fontFamily: V, fontWeight: w, fontSize: size, color: col, direction: "rtl", lineHeight: 1.25 }}>{s.split(" ").map((x, i) => <span key={i} style={{ display: "inline-block", margin: "0 .12em" }}>{x}</span>)}</div>
);
const typed = (s: string, k: number) => s.slice(0, Math.floor(clamp(k) * s.length));

// ---------- per-point motion graphics ----------
const G1: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  if (t < 4.9 || t > 12.3) return null;
  const out = clamp((12.3 - t) / 0.25);
  const kL = pop(f, 6.3), kR = pop(f, 8.9);
  const bad = prog(t, 8.7, 0.6), good = prog(t, 11.1, 0.7);
  const hold = t > 8.4; // cards slide when punch-in cut
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Pill f={f} t0={4.9} t1={12.2} text="اشتباه ۱ · خیلی کوتاه می‌پرسی" top={120} col={OR} />
      <Glass x={565} y={235} w={455} h={hold ? 400 : 470} col="#8a93a3" k={kL}>
        <Txt s="کوتاه" size={44} col="#9aa3b2" />
        <div style={{ margin: "14px 0", background: "#1c2432", borderRadius: 24, padding: "10px 20px", display: "inline-block" }}><Txt s={typed("ایمیل بنویس", (t - 7.4) / 1.0)} size={48} /></div>
        <div style={{ marginTop: 10 }}><Lines n={4} col="#4a5366" k={bad} h={14} gap={16} /></div>
        <div style={{ position: "absolute", left: 24, bottom: 18, opacity: bad, transform: `scale(${0.5 + 0.5 * bad})` }}><Ic d={P.cross} size={64} col="#ff4d4d" sw={7} /></div>
      </Glass>
      <Glass x={60} y={235} w={475} h={hold ? 400 : 470} col={CY} k={kR}>
        <Txt s="دقیق" size={44} col={CY} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "12px 0", direction: "rtl" }}>
          {[["برای کی؟", 9.3], ["چه لحنی؟", 10.2], ["دقیقاً چی؟", 11.0]].map(([s, a], i) => (
            <div key={i} style={{ opacity: prog(t, a as number, 0.3), transform: `scale(${0.7 + 0.3 * prog(t, a as number, 0.3)})`, background: i == 1 ? OR : CY, color: INK, borderRadius: 30, padding: "2px 20px 8px", fontFamily: V, fontWeight: 900, fontSize: 42 }}>{s as string}</div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}><Lines n={4} col={CY} k={good} h={14} gap={16} /></div>
        <div style={{ position: "absolute", left: 24, bottom: 18, opacity: good, transform: `scale(${0.5 + 0.5 * good})` }}><Ic d={P.check} size={64} col="#37f09a" sw={8} /></div>
      </Glass>
    </AbsoluteFill>
  );
};

const G2: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  if (t < 12.2 || t > 20.8) return null;
  const out = clamp((20.8 - t) / 0.25);
  const badge = pop(f, 13.8);
  const early = t < 15.4;
  const kb = pop(f, 15.6);
  const txt = typed("تو یه مشاور کاربلدی هستی", (t - 15.7) / 1.5);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Pill f={f} t0={12.2} t1={20.7} text="اشتباه ۲ · نقش نمی‌دی" top={120} col={CY} />
      {early && (
        <>
          <div style={{ position: "absolute", left: t < 14.0 ? 330 : 90, top: 300, width: 420, opacity: (t < 14.0 ? 1 : 0.28) * clamp((15.4 - t) / 0.2), transition: "none" }}>
            <svg width="420" height="420" viewBox="0 0 64 64" fill="none" stroke="#9aa3b2" strokeWidth="2.4" strokeLinecap="round"><circle cx="32" cy="32" r="29" strokeDasharray="3 4" /><path d={P.person} transform="translate(8,8) scale(.75)" /></svg>
            <div style={{ textAlign: "center", fontFamily: V, fontWeight: 900, fontSize: 56, color: "#cfd6e2", direction: "rtl", marginTop: 10 }}>بدون نقش؟</div>
          </div>
          <div style={{ position: "absolute", left: 420, top: 270, width: 580, transform: `scale(${badge}) rotate(${-4 * (1 - badge)}deg)`, opacity: clamp(badge * 2) }}>
            <div style={{ background: "linear-gradient(135deg,#0e1a2c,#143049)", border: `6px solid ${CY}`, borderRadius: 48, padding: "34px 34px 44px", boxShadow: `0 0 70px ${CY}99`, direction: "rtl", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, alignItems: "center" }}>
                <Ic d={P.person} size={190} col={CY} sw={4} />
                <Ic d={P.star} size={90} col={OR} sw={5} style={{ transform: `rotate(${f * 3}deg)` }} />
              </div>
              <div style={{ marginTop: 18 }}><Txt s="نقش" size={62} col={OR} /></div>
              <Txt s="مشاور کاربلد" size={72} />
            </div>
          </div>
        </>
      )}
      {!early && t < 18.4 && (
        <div style={{ position: "absolute", left: 90, top: 230, width: 900, transform: `scale(${0.7 + 0.3 * kb})`, opacity: clamp(kb * 2) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, background: "rgba(10,14,22,.9)", border: `4px solid ${CY}`, borderRadius: 60, padding: "16px 36px 22px", boxShadow: `0 0 50px ${CY}77`, direction: "rtl" }}>
            <Ic d={P.person} size={80} col={CY} sw={5} />
            <Txt s={txt + (Math.floor(f / 8) % 2 ? "▍" : "")} size={52} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const G3: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  if (t < 20.8 || t > 26.9) return null;
  const out = clamp((26.9 - t) / 0.2);
  const one = pop(f, 21.7);
  const stop = pop(f, 23.0);
  const loop = pop(f, 24.4);
  const c1 = pop(f, 24.7), c2 = pop(f, 25.6);
  const cmp = t > 24.6;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Pill f={f} t0={20.8} t1={26.8} text="اشتباه ۳ · یه بار و ول" top={120} col={OR} />
      {!cmp && (
        <>
          <Glass x={90} y={270} w={440} h={330} col="#ff9a4a" k={one}>
            <Txt s="جواب ۱" size={38} col="#ffb37a" />
            <div style={{ marginTop: 18 }}><Lines n={4} col="#6b5648" k={prog(t, 22.0, 0.8)} h={13} gap={14} /></div>
          </Glass>
          <div style={{ position: "absolute", left: 600, top: 300, opacity: clamp(stop * 2), transform: `scale(${stop})` }}>
            <Ic d={P.stop} size={300} col="#ff4d4d" sw={4} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 118, textAlign: "center" }}><Txt s="ول!" size={76} col="#ff4d4d" /></div>
          </div>
        </>
      )}
      {cmp && (
        <>
          <Glass x={60} y={235} w={380} h={270} col="#37f09a" k={loop}>
            <Txt s={t > 25.6 ? "جواب ۳" : "جواب ۲"} size={34} col="#37f09a" />
            <div style={{ marginTop: 14 }}><Lines n={4} col="#37f09a" k={prog(t, 24.8, 0.6)} h={13} gap={14} /></div>
          </Glass>
          <div style={{ position: "absolute", left: 460, top: 255, transform: `scale(${loop}) rotate(${f * 4}deg)` }}><Ic d={P.loop} size={190} col={OR} sw={5} /></div>
          <div style={{ position: "absolute", left: 670, top: 225, width: 350, display: "flex", flexDirection: "column", gap: 16 }}>
            {[["کوتاه‌ترش کن", c1, CY], ["مودبانه‌ترش کن", c2, OR]].map(([s, k, c], i) => (
              <div key={i} style={{ transform: `scale(${0.5 + 0.5 * (k as number)})`, opacity: clamp((k as number) * 2), background: c as string, color: INK, borderRadius: 36, padding: "4px 14px 12px", fontFamily: V, fontWeight: 900, fontSize: 40, textAlign: "center", direction: "rtl", boxShadow: `0 0 36px ${c}aa` }}>{s as string}</div>
            ))}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

const Cta: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  if (t < 28.9) return null;
  const k = pop(f, 29.1);
  const bob = Math.sin(f / 9) * 8;
  const k2 = pop(f, 30.2);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540, top: 205 + bob, transform: `translateX(-50%) scale(${k})`, opacity: clamp(k * 2), direction: "rtl", fontFamily: V, fontWeight: 900, fontSize: 250, color: "#fff", whiteSpace: "nowrap",
        textShadow: `0 0 8px #fff, 0 0 26px ${OR}, 0 0 60px ${OR}, 0 0 130px ${OR}, 0 6px 0 #0b3a52` }}>
        <span style={{ display: "inline-block" }}>پرامپت</span>
      </div>
      <div style={{ position: "absolute", left: 540, top: 500, transform: `translateX(-50%) scale(${k2})`, opacity: clamp(k2 * 2), display: "flex", alignItems: "center", gap: 18, background: INK, borderRadius: 70, padding: "8px 44px 16px 36px", boxShadow: `0 0 50px ${OR}99`, border: `4px solid ${OR}` }}>
        <Ic d={P.msg} size={64} col={OR} sw={5} />
        <Txt s="کامنت کن" size={58} />
      </div>
      {t > 33.7 && (
        <div style={{ position: "absolute", left: 540, top: 660, whiteSpace: "nowrap", transform: `translateX(-50%) scale(${pop(f, 33.8)})`, textAlign: "center", fontFamily: V, fontWeight: 900, fontSize: 46, color: "#fff", direction: "rtl", textShadow: "0 4px 20px rgba(0,40,70,.6)" }}>
          <Txt s="پک کامل پرامپت‌ها تو کانال تلگرام" size={46} /><Txt s="لینک تو بایو" size={50} col="#0e1116" />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- subtitles ----------
const Subs: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS + OFF;
  let ci = -1;
  for (let i = 0; i < CHUNKS.length; i++) if (t >= CHUNKS[i][0][1]) ci = i;
  if (ci < 0) return null;
  const ch = CHUNKS[ci];
  const last = ch[ch.length - 1][1];
  if (t > last + 0.7) return null;
  const vis = ch.filter((w) => t >= w[1]).length;
  const age = (t - ch[0][1]);
  const enter = clamp(age / 0.12);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1280, height: 200, display: "flex", justifyContent: "center", alignItems: "center", direction: "rtl", opacity: enter, transform: `translateY(${(1 - enter) * 14}px)` }}>
      <div style={{ direction: "rtl", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 10px", fontFamily: V, fontWeight: 900, fontSize: 68, lineHeight: 1.3 }}>
        {ch.map((w, i) => {
          const on = i < vis, cur = i === vis - 1;
          const k = on ? clamp((t - w[1]) / 0.1) : 0;
          return (
            <span key={i} style={{ display: "inline-block", visibility: on ? "visible" : "hidden", color: "#fff", opacity: cur ? 1 : 0.55,
              padding: w[2] ? "0 22px 8px" : "0 4px", borderRadius: 40, background: w[2] ? OR : "transparent",
              transform: `scale(${cur ? 0.9 + 0.1 * k + (w[2] ? 0.06 : 0) : 1})`, textShadow: w[2] ? "none" : "0 3px 14px rgba(0,0,0,.75), 0 0 3px rgba(0,0,0,.9)", boxShadow: w[2] && cur ? `0 6px 30px ${OR}99` : "none" }}>{w[0]}</span>
          );
        })}
      </div>
    </div>
  );
};

// ---------- main ----------
export const Talk: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const { st, i, sg } = camera(t, f);
  // theme stack: previous theme underneath, new theme revealed by an iris from the host
  const prevTh = i > 0 ? SEGS[i - 1].th : sg.th;
  const iris = sg.th !== prevTh ? clamp((f - sg.t0 * FPS) / 16) : 1;
  const irisE = ease(iris);
  const pf = Math.min(Math.max(Math.round(t * FPS), 0), NFR - 1);
  const src = String(pf).padStart(4, "0");
  const shake = (f - sg.t0 * FPS) < 4 ? Math.sin(f * 3) * (4 - (f - sg.t0 * FPS)) * 2 : 0;
  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <Bg th={iris >= 1 ? sg.th : prevTh} f={f} />
      {iris < 1 && (
        <AbsoluteFill style={{ clipPath: `circle(${irisE * 2100}px at 540px 1150px)` }}><Bg th={sg.th} f={f} /></AbsoluteFill>
      )}
      <G1 f={f} /><G2 f={f} /><G3 f={f} />
      <AbsoluteFill style={{ transformOrigin: "50% 100%", transform: `translate(${st.x + shake}px, ${st.y}px) scale(${st.s})` }}>
        <Img src={staticFile(`talk/p/${src}.png`)} style={{ width: 1080, height: 1920, filter: THEME[irisE > 0.5 ? sg.th : prevTh].rim }} />
      </AbsoluteFill>
      {/* neon kinetic text (in front of the host) */}
      <Neon f={f} t0={0.5} t1={2.4} text="جواب آشغال؟" col={CY} size={150} top={190} rot={-4} />
      <Neon f={f} t0={2.6} t1={4.9} text="تقصیر جمله‌ی توئه!" col={OR} size={112} top={210} rot={3} />
      <Neon f={f} t0={18.6} t1={20.8} text="یه جمله!" col={CY} size={170} top={190} rot={-3} />
      <Neon f={f} t0={26.9} t1={28.8} text="خسته نمی‌شه!" col={OR} size={130} top={200} rot={3} />
      <Cta f={f} />
      {/* grade: bottom scrim, vignette, bloom, grain */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(0,0,0,0) 52%,rgba(0,0,0,.5) 100%)", pointerEvents: "none" }} />
      <Subs f={f} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(255,214,170,.07) 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(0,0,0,.42) 100%)", mixBlendMode: "normal" }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("talk/grain.png")})`, backgroundSize: "512px 512px", backgroundPosition: `${(f * 97) % 512}px ${(f * 61) % 512}px`, opacity: 0.1, mixBlendMode: "overlay" }} />
      {/* brand tag */}
      <div style={{ position: "absolute", left: 44, top: 70, direction: "rtl", fontFamily: V, fontWeight: 900, fontSize: 34, color: "#fff", background: "rgba(14,17,22,.72)", border: `2px solid ${CY}`, borderRadius: 30, padding: "0 22px 6px" }}>
        <span style={{ display: "inline-block" }}>تک‌روز</span>
      </div>
    </AbsoluteFill>
  );
};
