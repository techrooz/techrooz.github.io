// "RenderReel": detailed AI-render images brought alive (camera push/pan, crash-zoom, colour grade per scene, embers, light sweep, callouts) - style target @scroll.engineer.
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { V } from "./fontLocal";
import { Brand, EndCard } from "./Mob";
import { Callout } from "./ColdVis";
import { Subs, Tag } from "./Cine";
const FPS = 30; const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const rnd = (i: number, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
export type RCall = { px: number; py: number; tx: number; ty: number; label: string; t0: number; color?: string };
export type RScene = { start: number; end: number; img: string; z0: number; z1: number; x0: number; x1: number; y0: number; y1: number; rot?: number; tint: string; ember?: string; tag?: string; calls?: RCall[]; kw?: string; big?: string };
export type RProps = { seconds: number; scenes: RScene[]; subs: any[] };
const Scene: React.FC<{ s: RScene }> = ({ s }) => {
  const f = useCurrentFrame(); const t = f / FPS; const d = s.end - s.start; const k = Math.min(1, t / d);
  const crash = 1 + 0.22 * Math.pow(1 - ease(t / 0.45), 2);
  const z = (s.z0 + (s.z1 - s.z0) * k) * crash; const x = s.x0 + (s.x1 - s.x0) * k, y = s.y0 + (s.y1 - s.y0) * k;
  const rot = (s.rot || 0) * (k - 0.5);
  const flash = interpolate(t, [0, 0.08, 0.35], [0.7, 0.5, 0], cl);
  const sweep = ((t * 0.5) % 1.6) - 0.3;
  return (<AbsoluteFill style={{ background: "#05060a", overflow: "hidden" }}>
    <AbsoluteFill style={{ transform: `translate(${x}px,${y}px) scale(${z}) rotate(${rot}deg)`, transformOrigin: "50% 45%" }}><Img src={staticFile(s.img)} style={{ width: 1080, height: 1920, objectFit: "cover" }} /></AbsoluteFill>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${s.tint}55, transparent 62%)`, mixBlendMode: "screen" }} />
    <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${sweep * 100 - 12}%, #ffffff26 ${sweep * 100}%, transparent ${sweep * 100 + 12}%)` }} />
    <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 34 }).map((_, i) => { const sp = 60 + rnd(i, 2) * 140; const yy = (1900 - ((t * sp + rnd(i, 3) * 1900) % 1900)); const xx = rnd(i, 1) * 1080 + Math.sin(t * 2 + i) * 24; return <circle key={i} cx={xx} cy={yy} r={2 + rnd(i, 4) * 5} fill={s.ember || s.tint} opacity={0.35 + 0.5 * rnd(i, 5)} />; })}
      {(s.calls || []).map((c, i) => <Callout key={i} {...c} />)}
    </svg>
    {s.big && <div style={{ position: "absolute", top: 420, left: 0, right: 0, textAlign: "center", direction: "rtl", fontFamily: V, fontSize: 120, fontWeight: 900, color: "#fff", textShadow: `0 0 50px ${s.tint}`, opacity: ease((t - 0.2) / 0.4), transform: `scale(${0.8 + 0.2 * ease((t - 0.2) / 0.4)})` }}>{s.big}</div>}
    {s.kw && <div style={{ position: "absolute", left: 120, right: 120, top: 540, fontFamily: V, transform: `scale(${ease(t / 0.4)})` }}><div style={{ background: "#14161dee", border: `2px solid ${s.tint}`, borderRadius: 40, padding: 44, boxShadow: `0 0 60px ${s.tint}66` }}><div style={{ fontSize: 38, fontWeight: 800, color: "#ffffff99", direction: "rtl" }}>کامنت کن:</div><div style={{ fontSize: 110, fontWeight: 900, color: s.tint, direction: "rtl" }}>{s.kw}</div></div><div style={{ textAlign: "center", marginTop: 40, fontSize: 54, fontWeight: 900, color: "#fff", opacity: ease((t - 1.2) / 0.5) }}>چک‌لیست ۵ قدمی تو دایرکت 📩</div></div>}
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 190, background: "linear-gradient(transparent,#05060a 55%)" }} /><AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 55%, #000000aa 100%)" }} />
    {s.tag && <Tag label={s.tag} />}
  </AbsoluteFill>);
};
export const RenderReel: React.FC<RProps> = ({ scenes, seconds, subs }) => (
  <AbsoluteFill style={{ background: "#05060a" }}>
    {scenes.map((s, i) => <Sequence key={i} from={Math.round(s.start * FPS)} durationInFrames={Math.max(1, Math.round((s.end - s.start) * FPS))}><Scene s={s} /></Sequence>)}
    <Subs subs={subs} /><Brand total={seconds} /><EndCard start={seconds - 1.9} />
  </AbsoluteFill>);
