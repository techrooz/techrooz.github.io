// "Iso": isometric clay/voxel scenes on charcoal (style ref: @alimoqdm.dev), calm kinetic Persian titles, cyan + orange accents.
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { V } from "./fontLocal";
const FPS = 30; const OR = "#ff7a1a"; const CY = "#19c9ff"; const BG = "#13161b";
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
export type ILabel = { x: number; y: number; text: string; c?: "or" | "cy" | "wh" };
export type IScene = { start: number; end: number; img?: string; iz?: number; iy?: number; ox?: number; oy?: number; title: string; hl?: string[]; sub?: string; labels?: ILabel[]; pills?: string[]; pillNote?: string; kind?: "cta"; kw?: string; bg?: string };
export type IProps = { seconds: number; scenes: IScene[] };
const col = (c?: string) => (c === "or" ? OR : c === "cy" ? CY : "#fff");
const Title: React.FC<{ s: IScene; dur: number }> = ({ s, dur }) => {
  const t = useCurrentFrame() / FPS; const ws = s.title.split(" "); const n = ws.length;
  const out = ease((t - (dur - 0.3)) / 0.3);
  return (<div style={{ position: "absolute", left: 40, right: 40, top: 1190, direction: "rtl", textAlign: "center", opacity: 1 - out }}>
    <div style={{ fontFamily: V, fontSize: 92, fontWeight: 900, lineHeight: 1.32, color: "#fff" }}>
      {ws.map((w, i) => { const at = 0.35 + i * Math.min(0.28, 1.6 / n); const k = ease((t - at) / 0.45); const hl = (s.hl || []).some(h => w.includes(h));
        return <span key={i} style={{ display: "inline-block", margin: "0 10px", opacity: k, transform: `translateY(${(1 - k) * 34}px)`, filter: `blur(${(1 - k) * 8}px)`, color: hl ? OR : "#fff", textShadow: hl ? `0 0 46px ${OR}88` : undefined }}>{w}</span>; })}
    </div>
    {s.sub && <div style={{ marginTop: 22, direction: "ltr", fontFamily: V, fontWeight: 700, fontSize: 38, letterSpacing: 0.5, color: "#ffffff99", opacity: ease((t - 0.9) / 0.5) }}>{s.sub}</div>}
    {s.pills && <div style={{ marginTop: 34, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, direction: "rtl", fontFamily: V, opacity: ease((t - 1.3) / 0.5) }}>
      {s.pills.map((p, i) => (<React.Fragment key={i}>{i > 0 && <span style={{ fontSize: 48, color: OR, fontWeight: 900 }}>◂</span>}<span style={{ display: "inline-block", fontSize: 50, fontWeight: 900, color: "#fff", border: `3px solid ${CY}`, background: "#19c9ff18", borderRadius: 40, padding: "6px 34px", boxShadow: `0 0 34px ${CY}55` }}>{p}</span></React.Fragment>))}
    </div>}
  </div>);
};
const Scn: React.FC<{ s: IScene }> = ({ s }) => {
  const t = useCurrentFrame() / FPS; const dur = s.end - s.start; const k = ease(t / 0.6);
  const fade = Math.min(1, t * 6) * (1 - ease((t - (dur - 0.15)) / 0.15) * 0);
  const B = s.bg ?? BG;
  return (<AbsoluteFill style={{ background: B }}>
    {s.img && <div style={{ position: "absolute", inset: 0, transformOrigin: `${s.ox ?? 50}% ${s.oy ?? 30}%`, transform: `translateY(${(s.iy ?? 0) + (1 - k) * 50}px) scale(${((s.iz ?? 1) + t * 0.022) * (0.94 + 0.06 * k)})`, opacity: fade }}>
      <Img src={staticFile(s.img)} style={{ width: "100%", height: "100%", WebkitMaskImage: "radial-gradient(ellipse 72% 62% at 50% 42%, #000 55%, transparent 100%)", maskImage: "radial-gradient(ellipse 72% 62% at 50% 42%, #000 55%, transparent 100%)" }} />
      {(s.labels || []).map((l, i) => { const kk = ease((t - 0.7 - i * 0.25) / 0.4); const c = col(l.c);
        return <div key={i} style={{ position: "absolute", left: l.x, top: l.y, transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * kk})`, opacity: kk, fontFamily: V, fontWeight: 900, fontSize: 64, color: "#fff", background: "#0e1116cc", border: `4px solid ${c}`, borderRadius: 26, padding: "4px 30px", boxShadow: `0 0 40px ${c}88`, whiteSpace: "nowrap", direction: "ltr" }}>{l.text}</div>; })}
    </div>}
    <div style={{ position: "absolute", left: 0, right: 0, top: 1210, height: 710, background: `linear-gradient(transparent,${B} 42%)` }} />
    {s.kind === "cta" ? <Cta s={s} /> : <Title s={s} dur={dur} />}
  </AbsoluteFill>);
};
const Cta: React.FC<{ s: IScene }> = ({ s }) => {
  const t = useCurrentFrame() / FPS; const k = ease(t / 0.45);
  return (<div style={{ position: "absolute", left: 110, right: 110, top: 520, fontFamily: V, direction: "rtl", transform: `scale(${0.85 + 0.15 * k})`, opacity: k }}>
    <div style={{ background: "#151a22", border: `3px solid ${CY}`, borderRadius: 48, padding: "54px 40px", textAlign: "center", boxShadow: `0 0 90px ${CY}44` }}>
      <div style={{ fontSize: 56, fontWeight: 800, color: "#ffffffbb" }}>چک‌لیست کامل؟ کامنت کن:</div>
      <div style={{ fontSize: 190, fontWeight: 900, color: OR, lineHeight: 1.25, textShadow: `0 0 60px ${OR}88` }}>{s.kw}</div>
    </div></div>);
};
const Tag: React.FC<{ total: number }> = ({ total }) => { const t = useCurrentFrame() / FPS; return (<>
  <div style={{ position: "absolute", left: 60, right: 60, top: 70, height: 5, borderRadius: 3, background: "#ffffff1f" }}><div style={{ width: `${Math.min(100, (t / total) * 100)}%`, height: "100%", borderRadius: 3, background: CY }} /></div>
  <div style={{ position: "absolute", left: 60, top: 110, direction: "rtl", fontFamily: V, fontWeight: 900, fontSize: 40, color: "#fff", background: "#ffffff14", border: `2px solid ${CY}99`, borderRadius: 30, padding: "4px 28px" }}>تک‌روز</div></>); };
const End: React.FC<{ start: number }> = ({ start }) => { const t = useCurrentFrame() / FPS - start; if (t < 0) return null; const k = ease(t / 0.4);
  return (<AbsoluteFill style={{ background: BG, opacity: Math.min(1, t * 8), fontFamily: V, direction: "rtl", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", transform: `scale(${0.85 + 0.15 * k})` }}>
      <div style={{ width: 240, height: 240, margin: "0 auto", borderRadius: 66, background: OR, color: "#fff", fontWeight: 900, fontSize: 130, lineHeight: "240px", boxShadow: `0 0 110px ${OR}99` }}>AI</div>
      <div style={{ marginTop: 46, fontSize: 190, fontWeight: 900, color: "#fff", lineHeight: 1 }}>تک‌روز</div>
      <div style={{ marginTop: 22, fontSize: 50, fontWeight: 800, color: "#ffffffaa" }}>هوش مصنوعی و تکنولوژی</div>
      <div style={{ marginTop: 16, fontSize: 46, fontWeight: 800, color: CY, direction: "ltr" }}>@techrooz.fa</div>
      <div style={{ marginTop: 40, display: "inline-block", fontSize: 54, fontWeight: 900, color: "#fff", border: `3px solid ${OR}`, borderRadius: 40, padding: "6px 36px" }}>کامنت کن: <span style={{ color: OR }}>حافظه</span></div></div></AbsoluteFill>); };
export const Iso: React.FC<IProps> = ({ scenes, seconds }) => (<AbsoluteFill style={{ background: BG }}>
  {scenes.map((s, i) => (<Sequence key={i} from={Math.round(s.start * FPS)} durationInFrames={Math.max(1, Math.round((s.end - s.start) * FPS))}><Scn s={s} /></Sequence>))}
  <Tag total={seconds} /><End start={seconds - 1.9} /></AbsoluteFill>);
