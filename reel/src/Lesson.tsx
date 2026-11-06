// "Lesson" reel (Rivinity-style): beige/dark scenes, huge numbers, object cutouts (multiply), highlighter paper, line-connected nodes, checklist CTA.
import React from "react";
import { AbsoluteFill, Loop, OffthreadVideo, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as vazir } from "@remotion/google-fonts/Vazirmatn";
const V = vazir("normal", { weights: ["300", "500", "800", "900"], subsets: ["arabic", "latin"] }).fontFamily;
const RED = "#E8362B", YEL = "#FFE14D";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.8' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>\")";

export type LScene = { start: number; end: number; kind: "hero" | "obj" | "paper" | "number" | "ring" | "line" | "check" | "cta"; text?: string; accent?: string; big?: string; src?: string; dur?: number; scale?: number; lines?: string[]; hi?: number; nodes?: { label: string; sub: string; src?: string; dur?: number; red?: boolean }[]; rows?: string[]; keyword?: string };
export type LessonProps = { seconds: number; scenes: LScene[] };

const Vid: React.FC<{ src: string; dur: number; w: number; h: number; blend?: boolean; round?: boolean; z?: number }> = ({ src, dur, w, h, blend, round, z = 1 }) => (
  <div style={{ width: w, height: h, overflow: "hidden", mixBlendMode: blend ? "multiply" : "normal", borderRadius: round ? w / 2 : 0 }}>
    <div style={{ width: "100%", height: "100%", transform: `scale(${z})` }}>
      <Loop durationInFrames={Math.max(10, Math.floor(dur * 30))}><OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /></Loop>
    </div>
  </div>
);

const Words: React.FC<{ text: string; t: number; len: number; size?: number; color: string; accent?: string; align?: "center" | "right" }> = ({ text, t, len, size = 96, color, accent }) => {
  const ws = text.split(" ");
  const span = Math.min(len * 0.6, ws.length * 0.28);
  return (
    <div style={{ direction: "rtl", textAlign: "center", fontFamily: V, fontWeight: 900, fontSize: size, lineHeight: 1.3, padding: "0 70px" }}>
      {ws.map((w, i) => {
        const a = 0.15 + (span * i) / ws.length;
        const p = interpolate(t, [a, a + 0.28], [0, 1], cl);
        return <span key={i} style={{ display: "inline-block", marginInline: 12, opacity: p, filter: `blur(${(1 - p) * 14}px)`, transform: `translateY(${(1 - p) * 26}px)`, color: accent && w.includes(accent) ? RED : color }}>{w}</span>;
      })}
    </div>
  );
};

const Ring: React.FC<{ r: number; p: number; color?: string; w?: number }> = ({ r, p, color = "#fff", w = 4 }) => (
  <svg width={r * 2 + 20} height={r * 2 + 20} style={{ position: "absolute", left: 0, top: 0 }}>
    <circle cx={r + 10} cy={r + 10} r={r} fill="none" stroke={color} strokeWidth={w} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} transform={`rotate(-90 ${r + 10} ${r + 10})`} style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,.5))" }} />
  </svg>
);

