// "QR3D": a big 3D QR board made of blocks. Hole still scans -> hidden backup (error-correction) blocks light up -> damage meter 7/15/25/30 % -> logo trick -> too much damage fails.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { V } from "../fontLocal";
import voice from "./voice_qr.json";
import { QR } from "./qrdata";
import { camAt, CameraRig, CamKey } from "./camera";
import { BlockField, Glow, Item, Slab } from "./primitives";
import { CY, OR, YE, MONO, Subs, Word } from "./overlay";
import { clamp01, inOutCubic, outBack, outCubic, prog, rnd, kf } from "./timeline";
const W = 1080, H = 1920;
export const FPS = 30; export const TOTAL = 34.2; const T_END = 32.2;
const words = voice.words as Word[];
const phrases = (voice.phrases as number[][]).map(([from, to]) => ({ from, to }));
const HL = voice.hl as number[];
const C = (h: string) => new THREE.Color(h);
const lerpC = (a: string, b: string, k: number) => "#" + C(a).lerp(C(b), clamp01(k)).getHexString();
const GRN = "#5be7a9", RED = "#ff4d5e", SMALL = 1e-4;
const N = QR.length; const MID = (N - 1) / 2;
const isDark = (r: number, c: number) => QR[r][c] === "1";
const isFn = (r: number, c: number) => (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8) || r === 6 || c === 6 || (r >= 20 && r <= 24 && c >= 20 && c <= 24);
const isEC = (r: number, c: number) => !isFn(r, c) && rnd(r * 61 + c * 7 + 3) < 0.62; // illustrative: which blocks light up as "backup"
const inLogo = (r: number, c: number) => r >= 11 && r <= 17 && c >= 11 && c <= 17;
// damage order: noisy distance from a hole centre in the lower right -> rank 0..1
const RANK: number[] = (() => {
  const a: { i: number; d: number }[] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) a.push({ i: r * N + c, d: Math.hypot(c - 24.5, r - 24.8) + 2.4 * rnd(r * 13 + c * 5 + 9) });
  a.sort((x, y) => x.d - y.d); const out = new Array(N * N); a.forEach((o, k) => (out[o.i] = k / (N * N))); return out;
})();
// ---- damage fraction of all modules over time ----
const damage = (t: number) => {
  const hook = 0.16 * prog(t, 1.1, 0.22, outCubic) * (1 - prog(t, 5.0, 0.7, inOutCubic));
  const lv = (0.07 * prog(t, 11.7, 0.4) + 0.08 * prog(t, 12.4, 0.3) + 0.10 * prog(t, 12.75, 0.4) + 0.05 * prog(t, 14.45, 0.4)) * (1 - prog(t, 17.5, 0.7, inOutCubic));
  const fail = 0.5 * prog(t, 25.0, 1.3, inOutCubic);
  return hook + lv + fail;
};
// scanner sweeps
const SWEEPS = [{ s: 2.3, d: 1.0, ok: true }, { s: 15.0, d: 0.8, ok: true }, { s: 21.8, d: 0.9, ok: true }, { s: 26.0, d: 1.1, ok: false }];
const edgeCol = (t: number) => { let c = CY; for (const w of SWEEPS) if (t > w.s + w.d) { const k = clamp01(1 - (t - w.s - w.d) / (w.ok ? 1.1 : 6)); if (k > 0) c = lerpC(CY, w.ok ? GRN : RED, k > 0.5 ? 1 : k * 2); } return c; };
const buildModules = (t: number): Item[] => {
  const out: Item[] = []; const f = damage(t); const ecK = prog(t, 5.6, 0.5) * (1 - prog(t, 9.9, 0.5));
  const rebuilt = prog(t, 23.5, 0.5) * (1 - prog(t, 24.7, 0.7));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const id = r * N + c; const dark = isDark(r, c);
    const h = clamp01((f - RANK[id]) * 28);
    const born = prog(t, 0.0 + rnd(id) * 0.35, 0.3, outCubic);
    const lit = isEC(r, c) ? clamp01((t - 5.6 - (r + c) / 58 * 1.7) * 4) * (1 - prog(t, 9.9, 0.5)) : 0; void ecK;
    const rb = inLogo(r, c) ? rebuilt : 0;
    let col = dark ? "#2a3650" : "#eef3ff";
    if (lit > 0) col = lerpC(col, dark ? OR : "#ffc58f", lit);
    if (rb > 0) col = lerpC(col, dark ? CY : "#b8f1ff", rb);
    const depth = (dark ? 0.9 : 0.3) + 0.55 * lit + 0.6 * rb;
    const vis = (1 - h) * born; const fly = h * (4 + 8 * rnd(id + 4));
    out.push({ p: [(c - MID) + (rnd(id + 1) - 0.5) * h * 12, (MID - r) + h * (rnd(id + 2) - 0.2) * 7, depth / 2 + fly], s: [0.94 * vis + SMALL, 0.94 * vis + SMALL, depth * vis + SMALL], c: col, ry: h * rnd(id + 3) * 4 });
  }
  return out;
};
const buildDust = (t: number): Item[] => {
  const out: Item[] = [];
  for (let i = 0; i < 80; i++) { const x = (rnd(i + 200) - 0.5) * 110, y = (((rnd(i + 201) * 90 + t * (1.2 + 2 * rnd(i + 202))) % 90) - 45), z = -30 + rnd(i + 203) * 80; const sz = 0.2 + 0.5 * rnd(i + 204);
    out.push({ p: [x, y, z], s: [sz, sz, sz], c: i % 4 === 0 ? OR : i % 4 === 1 ? "#ffffff" : CY, ry: t + i }); }
  return out;
};
const LOGO_ON = 19.9, LOGO_OFF = 23.5;
const Logo: React.FC<{ t: number }> = ({ t }) => {
  const a = prog(t, LOGO_ON, 0.55, outBack) * (1 - prog(t, LOGO_OFF, 0.7, inOutCubic)); if (a < 0.01) return null;
  const z = 1.3 + (1 - prog(t, LOGO_ON, 0.45, outCubic)) * 30 + prog(t, LOGO_OFF, 0.7, inOutCubic) * 20;
  const items: Item[] = [{ p: [0, 0, z], s: [7.3, 7.3, 1.6], c: OR }, { p: [-1.7, 0, z + 1], s: [0.95, 3.6, 0.5], c: "#fff" }, { p: [0, 0, z + 1], s: [0.95, 4.6, 0.5], c: "#fff" }, { p: [1.7, 0, z + 1], s: [0.95, 3.6, 0.5], c: "#fff" }].map((it) => ({ ...it, s: it.s.map((x) => x * a + SMALL) as [number, number, number] }));
  return (<><BlockField items={items} /><Glow p={[0, 0, z + 2]} size={16 * a} color={OR} opacity={0.5} /></>);
};
const Frame: React.FC<{ t: number }> = ({ t }) => {
  const w = SWEEPS.find((s) => t >= s.s - 0.3 && t <= s.s + s.d + 0.7); if (!w) return null; const k = outBack(clamp01((t - w.s + 0.3) / 0.3)) * (1 - prog(t, w.s + w.d + 0.5, 0.2)); const col = w.ok ? GRN : RED; const R = 16.5 + 3 * (1 - k);
  return (<group>{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (<group key={i}>
    <mesh position={[sx * R - sx * 2, sy * R, 2.4]}><boxGeometry args={[4.4, 0.4, 0.4]} /><meshBasicMaterial color={col} toneMapped={false} /></mesh>
    <mesh position={[sx * R, sy * R - sy * 2, 2.4]}><boxGeometry args={[0.4, 4.4, 0.4]} /><meshBasicMaterial color={col} toneMapped={false} /></mesh></group>))}</group>);
};
const Beam: React.FC<{ t: number }> = ({ t }) => {
  const w = SWEEPS.find((s) => t >= s.s && t <= s.s + s.d); if (!w) return null;
  const k = (t - w.s) / w.d; const y = MID + 1 - k * (N + 1); const col = w.ok ? GRN : RED; const fl = w.ok ? 1 : 0.6 + 0.4 * Math.sin(t * 70);
  return (<group>
    <mesh position={[0, y, 2.2]}><boxGeometry args={[N + 3, 0.32, 0.32]} /><meshBasicMaterial color={col} toneMapped={false} /></mesh>
    <mesh position={[0, y + 3, 1.6]}><planeGeometry args={[N + 2, 6]} /><meshBasicMaterial color={col} transparent opacity={0.16 * fl} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
    <Glow p={[0, y, 3]} size={24} color={col} opacity={0.55 * fl} /></group>);
};
const CAM: CamKey[] = [
  { t: 0, d: 70, yaw: -30, el: 9, tx: 0, ty: 0, tz: 0 }, { t: 1.2, d: 50, yaw: -12, el: 4, tx: 5, ty: -4, tz: 0 },
  { t: 2.2, d: 138, yaw: 0, el: 2, tx: 0, ty: -2, tz: 0 }, { t: 3.9, d: 138, yaw: 0, el: 2, tx: 0, ty: -2, tz: 0 },
  { t: 4.6, d: 34, yaw: 26, el: -7, tx: 4, ty: -3, tz: 0 }, { t: 5.5, d: 96, yaw: 62, el: 24, tx: 0, ty: 0, tz: 0 },
  { t: 7.2, d: 72, yaw: 34, el: 58, tx: 0, ty: 0, tz: 0 }, { t: 9.0, d: 100, yaw: -8, el: 10, tx: 0, ty: -1, tz: 0 },
  { t: 10.5, d: 150, yaw: 0, el: 3, tx: 0, ty: 3, tz: 0 }, { t: 11.7, d: 150, yaw: 0, el: 3, tx: 0, ty: 3, tz: 0 },
  { t: 13.2, d: 90, yaw: -24, el: 8, tx: 6, ty: -3, tz: 0 }, { t: 14.8, d: 58, yaw: 15, el: 4, tx: 7, ty: -5, tz: 0 },
  { t: 16.3, d: 150, yaw: 0, el: 3, tx: 0, ty: 3, tz: 0 }, { t: 18.2, d: 130, yaw: 0, el: 2, tx: 0, ty: 0, tz: 0 },
  { t: 19.3, d: 36, yaw: 0, el: 0, tx: 0, ty: 0, tz: 0 }, { t: 21.0, d: 34, yaw: -38, el: 10, tx: 0, ty: 0, tz: 0 },
  { t: 22.8, d: 58, yaw: 26, el: -9, tx: 0, ty: 0, tz: 0 }, { t: 24.2, d: 135, yaw: 0, el: 3, tx: 0, ty: -2, tz: 0 },
  { t: 25.2, d: 72, yaw: 40, el: 12, tx: 6, ty: -4, tz: 0 }, { t: 26.6, d: 110, yaw: 0, el: 2, tx: 0, ty: -2, tz: 0 },
  { t: 28.0, d: 150, yaw: -8, el: 4, tx: 0, ty: 0, tz: 0 }, { t: 60, d: 150, yaw: -8, el: 4, tx: 0, ty: 0, tz: 0 },
];
type Chip = { t0: number; t1: number; scr: [number, number]; text: string; color?: string; size?: number; mono?: boolean };
const chips: Chip[] = [
  { t0: 0.1, t1: 1.1, scr: [540, 440], text: "یه بارکد سالم", size: 50, color: "#fff" },
  { t0: 1.2, t1: 3.2, scr: [540, 440], text: "یه تیکه‌ش پرید!", size: 74, color: OR },
  { t0: 3.35, t1: 4.2, scr: [540, 460], text: "✓ اسکن شد!", size: 110, color: GRN },
  { t0: 4.25, t1: 5.1, scr: [540, 600], text: "چرا؟!", size: 190, color: YE },
  { t0: 6.0, t1: 7.8, scr: [540, 440], text: "نسخه‌ی پشتیبان", size: 66, color: OR },
  { t0: 7.9, t1: 9.3, scr: [540, 440], text: "تصحیح خطا", size: 66, color: CY },
  { t0: 9.35, t1: 10.1, scr: [540, 540], text: "REED-SOLOMON", size: 40, color: YE, mono: true },
  { t0: 16.9, t1: 18.1, scr: [540, 590], text: "بسته به سطح تصحیح خطا", size: 44, color: YE },
  { t0: 20.0, t1: 21.6, scr: [540, 440], text: "لوگو وسطش!", size: 80, color: OR },
  { t0: 21.7, t1: 23.4, scr: [540, 440], text: "اسکنر: «خرابیه»", size: 56, color: "#fff" },
  { t0: 23.55, t1: 24.75, scr: [540, 440], text: "بازسازی شد ✓", size: 72, color: CY },
  { t0: 25.2, t1: 27.2, scr: [540, 440], text: "خیلی بیشتر از ۳۰٪", size: 66, color: RED },
  { t0: 27.3, t1: 28.1, scr: [540, 520], text: "✗ اسکن نشد", size: 120, color: RED },
];
const ChipsX: React.FC<{ t: number }> = ({ t }) => (<>
  {chips.map((c, i) => { if (t < c.t0 || t > c.t1 + 0.01) return null; const sz = c.size ?? 34, k = outBack(clamp01((t - c.t0) / 0.3)), o = clamp01((t - c.t0) / 0.12) * clamp01((c.t1 - t) / 0.18); const big = sz > 100;
    return (<div key={i} style={{ position: "absolute", left: c.scr[0], top: c.scr[1], transform: `translate(-50%,-50%) scale(${0.75 + 0.25 * k})`, opacity: o, whiteSpace: "nowrap", fontFamily: c.mono ? MONO : V, fontWeight: 800, fontSize: c.mono ? sz : sz * 1.2, color: c.color, direction: c.mono ? "ltr" : "rtl",
      background: big ? "transparent" : "#0b0d12ee", border: big ? "none" : `3px solid ${c.color}`, borderRadius: 16, padding: big ? 0 : c.mono ? "6px 24px" : "2px 26px 6px", textShadow: big ? `0 0 60px ${c.color}aa, 0 6px 30px #000` : undefined, boxShadow: big ? undefined : `0 0 34px ${c.color}55` }}>{c.text}</div>); })}
</>);
const CHAPTERS = [{ from: 0, name: "HOOK" }, { from: 5.09, name: "BACKUP" }, { from: 10.11, name: "LEVELS" }, { from: 18.22, name: "LOGO" }, { from: 24.78, name: "LIMIT" }];
const TopTag2: React.FC<{ t: number }> = ({ t }) => {
  let ci = 0; CHAPTERS.forEach((c, i) => { if (t >= c.from) ci = i; }); const pop = outBack(clamp01((t - CHAPTERS[ci].from) / 0.35));
  return (<div style={{ position: "absolute", left: 70, top: 250, display: "flex", alignItems: "center", gap: 26, padding: "16px 30px 16px 26px", background: "#ffffff0d", border: "2px solid #ffffff1c", borderRadius: 28 }}>
    <div style={{ display: "flex", alignItems: "center", width: 190 }}>
      {CHAPTERS.map((_, i) => (<React.Fragment key={i}>{i > 0 && <div style={{ flex: 1, height: 3, background: i <= ci ? CY + "bb" : "#ffffff22" }} />}
        <div style={{ width: 22, height: 22, borderRadius: 11, flex: "none", background: i <= ci ? CY : "#ffffff30", boxShadow: i === ci ? `0 0 20px ${CY}` : "none", transform: i === ci ? `scale(${0.8 + 0.2 * pop})` : "none" }} /></React.Fragment>))}
    </div>
    <div style={{ fontFamily: MONO, lineHeight: 1.1 }}><div style={{ fontSize: 22, letterSpacing: 4, color: "#ffffff77", fontWeight: 600 }}>QR CODE</div>
      <div style={{ fontSize: 40, letterSpacing: 2, color: CY, fontWeight: 800, opacity: pop, transform: `translateY(${(1 - pop) * 8}px)` }}>{CHAPTERS[ci].name}</div></div>
  </div>); };
