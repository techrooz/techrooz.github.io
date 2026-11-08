// "Kin": clean kinetic-typography explainer (ref @mgh.mobin): cream/charcoal scenes, one orange accent, soft 3D renders, UI cards.
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { V } from "./fontLocal";
const FPS = 30; const OR = "#ff7a1a"; const CR = "#f0eade"; const CH = "#17181c";
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const fa = (n: number) => String(Math.round(n)).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
export type KScene = { start: number; end: number; bg: "cream" | "dark"; text: string; hl?: string[]; img?: string; iz?: number; iy?: number; kind?: "count" | "toggle" | "cta" | "list"; title?: string; sub?: string; note?: string; items?: string[]; cur?: number; a?: number; b?: number; label?: string; kw?: string };
export type KProps = { seconds: number; scenes: KScene[]; story?: boolean };
const Words: React.FC<{ s: KScene; dur: number }> = ({ s, dur }) => {
  const t = useCurrentFrame() / FPS; const ws = s.text.split(" "); const dk = s.bg === "dark";
  const tot = ws.reduce((a, w) => a + w.length + 1, 0); let acc = 0;
  return (<div style={{ position: "absolute", left: 80, right: 80, top: 1215, direction: "rtl", textAlign: "center", fontFamily: V, fontSize: 84, fontWeight: 900, lineHeight: 1.38, color: dk ? "#fff" : "#1b1a1a" }}>
    {ws.map((w, i) => { const at = 0.15 + (acc / tot) * Math.min(dur * 0.8, 3.2); acc += w.length + 1; const k = ease((t - at) / 0.28); const hl = (s.hl || []).some(h => w.includes(h));
      return <span key={i} style={{ display: "inline-block", margin: "0 9px", opacity: k, transform: `translateY(${(1 - k) * 36}px) scale(${hl ? 1 + 0.12 * Math.sin(Math.min(1, (t - at) / 0.5) * Math.PI) : 1})`, filter: `blur(${(1 - k) * 9}px)`, color: hl ? OR : undefined, textShadow: hl && dk ? `0 0 40px ${OR}88` : undefined }}>{w}</span>; })}
  </div>);
};
const Count: React.FC<{ s: KScene; dur: number }> = ({ s, dur }) => {
  const t = useCurrentFrame() / FPS; const a = s.a ?? 0, b = s.b ?? 80; const p = Math.min(1, t / Math.max(1, dur * 0.8)); const v = a + (b - a) * (s.a === 80 ? Math.pow(p, 0.35) : 1 - Math.pow(1 - p, 3));
  const k = ease(t / 0.4);
  return (<div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", fontFamily: V, direction: "rtl", opacity: k, transform: `scale(${0.85 + 0.15 * k})` }}>
    <div style={{ fontSize: 330, fontWeight: 900, color: OR, lineHeight: 1, textShadow: `0 0 80px ${OR}77` }}>{fa(v)}٪</div>
    <div style={{ margin: "40px auto 0", width: 800, height: 46, borderRadius: 23, background: "#ffffff1f", overflow: "hidden" }}><div style={{ width: `${v}%`, height: "100%", borderRadius: 23, background: `linear-gradient(90deg,#ffb347,${OR})` }} /></div>
    {s.label && <div style={{ marginTop: 40, display: "inline-block", fontSize: 50, fontWeight: 800, color: "#fff", border: `3px solid ${OR}`, borderRadius: 40, padding: "6px 34px", opacity: ease((t - 0.6) / 0.4) }}>{s.label}</div>}
  </div>);
};
const Toggle: React.FC<{ s: KScene }> = ({ s }) => {
  const t = useCurrentFrame() / FPS; const k = ease(t / 0.4); const on = ease((t - 1.0) / 0.3);
  return (<div style={{ position: "absolute", left: 90, right: 90, top: 470, opacity: k, transform: `scale(${0.9 + 0.1 * k})`, fontFamily: V, direction: "rtl" }}>
    <div style={{ background: "#24262c", borderRadius: 48, padding: "56px 54px", border: "2px solid #ffffff1a", boxShadow: "0 30px 80px #0009" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 56, fontWeight: 900, color: "#fff" }}>{s.title ?? "شارژ بهینه"}</div><div style={{ fontSize: 34, fontWeight: 700, color: "#ffffff88", direction: "ltr", textAlign: "right", marginTop: 8 }}>{s.sub ?? "Optimized Charging"}</div></div>
        <div style={{ width: 190, height: 104, borderRadius: 52, background: on > 0.5 ? OR : "#555", position: "relative", boxShadow: on > 0.5 ? `0 0 50px ${OR}99` : "none" }}><div style={{ position: "absolute", top: 8, left: 8 + 86 * on, width: 88, height: 88, borderRadius: 44, background: "#fff" }} /></div>
      </div>
      <div style={{ marginTop: 40, height: 3, background: "#ffffff14" }} />
      <div style={{ marginTop: 36, fontSize: 40, fontWeight: 700, color: "#ffffffb0", opacity: ease((t - 1.3) / 0.4) }}>{s.note ?? "شارژ تا ۸۰٪ سریع، بعدش آروم و امن"}</div>
    </div></div>);
};
const List: React.FC<{ s: KScene }> = ({ s }) => {
  const t = useCurrentFrame() / FPS; const items = s.items || []; const cur = s.cur ?? -1;
  return (<div style={{ position: "absolute", left: 80, right: 80, top: 400, fontFamily: V, direction: "rtl" }}>
    {items.map((it, i) => { const k = ease((t - 0.15 - i * 0.18) / 0.35); const on = i === cur;
      return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 30, padding: "30px 36px", borderRadius: 40, opacity: k * (cur < 0 || on ? 1 : 0.35), transform: `translateX(${(1 - k) * 90}px) scale(${on ? 1.04 : 1})`, background: on ? "#2b2118" : "#24262c", border: `3px solid ${on ? OR : "#ffffff14"}`, boxShadow: on ? `0 0 60px ${OR}55` : "none" }}>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: on ? OR : "#3a3d45", color: "#fff", fontSize: 50, fontWeight: 900, textAlign: "center", lineHeight: "84px", flex: "none" }}>{fa(i + 1)}</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>{it}</div></div>); })}
  </div>);
};
const Cta: React.FC<{ s: KScene }> = ({ s }) => {
  const t = useCurrentFrame() / FPS; const k = ease(t / 0.4);
  return (<div style={{ position: "absolute", left: 110, right: 110, top: 480, fontFamily: V, direction: "rtl", transform: `scale(${k})` }}>
    <div style={{ background: "#24262c", border: `3px solid ${OR}`, borderRadius: 48, padding: 56, textAlign: "center", boxShadow: `0 0 80px ${OR}55` }}>
      <div style={{ fontSize: 50, fontWeight: 800, color: "#ffffffaa" }}>کامنت کن:</div>
      <div style={{ fontSize: 170, fontWeight: 900, color: OR, lineHeight: 1.2 }}>{s.kw}</div>
    </div></div>);
};
const Scn: React.FC<{ s: KScene }> = ({ s }) => {
  const t = useCurrentFrame() / FPS; const dur = s.end - s.start; const dk = s.bg === "dark"; const k = ease(t / 0.55);
  return (<AbsoluteFill style={{ background: dk ? CH : CR }}>
    <AbsoluteFill style={{ background: dk ? `radial-gradient(circle at 50% 30%,${OR}30,transparent 60%)` : (s.img ? "none" : "radial-gradient(circle at 50% 35%,#fff,transparent 65%)") }} />
    {s.img && <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 40%", transform: `translateY(${(s.iy ?? 0) + (1 - k) * 80}px) scale(${((s.iz ?? 1.15) + t * 0.025) * (0.92 + 0.08 * k)})`, opacity: Math.min(1, t * 5) }}><Img src={staticFile(s.img)} style={{ width: "100%", height: "100%" }} /></div>}
    {s.img && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 420, background: `linear-gradient(transparent,${CR} 25%)` }} />}
    {s.img && <div style={{ position: "absolute", right: 0, bottom: 0, width: 360, height: 380, background: CR }} />}
    {s.kind === "count" && <Count s={s} dur={dur} />}
    {s.kind === "toggle" && <Toggle s={s} />}
    {s.kind === "list" && <List s={s} />}
    {s.kind === "cta" && <Cta s={s} />}
    <Words s={s} dur={dur} />
  </AbsoluteFill>);
};
const Brand: React.FC<{ total: number; bar?: boolean }> = ({ total, bar = true }) => { const t = useCurrentFrame() / FPS; return (<>
  {bar && <div style={{ position: "absolute", left: 60, right: 60, top: 205, height: 6, borderRadius: 3, background: "#7f7f7f33" }}><div style={{ width: `${Math.min(100, (t / total) * 100)}%`, height: "100%", borderRadius: 3, background: OR }} /></div>}
  <div style={{ position: "absolute", right: 60, top: 235, display: "flex", alignItems: "center", gap: 14, direction: "rtl", fontFamily: V }}><div style={{ width: 60, height: 60, borderRadius: 18, background: OR, color: "#fff", fontWeight: 900, fontSize: 32, textAlign: "center", lineHeight: "60px" }}>AI</div><div style={{ fontWeight: 900, fontSize: 44, color: "#fff", mixBlendMode: "difference" }}>تک‌روز</div></div></>); };
