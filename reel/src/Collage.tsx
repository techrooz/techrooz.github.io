// "Collage" reel: maximal editorial collage like the Pinterest references - textured backgrounds, stickers, UI mockups, kinetic type, chat-input typing.
import React from "react";
import { AbsoluteFill, Loop, OffthreadVideo, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as vazir } from "@remotion/google-fonts/Vazirmatn";
import { loadFont as lalezar } from "@remotion/google-fonts/Lalezar";
import { Arrow, RED, TipLine } from "./Tips";
const V = vazir("normal", { weights: ["300", "800", "900"], subsets: ["arabic", "latin"] }).fontFamily;
const L = lalezar("normal", { subsets: ["arabic", "latin"] }).fontFamily;

export type Item =
  | { t: "id"; at: number; title: string; sub: string; x: number; y: number; rot?: number }
  | { t: "sticker"; at: number; text: string; color: "red" | "white" | "yellow" | "black" | "blue" | "green"; x: number; y: number; rot?: number; size?: number }
  | { t: "big"; at: number; text: string; y: number; size: number; color: string; font?: "L" | "V" }
  | { t: "num"; at: number; text: string; x: number; y: number; color: string }
  | { t: "bubble"; at: number; text: string; x: number; y: number; w: number; typeTo?: number; dark?: boolean }
  | { t: "chat"; at: number; segs: { text: string; from: number; to: number; color?: string }[]; y?: number }
  | { t: "video"; at: number; src: string; x: number; y: number; w: number; h: number; rot?: number; rate?: number; crack?: number; tape?: boolean; dur?: number }
  | { t: "arrow"; at: number; x: number; y: number }
  | { t: "handle"; at: number; y: number };
export type CScene = { start: number; end: number; bg: "sky" | "felt" | "grid" | "mat" | "orange" | "black" | "white"; items: Item[] };
export type CollageProps = { seconds: number; lines: TipLine[]; hot: string[]; scenes: CScene[] };

const useT = () => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return { f, fps, t: f / fps }; };
const ease = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.85' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.5'/></svg>\")";

const Bg: React.FC<{ k: CScene["bg"]; t0: number }> = ({ k, t0 }) => {
  const { t } = useT();
  const d = t - t0;
  const base: Record<string, React.CSSProperties> = {
    sky: { background: "linear-gradient(180deg,#3f8fe0 0%,#8ec9f7 70%,#c9e8ff 100%)" },
    felt: { background: "radial-gradient(circle at 50% 40%,#a82424 0%,#7d1616 70%,#5a0e0e 100%)" },
    grid: { background: "#1b63c9", backgroundImage: "linear-gradient(rgba(255,255,255,.22) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.22) 2px,transparent 2px)", backgroundSize: "90px 90px" },
    mat: { background: "#1d6b3a", backgroundImage: "linear-gradient(rgba(255,255,255,.14) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.14) 2px,transparent 2px)", backgroundSize: "60px 60px" },
    orange: { background: "radial-gradient(circle at 50% 35%,#ff8a2a 0%,#f26a1b 60%,#d4520c 100%)" },
    black: { background: "radial-gradient(circle at 50% 35%,#1d1d1d 0%,#0a0a0a 70%)" },
    white: { background: "radial-gradient(circle at 50% 40%,#ffffff 0%,#ececea 80%)" },
  };
  return (
    <AbsoluteFill style={{ ...base[k], overflow: "hidden" }}>
      {k === "sky" && [0, 1, 2, 3].map((i) => (
        <div key={i} style={{ position: "absolute", left: ((i * 330 + d * (20 + i * 8)) % 1400) - 250, top: 120 + i * 380, width: 620, height: 230, borderRadius: 300, background: "radial-gradient(ellipse,rgba(255,255,255,.95),rgba(255,255,255,0) 70%)", filter: "blur(10px)", opacity: 0.85 }} />
      ))}
      {(k === "felt" || k === "mat" || k === "grid") && [0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ position: "absolute", left: (i * 260 + 40 + Math.sin(d + i) * 30) % 1100, top: ((i * 470 + 60 + d * 18) % 2100) - 120, width: 150, height: 210, borderRadius: 14, background: "#f7f4ea", opacity: 0.9, transform: `rotate(${i * 37 + d * 6}deg)`, boxShadow: "0 12px 30px rgba(0,0,0,.35)" }} />
      ))}
      <AbsoluteFill style={{ backgroundImage: NOISE, mixBlendMode: "multiply", opacity: 0.55 }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%,transparent 55%,rgba(0,0,0,.45) 100%)" }} />
    </AbsoluteFill>
  );
};

