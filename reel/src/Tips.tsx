// Style B "clean editorial" tips reel: light grey page, blurred depth shapes, lead line + huge word,
// phone dialer that types codes in sync with the voice, result cards, stamps, synced captions, end card.
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as vazir } from "@remotion/google-fonts/Vazirmatn";
import { loadFont as lalezar } from "@remotion/google-fonts/Lalezar";
const V = vazir("normal", { weights: ["300", "800", "900"], subsets: ["arabic", "latin"] }).fontFamily;
const L = lalezar("normal", { subsets: ["arabic", "latin"] }).fontFamily;
const RED = "#E11D2E";

export type TipScene = {
  start: number; end: number; kind: "hook" | "code" | "stamp" | "end";
  lead?: string; big?: string; code?: string; typeFrom?: number; typeTo?: number;
  result?: { at: number; title: string; rows: string[]; grid?: boolean }; stamp?: string;
};
export type TipLine = { text: string; start: number; end: number };
export type TipsProps = { scenes: TipScene[]; lines: TipLine[]; seconds: number; hot: string[] };

const useT = () => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return { f, fps, t: f / fps }; };
const ease = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

// soft page with drifting out-of-focus shapes
const Page: React.FC = () => {
  const { t } = useT();
  const blob = (x: number, y: number, s: number, r: number, k: number) => (
    <div style={{ position: "absolute", left: x + Math.sin(t * 0.5 + k) * 30, top: y + Math.cos(t * 0.4 + k) * 30, width: s, height: s,
      borderRadius: s * 0.28, background: "linear-gradient(135deg,#3a3a3a,#0d0d0d)", transform: `rotate(${r + t * 6}deg)`, filter: "blur(22px)", opacity: 0.55 }} />
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #ffffff 0%, #ececec 45%, #d6d6d6 100%)", overflow: "hidden" }}>
      <svg width="1080" height="1920" style={{ position: "absolute", opacity: 0.07 }}>
        <polyline points="-50,1300 250,700 520,1250 800,600 1150,1200" fill="none" stroke="#000" strokeWidth="120" strokeLinejoin="round" />
      </svg>
      {blob(-120, -60, 330, 20, 0)}{blob(830, 120, 260, 45, 1)}{blob(-90, 1620, 300, 10, 2)}{blob(860, 1500, 340, 60, 3)}
      <AbsoluteFill style={{ background: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.05'/></svg>\")" }} />
    </AbsoluteFill>
  );
};

// word that appears blurred -> sharp
const Reveal: React.FC<{ text: string; at: number; style: React.CSSProperties; ghost?: boolean }> = ({ text, at, style, ghost }) => {
  const { t } = useT();
  const p = ease(t, at, at + 0.45);
  return (
    <div style={{ position: "relative", direction: "rtl", textAlign: "center", ...style }}>
      {ghost && <div style={{ position: "absolute", inset: 0, transform: "scale(2.1)", opacity: 0.06 * p, filter: "blur(2px)" }}>{text}</div>}
      <div style={{ opacity: p, filter: `blur(${(1 - p) * 14}px)`, transform: `translateY(${(1 - p) * 30}px)` }}>{text}</div>
    </div>
  );
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
const Phone: React.FC<{ s: TipScene }> = ({ s }) => {
  const { t, fps, f } = useT();
  const code = s.code || "";
  const from = s.typeFrom ?? s.start, to = s.typeTo ?? s.end;
  const n = Math.max(0, Math.min(code.length, Math.floor(((t - from) / (to - from)) * code.length + 0.0001)));
  const typed = t < from ? "" : code.slice(0, n);
  const last = typed.slice(-1);
  const pressT = from + ((n - 1) / code.length) * (to - from);
  const inP = spring({ frame: f - Math.round(s.start * fps), fps, config: { damping: 14, stiffness: 120 } });
  const resP = s.result ? ease(t, s.result.at, s.result.at + 0.5) : 0;
  return (
    <div style={{ position: "absolute", left: 270, top: 520, width: 540, height: 1000, borderRadius: 80, background: "#111",
      padding: 18, boxShadow: "0 60px 120px rgba(0,0,0,.35), 0 20px 40px rgba(0,0,0,.25)",
      transform: `perspective(1800px) rotateY(${(1 - inP) * -35 + Math.sin(t * 0.6) * 3}deg) translateY(${(1 - inP) * 300}px) scale(${1 - resP * 0.12})`, opacity: inP }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 64, background: "#fafafa", overflow: "hidden", position: "relative" }}>
        <div style={{ height: 250, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 30,
          fontFamily: "monospace", fontSize: code.length > 8 ? 56 : 84, fontWeight: 700, color: "#111", direction: "ltr", letterSpacing: 2 }}>
          {typed}<span style={{ opacity: Math.floor(t * 2) % 2 ? 0 : 1, color: RED }}>|</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, padding: "10px 46px" }}>
          {KEYS.map((k) => {
            const hit = k === last && t - pressT < 0.18 && t >= from;
            return <div key={k} style={{ height: 120, borderRadius: 60, background: hit ? RED : "#e9e9e9", color: hit ? "#fff" : "#222",
              display: "flex", alignItems: "center", justifyContent: "center", fontFamily: V, fontWeight: 800, fontSize: 52,
              transform: `scale(${hit ? 0.92 : 1})` }}>{k}</div>;
          })}
        </div>
      </div>
      {s.result && (
        <div style={{ position: "absolute", left: -110, right: -110, top: 300, padding: "40px 44px", borderRadius: 44, background: "#fff",
          boxShadow: "0 50px 100px rgba(0,0,0,.3)", direction: "rtl", opacity: resP,
          transform: `perspective(1400px) rotateX(${(1 - resP) * 25}deg) translateY(${(1 - resP) * 120}px) scale(${0.9 + resP * 0.1})` }}>
          <div style={{ fontFamily: V, fontWeight: 900, fontSize: 54, color: "#111", marginBottom: 22 }}>{s.result.title}</div>
          <div style={{ display: s.result.grid ? "grid" : "block", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {s.result.rows.map((r, i) => {
              const p = ease(t, s.result!.at + 0.25 + i * 0.18, s.result!.at + 0.6 + i * 0.18);
              return <div key={i} style={{ fontFamily: V, fontWeight: 800, fontSize: s.result!.grid ? 38 : 42, color: "#333", opacity: p,
                transform: `translateX(${(1 - p) * -40}px)`, padding: s.result!.grid ? "26px 10px" : "12px 0", textAlign: s.result!.grid ? "center" : "right",
                background: s.result!.grid ? "#f1f1f1" : "none", borderRadius: 24, unicodeBidi: "plaintext", borderBottom: s.result!.grid ? "none" : "2px solid #eee" }}>{r}</div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const Stamp: React.FC<{ text: string; at: number; x: number; y: number; size?: number }> = ({ text, at, x, y, size = 250 }) => {
  const { f, fps } = useT();
  const p = spring({ frame: f - Math.round(at * fps), fps, config: { damping: 8, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: RED, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: V, fontWeight: 900, fontSize: size * 0.17,
      lineHeight: 1.25, border: "8px dashed rgba(255,255,255,.7)", outline: `6px solid ${RED}`, direction: "rtl", padding: 20,
      boxShadow: "0 20px 50px rgba(225,29,46,.45)", transform: `scale(${p * 1}) rotate(${-14 + (1 - p) * 40}deg)`, opacity: Math.min(1, p * 2) }}>{text}</div>
  );
};

const Arrow: React.FC<{ at: number; x: number; y: number; flip?: boolean }> = ({ at, x, y, flip }) => {
  const { t } = useT();
  const p = ease(t, at, at + 0.6);
  return (
    <svg width="220" height="200" style={{ position: "absolute", left: x, top: y, transform: flip ? "scaleX(-1)" : "" }}>
      <path d="M20 20 C 120 10, 190 70, 150 160" fill="none" stroke="#111" strokeWidth="9" strokeLinecap="round"
        strokeDasharray="300" strokeDashoffset={300 * (1 - p)} />
      <path d="M118 140 L152 166 L176 126" fill="none" stroke="#111" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity={p > 0.9 ? 1 : 0} />
    </svg>
  );
};

const Scene: React.FC<{ s: TipScene }> = ({ s }) => {
  const { t } = useT();
  const inn = ease(t, s.start, s.start + 0.35), out = 1 - ease(t, s.end - 0.05, s.end + 0.3);
  const op = Math.min(inn, out);
  if (op <= 0) return null;
  const drift = 1 + (t - s.start) * 0.008;
  return (
    <AbsoluteFill style={{ opacity: op, filter: `blur(${(1 - op) * 10}px)`, transform: `scale(${drift})` }}>
      {s.lead && <Reveal text={s.lead} at={s.start + 0.05} style={{ position: "absolute", top: s.kind === "code" ? 200 : 560, left: 60, right: 60, fontFamily: V, fontWeight: 300, fontSize: 58, color: "#444" }} />}
      {s.big && <Reveal ghost text={s.big} at={s.start + 0.3} style={{ position: "absolute", top: s.kind === "code" ? 270 : 640, left: 40, right: 40, fontFamily: L, fontSize: s.kind === "code" ? 120 : 190, lineHeight: 1.1, color: "#111" }} />}
      {s.kind === "code" && <Phone s={s} />}
      {s.stamp && <Stamp text={s.stamp} at={s.start + 0.6} x={s.kind === "code" ? 760 : 620} y={s.kind === "code" ? 470 : 1050} size={s.kind === "code" ? 230 : 300} />}
      {s.kind === "hook" && <Arrow at={s.start + 1.2} x={720} y={900} />}
      {s.kind === "end" && <Arrow at={s.start + 1.0} x={430} y={1000} />}
      {s.kind === "end" && <Reveal text="@techrooz_fa" at={s.start + 1.4} style={{ position: "absolute", top: 1220, left: 0, right: 0, fontFamily: V, fontWeight: 900, fontSize: 64, color: RED, direction: "ltr" }} />}
    </AbsoluteFill>
  );
};

const Captions: React.FC<{ lines: TipLine[]; hot: string[] }> = ({ lines, hot }) => {
  const { t, fps } = useT();
  const line = lines.find((l) => t >= l.start && t < l.end + 0.12);
  if (!line) return null;
  const words = line.text.split(/\s+/);
  const chunks: string[][] = [];
  for (let k = 0; k < words.length; k += 3) chunks.push(words.slice(k, k + 3));
  const total = chunks.reduce((a, c) => a + c.join(" ").length, 0);
  let acc = line.start, idx = 0;
  for (let k = 0; k < chunks.length; k++) {
    const d = (chunks[k].join(" ").length / total) * (line.end - line.start);
    if (t < acc + d || k === chunks.length - 1) { idx = k; break; }
    acc += d;
  }
  const local = (t - acc) * fps;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1610, direction: "rtl", textAlign: "center", fontFamily: V, fontWeight: 900,
      fontSize: 66, lineHeight: 1.3, color: "#111" }}>
      {chunks[idx].map((w, k) => {
        const p = interpolate(local - k * 2.5, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const isHot = hot.some((h) => w.includes(h));
        return <span key={k} style={{ display: "inline-block", margin: "0 10px", opacity: p, filter: `blur(${(1 - p) * 8}px)`,
          transform: `translateY(${(1 - p) * 18}px)`, color: isHot ? "#fff" : "#111", background: isHot ? RED : "transparent",
          padding: isHot ? "0 16px" : 0, borderRadius: 14 }}>{w}</span>;
      })}
    </div>
  );
};

export const Tips: React.FC<TipsProps> = ({ scenes, lines, seconds, hot }) => {
  const { t } = useT();
  return (
    <AbsoluteFill style={{ direction: "ltr" }}>
      <Page />
      {scenes.map((s, i) => <Scene key={i} s={s} />)}
      <Captions lines={lines} hot={hot} />
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center" }}><div style={{ fontFamily: L, fontSize: 64, color: "#fff", background: "#111", padding: "6px 34px", borderRadius: 999, direction: "rtl", boxShadow: "0 10px 30px rgba(0,0,0,.25)" }}>⚡ تک‌روز</div></div>
      <div style={{ position: "absolute", top: 0, right: 0, height: 8, background: RED, width: `${(t / seconds) * 100}%` }} />
    </AbsoluteFill>
  );
};