const End: React.FC<{ start: number }> = ({ start }) => { const t = useCurrentFrame() / FPS - start; if (t < 0) return null; const k = ease(t / 0.4);
  return (<AbsoluteFill style={{ background: CH, opacity: Math.min(1, t * 8), fontFamily: V, direction: "rtl", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", transform: `scale(${0.8 + 0.2 * k})` }}><div style={{ width: 240, height: 240, margin: "0 auto", borderRadius: 66, background: OR, color: "#fff", fontWeight: 900, fontSize: 130, lineHeight: "240px", boxShadow: `0 0 110px ${OR}99` }}>AI</div>
      <div style={{ marginTop: 46, fontSize: 190, fontWeight: 900, color: "#fff", lineHeight: 1 }}>تک‌روز</div><div style={{ marginTop: 22, fontSize: 50, fontWeight: 800, color: "#ffffffaa" }}>هوش مصنوعی و تکنولوژی</div><div style={{ marginTop: 16, fontSize: 46, fontWeight: 800, color: OR, direction: "ltr" }}>@techrooz.fa</div></div></AbsoluteFill>); };
export const Kin: React.FC<KProps> = ({ scenes, seconds, story }) => (<AbsoluteFill style={{ background: CH }}>
  {scenes.map((s, i) => (<Sequence key={i} from={Math.round(s.start * FPS)} durationInFrames={Math.max(1, Math.round((s.end - s.start) * FPS))}><Scn s={s} /></Sequence>))}
  <Brand total={seconds} bar={!story} />{!story && <End start={seconds - 1.9} />}</AbsoluteFill>);