const usePop = (at: number) => {
  const { f, fps } = useVideoConfig() as any && useT();
  const p = spring({ frame: f - Math.round(at * fps), fps, config: { damping: 11, stiffness: 190 } });
  return { p: Math.max(0, p), on: f >= Math.round(at * fps) };
};

const COL: Record<string, [string, string]> = { red: ["#E11D2E", "#fff"], white: ["#fff", "#111"], yellow: ["#FFD400", "#111"], black: ["#111", "#fff"], blue: ["#2563EB", "#fff"], green: ["#16A34A", "#fff"] };

const Sticker: React.FC<{ i: Extract<Item, { t: "sticker" }> }> = ({ i }) => {
  const { p, on } = usePop(i.at); if (!on) return null;
  const [bg, fg] = COL[i.color];
  return <div style={{ position: "absolute", left: i.x, top: i.y, transform: `translate(-50%,0) rotate(${(i.rot ?? -4) + (1 - p) * 14}deg) scale(${0.4 + 0.6 * p})`, opacity: Math.min(1, p * 2),
    background: bg, color: fg, fontFamily: V, fontWeight: 900, fontSize: i.size ?? 86, lineHeight: 1.15, padding: "14px 44px", borderRadius: 20, border: `7px solid ${fg === "#fff" ? "#fff" : "#111"}`, direction: "rtl", whiteSpace: "nowrap",
    boxShadow: "0 18px 40px rgba(0,0,0,.4)" }}>{i.text}</div>;
};
const Big: React.FC<{ i: Extract<Item, { t: "big" }> }> = ({ i }) => {
  const { p, on } = usePop(i.at); if (!on) return null;
  return <div style={{ position: "absolute", left: 40, right: 40, top: i.y, textAlign: "center", direction: "rtl", fontFamily: i.font === "V" ? V : L, fontWeight: 900, fontSize: i.size, lineHeight: 1.12, color: i.color,
    opacity: Math.min(1, p * 2), transform: `scale(${0.7 + 0.3 * p}) translateY(${(1 - p) * 40}px)`, textShadow: "0 8px 30px rgba(0,0,0,.35)" }}>{i.text}</div>;
};
const Num: React.FC<{ i: Extract<Item, { t: "num" }> }> = ({ i }) => {
  const { p, on } = usePop(i.at); if (!on) return null;
  return <div style={{ position: "absolute", left: i.x, top: i.y, width: 210, height: 210, borderRadius: 999, background: i.color, color: "#fff", fontFamily: L, fontSize: 150, display: "flex", alignItems: "center", justifyContent: "center",
    transform: `translate(-50%,0) scale(${p}) rotate(${(1 - p) * -40}deg)`, border: "8px solid #fff", boxShadow: "0 18px 40px rgba(0,0,0,.45)" }}>{i.text}</div>;
};
const IdCard: React.FC<{ i: Extract<Item, { t: "id" }> }> = ({ i }) => {
  const { p, on } = usePop(i.at); if (!on) return null;
  return <div style={{ position: "absolute", left: i.x, top: i.y, width: 640, transform: `translate(-50%,0) rotate(${(i.rot ?? 3) + (1 - p) * 20}deg) scale(${0.5 + 0.5 * p})`, opacity: Math.min(1, p * 2),
    background: "#fff", borderRadius: 36, padding: "34px 40px", boxShadow: "0 30px 70px rgba(0,0,0,.45)", direction: "rtl", fontFamily: V }}>
    <div style={{ width: 120, height: 14, borderRadius: 99, background: "#ddd", margin: "0 auto 24px" }} />
    <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
      <div style={{ width: 170, height: 170, borderRadius: 999, background: "linear-gradient(135deg,#2563EB,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 90 }}>🤖</div>
      <div><div style={{ fontWeight: 900, fontSize: 64, color: "#111", lineHeight: 1.2 }}>{i.title}</div><div style={{ fontWeight: 800, fontSize: 40, color: "#777", marginTop: 6 }}>{i.sub}</div></div>
    </div>
    <div style={{ marginTop: 26, fontSize: 54 }}>⭐⭐⭐⭐⭐</div>
  </div>;
};
const Bubble: React.FC<{ i: Extract<Item, { t: "bubble" }> }> = ({ i }) => {
  const { t } = useT(); const { p, on } = usePop(i.at); if (!on) return null;
  const n = i.typeTo ? Math.floor(ease(t, i.at, i.typeTo) * i.text.length) : i.text.length;
  return <div style={{ position: "absolute", left: i.x, top: i.y, width: i.w, transform: `translate(-50%,0) scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2), background: i.dark ? "#141414" : "#fff", color: i.dark ? "#fff" : "#111",
    fontFamily: V, fontWeight: 800, fontSize: 50, lineHeight: 1.55, padding: "26px 38px", borderRadius: 42, direction: "rtl", whiteSpace: "pre-wrap", boxShadow: "0 24px 60px rgba(0,0,0,.4)" }}>{i.text.slice(0, n)}</div>;
};
const Chat: React.FC<{ i: Extract<Item, { t: "chat" }> }> = ({ i }) => {
  const { t } = useT(); const { p, on } = usePop(i.at); if (!on) return null;
  return <div style={{ position: "absolute", left: 45, right: 45, top: i.y ?? 1010, transform: `translateY(${(1 - p) * 60}px)`, opacity: Math.min(1, p * 2), background: "#121212", borderRadius: 48, padding: "30px 38px 26px", direction: "rtl",
    boxShadow: "0 30px 80px rgba(0,0,0,.55)", border: "3px solid #2a2a2a", minHeight: 250 }}>
    <div style={{ fontFamily: V, fontWeight: 800, fontSize: 34, color: "#8a8a8a", marginBottom: 14 }}>پرامپت خودت رو بنویس…</div>
    <div style={{ fontFamily: V, fontWeight: 800, fontSize: 50, lineHeight: 1.7, color: "#fff" }}>
      {i.segs.map((s, k) => {
        const n = Math.floor(ease(t, s.from, s.to) * s.text.length);
        const txt = s.text.slice(0, n);
        return txt ? <span key={k} style={{ background: s.color ?? "transparent", borderRadius: 14, padding: s.color ? "0 12px" : 0, margin: "0 5px", boxDecorationBreak: "clone" as any, WebkitBoxDecorationBreak: "clone" as any }}>{txt}</span> : null;
      })}
      <span style={{ display: "inline-block", width: 6, height: 52, background: "#fff", marginRight: 6, verticalAlign: "middle", opacity: Math.floor(t * 2) % 2 }} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, direction: "ltr", color: "#777", fontFamily: V, fontWeight: 800, fontSize: 34 }}><span>＋ ابزارها</span><span style={{ width: 70, height: 70, borderRadius: 99, background: "#fff", color: "#111", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>↑</span></div>
  </div>;
};

const VideoCard: React.FC<{ i: Extract<Item, { t: "video" }> }> = ({ i }) => {
  const { t } = useT(); const { p, on } = usePop(i.at); if (!on) return null;
  const c = i.crack !== undefined ? ease(t, i.crack, i.crack + 0.5) : 0;
  const cr = [[0.5,0],[0.46,0.18],[0.54,0.34],[0.47,0.5],[0.55,0.68],[0.5,0.84],[0.52,1]];
  const br = [[0.46,0.18,0.3,0.26],[0.54,0.34,0.7,0.3],[0.47,0.5,0.28,0.58],[0.55,0.68,0.74,0.74],[0.5,0.84,0.34,0.9]];
  return <div style={{ position: "absolute", left: i.x, top: i.y, width: i.w, height: i.h, transform: `translate(-50%,0) rotate(${(i.rot ?? -3) + (1 - p) * 16}deg) scale(${0.5 + 0.5 * p})`, opacity: Math.min(1, p * 2),
    border: "16px solid #fff", borderRadius: 30, overflow: "visible", boxShadow: "0 34px 80px rgba(0,0,0,.55)", background: "#000" }}>
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 14 }}>
      <Loop durationInFrames={Math.max(10, Math.floor((i.dur ?? 3) * 30))}><OffthreadVideo src={staticFile(i.src)} muted playbackRate={i.rate ?? 1} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></Loop>
      {i.crack !== undefined && (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
          <polyline points={cr.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")} fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="200" strokeDashoffset={200 * (1 - c)} />
          <polyline points={cr.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")} fill="none" stroke="#111" strokeWidth="0.5" strokeDasharray="200" strokeDashoffset={200 * (1 - c)} />
          {br.map(([x, y, x2, y2], k) => <line key={k} x1={x * 100} y1={y * 100} x2={x2 * 100} y2={y2 * 100} stroke="#fff" strokeWidth="0.7" strokeDasharray="60" strokeDashoffset={60 * (1 - c)} />)}
        </svg>
      )}
    </div>
    {i.tape && <div style={{ position: "absolute", left: "50%", top: -34, width: 220, height: 56, transform: "translateX(-50%) rotate(-4deg)", background: "rgba(255,212,0,.85)", boxShadow: "0 4px 12px rgba(0,0,0,.3)" }} />}
  </div>;
};

const SceneView: React.FC<{ s: CScene }> = ({ s }) => {
  const { t } = useT();
  const inn = ease(t, s.start, s.start + 0.22), out = 1 - ease(t, s.end - 0.06, s.end + 0.16);
  const op = Math.min(inn, out);
  if (t < s.start - 0.01 || t > s.end + 0.2) return null;
  const zoom = 1 + (t - s.start) * 0.012 + (1 - inn) * 0.08;
  const rot = (1 - inn) * -1.5;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) rotate(${rot}deg)` }}>
        <Bg k={s.bg} t0={s.start} />
        {s.items.map((it, k) => {
          switch (it.t) {
            case "id": return <IdCard key={k} i={it} />;
            case "sticker": return <Sticker key={k} i={it} />;
            case "big": return <Big key={k} i={it} />;
            case "num": return <Num key={k} i={it} />;
            case "bubble": return <Bubble key={k} i={it} />;
            case "chat": return <Chat key={k} i={it} />;
            case "video": return <VideoCard key={k} i={it} />;
            case "arrow": return <Arrow key={k} at={it.at} x={it.x} y={it.y} />;
            case "handle": return <div key={k} style={{ position: "absolute", left: 0, right: 0, top: it.y, textAlign: "center", fontFamily: V, fontWeight: 900, fontSize: 70, color: "#fff", direction: "ltr", textShadow: "0 6px 24px rgba(0,0,0,.5)" }}>@techrooz_fa</div>;
          }
          return null;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Subs: React.FC<{ lines: TipLine[]; hot: string[] }> = ({ lines, hot }) => {
  const { t, fps } = useT();
  const line = lines.find((l) => t >= l.start && t < l.end + 0.12);
  if (!line) return null;
  const words = line.text.split(/\s+/);
  const chunks: string[][] = [];
  for (let k = 0; k < words.length; k += 3) chunks.push(words.slice(k, k + 3));
  const total = chunks.reduce((a, c) => a + c.join(" ").length, 0);
  let acc = line.start, idx = 0;
  for (let k = 0; k < chunks.length; k++) { const d = (chunks[k].join(" ").length / total) * (line.end - line.start); if (t < acc + d || k === chunks.length - 1) { idx = k; break; } acc += d; }
  const local = (t - acc) * fps;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1560, direction: "rtl", textAlign: "center", fontFamily: V, fontWeight: 900, fontSize: 78, lineHeight: 1.35 }}>
      {chunks[idx].map((w, k) => {
        const pp = interpolate(local - k * 2.5, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const isHot = hot.some((h) => w.includes(h));
        return <span key={k} style={{ display: "inline-block", margin: "0 10px", opacity: pp, transform: `translateY(${(1 - pp) * 20}px) scale(${0.9 + 0.1 * pp})`,
          color: isHot ? "#111" : "#fff", background: isHot ? "#FFD400" : "transparent", padding: isHot ? "0 18px" : 0, borderRadius: 16,
          WebkitTextStroke: isHot ? "0" : "10px #000", paintOrder: "stroke fill" as any, textShadow: isHot ? "none" : "0 6px 20px rgba(0,0,0,.6)" }}>{w}</span>;
      })}
    </div>
  );
};

export const Collage: React.FC<CollageProps> = ({ scenes, lines, hot, seconds }) => {
  const { t } = useT();
  return (
    <AbsoluteFill style={{ direction: "ltr", background: "#000" }}>
      {scenes.map((s, i) => <SceneView key={i} s={s} />)}
      <Subs lines={lines} hot={hot} />
      <div style={{ position: "absolute", top: 60, left: 50, fontFamily: L, fontSize: 54, color: "#fff", WebkitTextStroke: "8px #000", paintOrder: "stroke fill" as any }}>تک‌روز</div>
      <div style={{ position: "absolute", top: 0, right: 0, height: 9, background: "#FFD400", width: `${(t / seconds) * 100}%` }} />
    </AbsoluteFill>
  );
};
