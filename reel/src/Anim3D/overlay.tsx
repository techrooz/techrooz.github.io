// Anim3D HTML overlays: mono Label chips (projected from 3D), bottom-third word-by-word Persian subtitles, top-left chapter tag with progress dots.
import React from "react";
import { V } from "../fontLocal";
import { clamp01, outBack, outCubic } from "./timeline";
export const OR = "#ff7a1a", CY = "#19c9ff", YE = "#ffc233", BGC = "#0e1116";
export const MONO = "'JetBrains Mono','DejaVu Sans Mono',monospace";
export type ChipSpec = { t0: number; t1: number; at: [number, number, number]; text: string | ((t: number) => string); color?: string; fa?: boolean; size?: number; dx?: number; dy?: number };
/** pops above an object: scale .8->1 + fade in 0.25 s, fades out 0.2 s before t1. */
export const Chips: React.FC<{ t: number; chips: ChipSpec[]; proj: (p: [number, number, number]) => { x: number; y: number } }> = ({ t, chips, proj }) => (<>
  {chips.map((c, i) => {
    if (t < c.t0 || t > c.t1 + 0.01) return null;
    const k = outBack(clamp01((t - c.t0) / 0.3)), o = clamp01((t - c.t0) / 0.15) * clamp01((c.t1 - t) / 0.2);
    const { x, y } = proj(c.at); const col = c.color ?? "#fff"; const sz = c.size ?? 34; const txt = typeof c.text === "function" ? c.text(t) : c.text;
    return (<div key={i} style={{ position: "absolute", left: x + (c.dx ?? 0), top: y + (c.dy ?? 0), transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * k})`, opacity: o, whiteSpace: "nowrap",
      fontFamily: c.fa ? V : MONO, fontWeight: c.fa ? 800 : 700, fontSize: c.fa ? sz * 1.2 : sz, letterSpacing: c.fa ? 0 : 1.5, color: col, direction: c.fa ? "rtl" : "ltr",
      background: "#0b0d12ee", border: `3px solid ${col}`, borderRadius: 16, padding: c.fa ? "2px 26px 6px" : "8px 24px", boxShadow: `0 0 34px ${col}55` }}>{txt}</div>);
  })}
</>);
export type Word = [string, number, number];
export type Phrase = { from: number; to: number };
/** bottom-third subtitle (y ~72%): words reveal one by one, older words of the phrase dim, keywords = accent pill. Each word is inline-block (Persian shaping). */
export const Subs: React.FC<{ t: number; words: Word[]; phrases: Phrase[]; hl: number[]; top?: number }> = ({ t, words, phrases, hl, top = 1330 }) => {
  let cur = -1;
  for (let i = 0; i < phrases.length; i++) if (t >= words[phrases[i].from][1] - 0.04) cur = i;
  if (cur < 0) return null;
  const ph = phrases[cur]; const lastEnd = words[ph.to][2]; const next = phrases[cur + 1];
  const hideAt = Math.min(lastEnd + 0.55, next ? words[next.from][1] - 0.04 : 1e9);
  if (t > hideAt) return null;
  const fadeOut = clamp01((hideAt - t) / 0.15) ;
  const shown = (i: number) => t >= words[i][1] - 0.04;
  const done = t >= lastEnd + 0.05;
  const idx: number[] = []; for (let i = ph.from; i <= ph.to; i++) idx.push(i);
  let newest = ph.from; idx.forEach((i) => { if (shown(i)) newest = i; });
  return (<div style={{ position: "absolute", left: 70, right: 70, top, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", direction: "rtl", gap: "6px 20px", fontFamily: V, fontWeight: 800, fontSize: 84, lineHeight: 1.3, color: "#fff", opacity: fadeOut }}>
    {idx.map((i) => {
      const a = clamp01((t - (words[i][1] - 0.04)) / 0.2), k = outCubic(a); const isH = hl.includes(i);
      const dim = !done && shown(i) && i !== newest ? 0.55 : 1;
      return (<span key={i} style={{ display: "inline-block", opacity: k * dim, transform: `translateY(${(1 - k) * 18}px) scale(${0.92 + 0.08 * k})`,
        color: isH ? OR : "#fff", background: isH ? "#2a1608" : "transparent", border: isH ? `3px solid ${OR}77` : "3px solid transparent", borderRadius: 18, padding: "0 16px 6px", textShadow: "0 3px 24px #000" }}>{words[i][0]}</span>);
    })}
  </div>);
};
export const TopTag: React.FC<{ t: number; chapters: { from: number; name: string }[] }> = ({ t, chapters }) => {
  let ci = 0; chapters.forEach((c, i) => { if (t >= c.from) ci = i; });
  const pop = outBack(clamp01((t - chapters[ci].from) / 0.35));
  return (<div style={{ position: "absolute", left: 70, top: 250, display: "flex", alignItems: "center", gap: 26, padding: "16px 30px 16px 26px", background: "#ffffff0d", border: "2px solid #ffffff1c", borderRadius: 28, backdropFilter: "blur(4px)" }}>
    <div style={{ display: "flex", alignItems: "center", width: 190 }}>
      {chapters.map((_, i) => (<React.Fragment key={i}>{i > 0 && <div style={{ flex: 1, height: 3, background: i <= ci ? CY + "bb" : "#ffffff22" }} />}
        <div style={{ width: 22, height: 22, borderRadius: 11, flex: "none", background: i <= ci ? CY : "#ffffff30", boxShadow: i === ci ? `0 0 20px ${CY}` : "none", transform: i === ci ? `scale(${0.8 + 0.2 * pop})` : "none" }} /></React.Fragment>))}
    </div>
    <div style={{ fontFamily: MONO, lineHeight: 1.1 }}><div style={{ fontSize: 22, letterSpacing: 4, color: "#ffffff77", fontWeight: 600 }}>STORAGE</div>
      <div style={{ fontSize: 40, letterSpacing: 2, color: CY, fontWeight: 800, opacity: pop, transform: `translateY(${(1 - pop) * 8}px)` }}>{chapters[ci].name}</div></div>
  </div>);
};
export const Watermark: React.FC = () => (<div style={{ position: "absolute", left: 0, right: 0, top: 196, textAlign: "center", fontFamily: V, fontWeight: 800, fontSize: 36, color: "#ffffff40", letterSpacing: 1 }}>@techrooz.fa · تک‌روز</div>);