const Wm: React.FC = () => (<div style={{ position: "absolute", left: 0, right: 0, top: 196, textAlign: "center", fontFamily: V, fontWeight: 800, fontSize: 36, color: "#ffffff40", letterSpacing: 1 }}>@techrooz.fa · تک‌روز</div>);
// damage meter (levels)
const LV = [{ k: "L", pct: "۷٪", t: 11.7, col: CY }, { k: "M", pct: "۱۵٪", t: 12.4, col: CY }, { k: "Q", pct: "۲۵٪", t: 12.75, col: YE }, { k: "H", pct: "۳۰٪", t: 14.45, col: OR }];
const Meter: React.FC<{ t: number }> = ({ t }) => {
  const s = 10.3, e = 18.1; if (t < s || t > e) return null; const o = clamp01((t - s) / 0.3) * clamp01((e - t) / 0.3); const pop = outBack(clamp01((t - s) / 0.5));
  return (<div style={{ position: "absolute", left: 60, right: 60, top: 395, display: "flex", gap: 14, direction: "ltr", opacity: o, transform: `scale(${0.9 + 0.1 * pop})` }}>
    {LV.map((l, i) => { const on = t >= l.t; const a = outBack(clamp01((t - l.t) / 0.35)); const ok = t >= l.t + 0.5;
      return (<div key={i} style={{ flex: 1, background: on ? l.col + "26" : "#0b0d12ee", border: `3px solid ${on ? l.col : "#ffffff30"}`, borderRadius: 22, padding: "8px 0 10px", textAlign: "center", boxShadow: on ? `0 0 36px ${l.col}66` : "none", transform: `scale(${on ? 0.94 + 0.06 * a : 1})` }}>
        <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, color: on ? l.col : "#ffffff66", letterSpacing: 3 }}>LEVEL {l.k}</div>
        <div style={{ fontFamily: V, fontSize: 54, fontWeight: 900, color: on ? "#fff" : "#ffffff44", direction: "rtl", lineHeight: 1.25 }}>{on ? "حدود " : ""}{l.pct}</div>
        <div style={{ fontFamily: V, fontSize: 28, fontWeight: 800, color: ok ? GRN : "transparent", direction: "rtl" }}>✓ بازم اسکن می‌شه</div></div>); })}
  </div>); };