const SceneView: React.FC<{ s: LScene }> = ({ s }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const t = f / fps - s.start, len = s.end - s.start;
  const dark = s.kind === "ring" || s.kind === "line" || s.kind === "check" || s.kind === "cta";
  const paper = s.kind === "paper";
  const fg = dark ? "#fff" : "#141414";
  const op = interpolate(t, [0, 0.25], [0, 1], cl) * interpolate(t, [len - 0.18, len], [1, 0], cl);
  const push = 1 + 0.06 * (t / len);
  const pop = spring({ frame: f - Math.round((s.start + 0.1) * fps), fps, config: { damping: 15, stiffness: 110 } });
  const bg = dark ? "radial-gradient(circle at 50% 45%,#16161c 0%,#08080b 80%)" : paper ? "#bdbab3" : "radial-gradient(circle at 50% 35%,#e9e4da 0%,#cfc8ba 100%)";
  const body: React.ReactNode[] = [];
  if (s.kind === "hero" || s.kind === "obj" || s.kind === "number") {
    if (s.big) body.push(<div key="b" style={{ position: "absolute", top: s.kind === "number" ? 330 : 260, width: "100%", textAlign: "center", fontFamily: V, fontWeight: 900, fontSize: s.kind === "number" ? 560 : 330, color: s.kind === "number" ? "rgba(20,20,20,.9)" : fg, letterSpacing: -14, filter: `blur(${s.kind === "number" ? (1 - pop) * 30 : 0}px)`, opacity: pop, transform: `scale(${0.9 + 0.1 * pop})` }}>{s.big}</div>);
    if (s.src) body.push(<div key="v" style={{ position: "absolute", top: s.kind === "hero" ? 520 : 520, left: 0, width: "100%", display: "flex", justifyContent: "center", transform: `scale(${push}) rotate(${(1 - pop) * -4}deg)`, mixBlendMode: "multiply" }}><Vid src={s.src} dur={s.dur ?? 3} w={1080 * (s.scale ?? 1)} h={820 * (s.scale ?? 1)} /></div>);
    body.push(<div key="w" style={{ position: "absolute", bottom: 300, width: "100%" }}><Words text={s.text ?? ""} t={t} len={len} color={fg} accent={s.accent} /></div>);
  }
  if (s.kind === "paper") {
    const hp = interpolate(t, [1.6, 2.6], [0, 1], cl);
    body.push(<div key="y" style={{ position: "absolute", top: 230, width: "100%", textAlign: "center", fontFamily: V, fontWeight: 900, fontSize: 300, color: "rgba(20,20,20,.88)", letterSpacing: -10, opacity: pop }}>{s.big}</div>);
    body.push(<div key="c" style={{ position: "absolute", top: 640, left: 80, right: 80, direction: "rtl", fontFamily: V, fontWeight: 800, fontSize: 78, lineHeight: 1.55, color: "#1a1a1a", transform: `scale(${push})`, background: "rgba(255,255,255,.55)", padding: "46px 50px", borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,.35)" }}>
      {(s.lines ?? []).map((l, i) => { const lp = interpolate(t, [0.2 + i * 0.7, 0.6 + i * 0.7], [0, 1], cl); const isHi = i === (s.hi ?? -1); return <div key={i} style={{ opacity: lp, transform: `translateX(${(1 - lp) * 40}px)`, position: "relative", display: "inline-block", width: "100%" }}>{isHi && <span style={{ position: "absolute", right: 0, top: 18, bottom: 10, width: `${hp * 100}%`, background: YEL, zIndex: 0, borderRadius: 6 }} />}<span style={{ position: "relative", zIndex: 1 }}>{l}</span></div>; })}
    </div>);
  }
  if (s.kind === "ring" || s.kind === "check" || s.kind === "cta") {
    const rp = interpolate(t, [0, 0.9], [0, 1], cl);
    body.push(<div key="r" style={{ position: "absolute", top: 330, left: 540 - 250, width: 520, height: 520, transform: `scale(${push})` }}>
      <Ring r={250} p={rp} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: V, fontWeight: 900, fontSize: s.kind === "cta" ? 130 : 150, color: "#fff", opacity: pop, direction: "rtl" }}>{s.kind === "cta" ? `«${s.keyword}»` : s.big}</div>
    </div>);
    if (s.kind === "ring") body.push(<div key="x" style={{ position: "absolute", top: 510, left: 240, width: 600 }}><svg width={600} height={160}><path d="M0 80 L130 90 L230 70 L330 95 L430 72 L600 86" stroke={RED} strokeWidth={6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - interpolate(t, [1.6, 2.6], [0, 1], cl)} style={{ filter: "drop-shadow(0 0 14px #ff3b30)" }} /></svg></div>);
    if (s.kind !== "ring") body.push(<div key="rows" style={{ position: "absolute", top: 930, left: 160, right: 160, direction: "rtl", fontFamily: V, fontWeight: 800, fontSize: 64, color: "#fff" }}>
      {(s.rows ?? []).map((r, i) => { const rp2 = interpolate(t, [0.8 + i * 0.7, 1.2 + i * 0.7], [0, 1], cl); const chk = interpolate(t, [1.6 + i * 0.7, 1.9 + i * 0.7], [0, 1], cl); return <div key={i} style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 44, opacity: rp2, transform: `translateX(${(1 - rp2) * 50}px)` }}><span style={{ width: 66, height: 66, border: "4px solid #fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: YEL, fontSize: 60 }}>{chk > 0.5 ? "✓" : ""}</span>{r}</div>; })}
    </div>);
    body.push(<div key="w" style={{ position: "absolute", bottom: s.kind === "ring" ? 330 : 250, width: "100%" }}><Words text={s.text ?? ""} t={t} len={len} color="#fff" accent={s.accent} size={s.kind === "cta" ? 70 : 96} /></div>);
  }
  if (s.kind === "line") {
    const lp = interpolate(t, [0, len * 0.8], [0, 1], cl);
    body.push(<svg key="l" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}><path d="M540 260 C 200 520, 880 700, 540 960 C 200 1220, 880 1400, 540 1660" fill="none" stroke="#fff" strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lp} style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,.4))" }} /></svg>);
    const ys = [200, 730, 1260];
    (s.nodes ?? []).forEach((n, i) => { const np = spring({ frame: f - Math.round((s.start + 0.3 + i * (len * 0.26)) * fps), fps, config: { damping: 12, stiffness: 150 } }); body.push(
      <div key={"n" + i} style={{ position: "absolute", top: ys[i], left: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${np})`, opacity: np, direction: "rtl" }}>
        <div style={{ position: "relative", width: 280, height: 280, borderRadius: 140, overflow: "hidden", border: `5px solid ${n.red ? RED : "#fff"}`, background: "#101015", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: n.red ? "0 0 60px rgba(232,54,43,.5)" : "none" }}>
          {n.src ? <Vid src={n.src} dur={n.dur ?? 3} w={280} h={280} z={1.2} /> : <div style={{ fontFamily: V, fontWeight: 900, fontSize: 110, color: "#fff" }}>۲۰۱۹</div>}
        </div>
        <div style={{ fontFamily: V, fontWeight: 900, fontSize: 64, color: "#fff", marginTop: 18 }}>{n.label}</div>
        <div style={{ fontFamily: V, fontWeight: 500, fontSize: 44, color: n.red ? RED : "#aaa" }}>{n.sub}</div>
      </div>); });
  }
  return (
    <AbsoluteFill style={{ opacity: op, background: bg, overflow: "hidden" }}>
      {paper && <AbsoluteFill style={{ backgroundImage: NOISE, mixBlendMode: "multiply", opacity: 0.7 }} />}
      {body}
      <div style={{ position: "absolute", bottom: 120, width: "100%", textAlign: "center", fontFamily: V, fontWeight: 500, fontSize: 30, letterSpacing: 8, color: dark ? "#55555c" : "#8b8578" }}>TECHROOZ</div>
    </AbsoluteFill>
  );
};

export const Lesson: React.FC<LessonProps> = ({ scenes }) => (<AbsoluteFill style={{ background: "#000" }}>{scenes.map((s, i) => <SceneView key={i} s={s} />)}</AbsoluteFill>);