const Cta: React.FC<{ t: number }> = ({ t }) => { const s = 28.1; if (t < s || t > T_END) return null; const k = outBack(clamp01((t - s - 0.1) / 0.5));
  return (<div style={{ position: "absolute", left: 110, right: 110, top: 470, fontFamily: V, direction: "rtl", textAlign: "center", opacity: clamp01((t - s) / 0.2), transform: `scale(${0.8 + 0.2 * k})` }}>
    <div style={{ background: "#0e1218f2", border: `3px solid ${OR}`, borderRadius: 48, padding: "44px 30px", boxShadow: `0 0 90px ${OR}55` }}>
      <div style={{ fontSize: 54, fontWeight: 800, color: "#ffffffcc" }}>کامنت کن:</div>
      <div style={{ fontSize: 190, fontWeight: 900, color: OR, lineHeight: 1.25, textShadow: `0 0 60px ${OR}88` }}>بارکد</div>
      <div style={{ fontSize: 40, fontWeight: 800, color: CY }}>۳ نکته‌ی امن اسکن کردن</div></div></div>); };
const End: React.FC<{ t: number }> = ({ t }) => { const s = t - T_END; if (s < 0) return null; const k = outCubic(clamp01(s / 0.4));
  return (<AbsoluteFill style={{ background: "#0e1116", opacity: clamp01(s * 8), fontFamily: V, direction: "rtl", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", transform: `scale(${0.85 + 0.15 * k})` }}>
      <div style={{ width: 240, height: 240, margin: "0 auto", borderRadius: 66, background: OR, boxShadow: `0 0 110px ${OR}99`, display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
        {[0, 1, 2].map((i) => (<div key={i} style={{ width: 22, height: 130, borderRadius: 11, background: "#fff", opacity: i === 1 ? 1 : 0.7 }} />))}</div>
      <div style={{ marginTop: 46, fontSize: 190, fontWeight: 900, color: "#fff", lineHeight: 1 }}>تک‌روز</div>
      <div style={{ marginTop: 22, fontSize: 50, fontWeight: 800, color: "#ffffffaa" }}>هوش مصنوعی و تکنولوژی</div>
      <div style={{ marginTop: 16, fontSize: 46, fontWeight: 800, color: CY, direction: "ltr", fontFamily: MONO }}>@techrooz.fa</div>
      <div style={{ marginTop: 40, display: "inline-block", fontSize: 54, fontWeight: 900, color: "#fff", border: `3px solid ${OR}`, borderRadius: 40, padding: "6px 36px" }}>کامنت کن: <span style={{ color: OR }}>بارکد</span></div></div></AbsoluteFill>); };
const pulse = (t: number, t0: number, d = 0.14) => Math.max(0, 1 - Math.abs(t - t0) / d);
export const QR3D: React.FC = () => {
  const t = useCurrentFrame() / FPS; const cam = camAt(t, CAM, kf(t, [[0, 24], [4.4, 24], [4.7, 29], [5.5, 24], [60, 24]]));
  const edge = edgeCol(t);
  const flash = pulse(t, 1.15, 0.12) * 0.6 + pulse(t, 3.35, 0.1) * 0.3 + pulse(t, 5.09, 0.1) * 0.3 + pulse(t, 10.11, 0.1) * 0.3 + pulse(t, 18.22, 0.1) * 0.3 + pulse(t, 24.78, 0.1) * 0.35 + pulse(t, 27.3, 0.12) * 0.55 + pulse(t, 28.1, 0.1) * 0.3 + pulse(t, 32.2, 0.1) * 0.3;
  const flashCol = t > 27.2 && t < 27.6 ? RED : t > 1.0 && t < 1.4 ? OR : "#fff";
  const shake = (t > 1.12 && t < 1.4) || (t > 25.0 && t < 25.3) || (t > 27.3 && t < 27.6);
  return (<AbsoluteFill style={{ background: "#0e1116" }}>
    <ThreeCanvas width={W} height={H} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }} camera={{ fov: 24, position: [0, 0, 100], near: 1, far: 500 }} style={{ position: "absolute", inset: 0, transform: shake ? `translate(${8 * Math.sin(t * 90)}px, ${8 * Math.cos(t * 77)}px)` : undefined }}>
      <color attach="background" args={["#0e1116"]} /><fog attach="fog" args={["#0e1116", 130, 330]} />
      <CameraRig cam={cam} />
      <ambientLight intensity={1.15} color="#c9d6ff" /><directionalLight position={[-14, 26, 40]} intensity={2.1} /><directionalLight position={[22, -6, 20]} intensity={0.9} color="#7fd8ff" />
      <group position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}><Slab w={N + 2.2} d={N + 2.2} h={0.6} color="#05070b" edge={edge} t={t} dots={4} glow={1.6} /></group>
      <BlockField items={buildModules(t)} /><BlockField items={buildDust(t)} /><Logo t={t} /><Frame t={t} /><Beam t={t} />
    </ThreeCanvas>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 40%, transparent 55%, #05070a 100%)", pointerEvents: "none" }} />
    <AbsoluteFill style={{ background: "#07090c", opacity: prog(t, 28.1, 0.6) * 0.45, pointerEvents: "none" }} />
    <ChipsX t={t} /><TopTag2 t={t} /><Wm /><Meter t={t} /><Cta t={t} />
    <Subs t={t} words={words} phrases={phrases} hl={HL} />
    <AbsoluteFill style={{ background: flashCol, opacity: Math.min(1, flash), pointerEvents: "none" }} />
    <End t={t} />
  </AbsoluteFill>); };
