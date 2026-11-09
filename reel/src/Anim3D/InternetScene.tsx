// "Internet3D": ONE 3D data pipe. Pipe doubles, empty/fast moment, Wirth's-law plaque, 3 cargo kinds flood in, page-weight towers, speed vs felt-speed bars, keyword card.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { V } from "../fontLocal";
import voice from "./voice_internet.json";
import { camAt, CameraRig, CamKey, projector } from "./camera";
import { BlockField, Glow, Item } from "./primitives";
import { CY, OR, YE, MONO, Subs, Word } from "./overlay";
import { clamp01, inCubic, inOutCubic, kf, mix, outBack, outCubic, prog, rnd } from "./timeline";
const W = 1080, H = 1920;
export const FPS = 30; export const TOTAL = 43.6; const T_END = 41.3;
const words = voice.words as Word[];
const phrases = (voice.phrases as number[][]).map(([from, to]) => ({ from, to }));
const HL = voice.hl as number[];
const C = (h: string) => new THREE.Color(h);
const lerpC = (a: string, b: string, k: number) => "#" + C(a).lerp(C(b), clamp01(k)).getHexString();
const PINK = "#ff5c8a", GRN = "#5be7a9", VIO = "#b07bff";
const SMALL = 1e-4;
// ---- flow speed S(t) ----
const VK: [number, number][] = [[0, 5], [1.0, 5], [1.9, 36], [11, 36], [14.5, 12], [16.5, 6], [22, 3], [31, 1.6], [60, 1.0]];
const vAt = (t: number) => kf(t, VK);
const SC = new Float32Array(60 * 60 + 3); { let s = 0; for (let i = 0; i < SC.length; i++) { SC[i] = s; s += vAt(i / 60) / 60; } }
const S = (t: number) => { const x = Math.min(59.9, Math.max(0, t)) * 60, i = Math.floor(x); return SC[i] + (SC[i + 1] - SC[i]) * (x - i); };
const widen = (t: number) => prog(t, 1.0, 0.8, inOutCubic);
const pipeW = (t: number) => 5 * (1 + widen(t));
const bloat = (t: number) => prog(t, 10.4, 3.8, inOutCubic);
const jamAt = (t: number) => clamp01((11 - vAt(t)) / 7);
const dens = (t: number) => kf(t, [[0, 0.5], [1.8, 0.5], [2.7, 0.14], [8.8, 0.12], [11, 0.35], [14.5, 0.7], [16, 0.55], [22, 0.25], [60, 0.2]]);
const PL = 196.8, ZT = 40, CELL = 1.25;
// ---- data cubes (always flowing) ----
const buildCubes = (t: number): Item[] => {
  const out: Item[] = []; const s = S(t), d = dens(t), b = bloat(t), w = widen(t), v = vAt(t); const st = 1 + clamp01((v - 6) / 30) * 3.2;
  for (let l = 0; l < 8; l++) for (let r = 0; r < 24; r++) { const id = l * 24 + r; const z = ZT - ((r * 8.2 + l * 2.3 + s) % PL);
    const outer = l < 2 || l > 5 ? w : 1; const vis = clamp01((d - rnd(id + 5)) * 6) * outer * clamp01((ZT - 1 - z) / 4) * clamp01((z + 150) / 30); const q = (0.95 + 0.9 * b * (0.6 + rnd(id + 9) * 0.8)) * vis + SMALL;
    out.push({ p: [(l - 3.5) * CELL * (outer > 0.01 ? 1 : 1), 0.15 + 0.5 * q, z], s: [q, q, q * st], c: lerpC(CY, OR, clamp01(b * 1.3 - rnd(id + 11) * 0.5)) }); }
  return out;
};
// ---- cargo ----
type Cargo = { kind: 1 | 2 | 3; a: number; dur: number; l: number; z0: number };
const cargo: Cargo[] = [];
for (let j = 0; j < 18; j++) cargo.push({ kind: 1, a: 16.9 + j * 0.085, dur: 1.4, l: (j * 3) % 8, z0: 22 - j * 3.8 });
for (let j = 0; j < 15; j++) cargo.push({ kind: 2, a: 18.6 + j * 0.12, dur: 1.5, l: (j * 5 + 1) % 8, z0: 20 - j * 4.4 });
for (let j = 0; j < 20; j++) cargo.push({ kind: 3, a: 20.8 + j * 0.07, dur: 1.0, l: (j * 7 + 2) % 8, z0: 24 - j * 3.3 });
const buildCargo = (t: number): Item[] => {
  const out: Item[] = [];
  cargo.forEach((c) => {
    const e = clamp01((t - c.a) / c.dur); const pad = () => { out.push({ p: [0, -9, 0], s: [SMALL, SMALL, SMALL], c: "#000" }, { p: [0, -9, 0], s: [SMALL, SMALL, SMALL], c: "#000" }); };
    if (t < c.a) return pad();
    const x = (c.l - 3.5) * CELL; const zz = ZT - ((ZT - c.z0 + S(t) - S(c.a)) % PL); const wrap = clamp01((ZT - 1 - zz) / 5) * clamp01((zz + 150) / 30);
    const sc = 1.25 * wrap + SMALL;
    if (c.kind === 1) { const pz = zz - (1 - outCubic(e)) * 110; const k = sc * clamp01(e * 6);
      out.push({ p: [x, 0.15 + 1.4 * k, pz], s: [1.5 * k, 2.8 * k, 0.4 * k], c: "#dfe8ff" }, { p: [x, 0.15 + 2.55 * k, pz + 0.05 * k], s: [1.5 * k, 0.5 * k, 0.5 * k], c: lerpC(CY, OR, clamp01((t - c.a) / 3)) }); }
    else if (c.kind === 2) { const ee = outCubic(e); const px = mix(x + 46, x, ee), py = 0.15 + 0.8 * sc + 5 * Math.sin(Math.PI * ee); const k = sc * mix(0.3, 1, ee);
      out.push({ p: [px, py, zz], s: [2.2 * k, 1.5 * k, 3.4 * k], c: VIO }, { p: [px, py + 0.8 * k, zz], s: [1.5 * k, 0.3 * k, 2.4 * k], c: "#f4eaff" }); }
    else { const f = inCubic(e); const py = mix(34, 0.15 + 0.75 * sc, f); const k = sc;
      out.push({ p: [x, py, zz], s: [1.5 * k, 1.5 * k, 1.5 * k], c: YE }, { p: [x, py + 0.8 * k, zz], s: [0.9 * k, 0.2 * k, 0.9 * k], c: "#1c2430" }); }
  });
  return out;
};
const buildGantries = (t: number): Item[] => {
  const out: Item[] = []; const s = S(t), Wd = pipeW(t), col = lerpC(CY, OR, jamAt(t));
  for (let i = 0; i < 4; i++) { const z = ZT - ((i * 49.2 + s) % PL); if (z > 30) continue; out.push({ p: [-Wd / 2 - 0.4, 3, z], s: [0.35, 6, 0.35], c: col }, { p: [Wd / 2 + 0.4, 3, z], s: [0.35, 6, 0.35], c: col }, { p: [0, 6.1, z], s: [Wd + 1.2, 0.3, 0.35], c: col }); }
  return out;
};
const buildMarks = (t: number): Item[] => {
  const out: Item[] = []; const so = S(t), Wd = pipeW(t), w = widen(t);
  for (const j of [-2, -1, 0, 1, 2, 3, -3]) { const x = (j + 0.5) * CELL; const sw = Math.abs(j) <= 1 ? 1 : w; for (let k = 0; k < 40; k++) { const z = ZT - ((k * 7 + so) % 280); out.push({ p: [x, 0.13, z], s: [0.16 * sw + SMALL, 0.05, 2.6 * sw + SMALL], c: "#7487a6" }); } }
  void Wd; return out;
};
const buildStreaks = (t: number): Item[] => {
  const out: Item[] = []; const so = S(t), k = clamp01((vAt(t) - 20) / 16) * (1 - bloat(t));
  for (let i = 0; i < 44; i++) { const x = (rnd(i + 70) - 0.5) * 24, y = 0.4 + rnd(i + 71) * 7; const z = ZT - ((i * 4.1 + so * 1.4) % 170); out.push({ p: [x, y, z], s: [0.08 * k + SMALL, 0.08 * k + SMALL, 9 * k + SMALL], c: i % 5 === 0 ? "#ffffff" : CY }); }
  return out;
};
const CITY: Item[] = (() => {
  const o: Item[] = []; const BC = ["#151b26", "#1a2230", "#202a3a", "#121822", "#1d2636"];
  for (const sd of [-1, 1]) for (let col = 0; col < 4; col++) for (let r = 0; r < 34; r++) { const i = col * 100 + r + (sd > 0 ? 500 : 0); if (rnd(i) < 0.12) continue; if (sd < 0 && ZT + 6 - r * 7.4 > -10 && ZT + 6 - r * 7.4 < 46) continue;
    const x = sd * (19 + col * 7.4 + rnd(i + 1) * 2), z = ZT + 6 - r * 7.4 + rnd(i + 2) * 2; const h = 3 + rnd(i + 3) * 9 + col * 3, bw = 4 + rnd(i + 5) * 2.6;
    o.push({ p: [x, h / 2 - 0.3, z], s: [bw, h, bw + rnd(i + 6) * 1.5], c: BC[Math.floor(rnd(i + 7) * 5)] });
    if (rnd(i + 8) < 0.35) o.push({ p: [x - sd * (bw / 2), 1 + rnd(i + 12) * (h - 1.5), z], s: [0.15, 0.5, 2.4], c: rnd(i + 9) < 0.5 ? CY : OR }); }
  return o; })();
// ---- camera ----
const CAM: CamKey[] = [
  { t: 0, d: 20, yaw: 205, el: 12, tx: 0, ty: 3.5, tz: 44 }, { t: 1.0, d: 24, yaw: 192, el: 14, tx: 0, ty: 3.5, tz: 42 }, { t: 1.4, d: 50, yaw: 270, el: 55, tx: 0, ty: 2, tz: 26 }, { t: 1.9, d: 44, yaw: 350, el: 18, tx: 0, ty: 2, tz: 16 },
  { t: 2.9, d: 78, yaw: -14, el: 30, tx: 0, ty: 1, tz: -4 }, { t: 2.98, d: 30, yaw: -22, el: 17, tx: 0, ty: 2, tz: 14 }, { t: 5.5, d: 34, yaw: -14, el: 18, tx: 0, ty: 2, tz: 6 },
  { t: 5.68, d: 10, yaw: 0, el: 2, tx: 0, ty: 3.4, tz: 46 }, { t: 8.5, d: 10, yaw: 0, el: 2, tx: 0, ty: 3.4, tz: -50 },
  { t: 8.85, d: 36, yaw: -50, el: 24, tx: -9, ty: 9, tz: -4 }, { t: 12.5, d: 36, yaw: 20, el: 22, tx: -9, ty: 9, tz: -4 }, { t: 14.4, d: 40, yaw: 38, el: 24, tx: -9, ty: 8, tz: -3 },
  { t: 14.9, d: 95, yaw: 6, el: 42, tx: 0, ty: 0, tz: -4 }, { t: 16.7, d: 95, yaw: 4, el: 40, tx: 0, ty: 0, tz: -4 }, { t: 16.85, d: 20, yaw: -4, el: 7, tx: 0, ty: 1.6, tz: 18 }, { t: 18.5, d: 22, yaw: 0, el: 8, tx: 0, ty: 1.6, tz: -20 },
  { t: 18.62, d: 50, yaw: 30, el: 40, tx: 6, ty: 2, tz: -2 }, { t: 20.6, d: 52, yaw: 22, el: 42, tx: 5, ty: 2, tz: -2 }, { t: 20.75, d: 84, yaw: 0, el: 76, tx: 0, ty: 0, tz: -6 }, { t: 22.3, d: 100, yaw: 4, el: 70, tx: 0, ty: 0, tz: -6 },
  { t: 22.42, d: 62, yaw: -22, el: 28, tx: -17, ty: 5, tz: 2 }, { t: 30.8, d: 56, yaw: 22, el: 26, tx: -17, ty: 5, tz: 2 },
  { t: 30.95, d: 110, yaw: 0, el: 72, tx: 0, ty: 0, tz: -8 }, { t: 34, d: 100, yaw: 14, el: 58, tx: 0, ty: 0, tz: -8 }, { t: 37.0, d: 130, yaw: 24, el: 42, tx: 0, ty: 0, tz: -20 }, { t: 43.6, d: 190, yaw: 38, el: 38, tx: 0, ty: 0, tz: -30 }];
// ---- props ----
const Router: React.FC<{ t: number }> = ({ t }) => { if (t > 5.5) return null; const p = prog(t, 1.0, 0.5) * (1 - prog(t, 1.9, 0.5)); const sc = 1 + 0.45 * widen(t); const kk = t > 3 ? 0.9 : 1;
  return (<group position={[0, 0.6, 44]} scale={sc * kk * (1 - prog(t, 5.0, 0.4))}>
    <mesh position={[0, 0.7, 0]}><boxGeometry args={[9, 1.4, 5]} /><meshStandardMaterial color="#1b2535" roughness={0.5} /></mesh>
    <mesh position={[0, 1.45, 0]}><boxGeometry args={[9.2, 0.1, 5.2]} /><meshBasicMaterial color={CY} toneMapped={false} /></mesh>
    {[-3, -1.5, 0, 1.5, 3].map((x, i) => (<React.Fragment key={i}><mesh position={[x, 0.7, -2.55]}><boxGeometry args={[0.5, 0.3, 0.1]} /><meshBasicMaterial color={i === 2 ? OR : GRN} toneMapped={false} /></mesh><Glow p={[x, 0.7, -2.8]} size={1.8 + 2.5 * p} color={i === 2 ? OR : GRN} opacity={0.8} /></React.Fragment>))}
    {[-3.6, -1.2, 1.2, 3.6].map((x, i) => (<mesh key={i} position={[x, 4.2, 1.2]} rotation={[0, 0, (i - 1.5) * 0.14]}><cylinderGeometry args={[0.18, 0.18, 6, 8]} /><meshStandardMaterial color="#2b3442" emissive={CY} emissiveIntensity={0.3 + 0.8 * p} /></mesh>))}
    <Glow p={[0, 3, -1]} size={14 + 12 * p} color={CY} opacity={0.35 + 0.4 * p} />
  </group>); };
const Plaque: React.FC<{ t: number }> = ({ t }) => { const k = outBack(prog(t, 8.85, 0.6)) * (1 - prog(t, 14.6, 0.35)); if (k < 0.02) return null; const p = prog(t, 10.2, 4.0, inOutCubic);
  const h1 = mix(1, 3.2, p), h2 = mix(1, 7.2, Math.pow(p, 1.3));
  return (<group position={[-9, 9 + 0.3 * Math.sin(t * 1.3), -4]} rotation={[0, 0.35 + 0.1 * Math.sin(t * 0.7), 0]} scale={k}>
    <mesh><boxGeometry args={[11, 8.4, 0.4]} /><meshStandardMaterial color="#0f1622" roughness={0.6} emissive={CY} emissiveIntensity={0.08} /></mesh>
    {[[0, 4.2, 11.2, 0.12], [0, -4.2, 11.2, 0.12], [-5.5, 0, 0.12, 8.4], [5.5, 0, 0.12, 8.4]].map(([x, y, w, h], i) => (<mesh key={i} position={[x, y, 0.25]}><boxGeometry args={[w, h, 0.12]} /><meshBasicMaterial color={CY} toneMapped={false} /></mesh>))}
    <mesh position={[-2.4, -3.4 + h1 / 2, 0.9]}><boxGeometry args={[2.2, h1, 1.2]} /><meshStandardMaterial color={CY} emissive={CY} emissiveIntensity={0.5} /></mesh>
    <mesh position={[2.4, -3.4 + h2 / 2, 0.9]}><boxGeometry args={[2.2, h2, 1.2]} /><meshStandardMaterial color={OR} emissive={OR} emissiveIntensity={0.5} /></mesh>
    <Glow p={[0, 0, 2]} size={16} color={CY} opacity={0.35} />
  </group>); };
const Towers: React.FC<{ t: number }> = ({ t }) => { const k = outBack(prog(t, 22.42, 0.5)); if (k < 0.02) return null; const a = outBack(prog(t, 23.0, 0.7));
  const slabs: React.ReactNode[] = [];
  slabs.push(<mesh key="a" position={[-3.2, 0.4 + 0.5 * a, 0]} scale={[1, Math.max(SMALL, a), 1]}><boxGeometry args={[4, 1, 4]} /><meshStandardMaterial color={CY} emissive={CY} emissiveIntensity={0.25} /></mesh>);
  for (let j = 0; j < 5; j++) { if (t < 28.3 + j * 0.42) continue; const e = outBack(prog(t, 28.3 + j * 0.42, 0.45)); const hh = j === 4 ? 0.6 : 1; slabs.push(<mesh key={j} position={[3.2, 0.4 + j * 1.12 + 0.5 * hh * e, 0]} scale={[1, Math.max(SMALL, hh * e), 1]}><boxGeometry args={[4, 1, 4]} /><meshStandardMaterial color={lerpC(YE, OR, j / 4)} emissive={OR} emissiveIntensity={0.25} /></mesh>); }
  return (<group position={[-17, 0, 2]} scale={k}>
    <mesh position={[0, 0.1, 0]}><boxGeometry args={[12, 0.4, 6.4]} /><meshStandardMaterial color="#171c25" roughness={0.6} /></mesh>
    {[[0, 0.31, -3.2, 12, 0.08], [0, 0.31, 3.2, 12, 0.08]].map(([x, y, z, w, h], i) => (<mesh key={i} position={[x, y, z]}><boxGeometry args={[w, h, 0.1]} /><meshBasicMaterial color={CY} toneMapped={false} /></mesh>))}
    {slabs}<Glow p={[0, 4, 0]} size={16} color={CY} opacity={0.25} />
  </group>); };
const Lamps: React.FC<{ t: number }> = ({ t }) => (<>{Array.from({ length: 26 }).map((_, i) => { const z = ZT - ((i * 8 + S(t) * 1.0) % 208); const s = i % 2 ? 1 : -1; return <Glow key={i} p={[s * (pipeW(t) / 2 + 2.2), 4.2, z]} size={4} color={s > 0 ? CY : OR} opacity={0.7} />; })}</>);
// ---- HTML overlay ----
type Chip = { t0: number; t1: number; at?: [number, number, number]; scr?: [number, number]; text: string; color?: string; size?: number; mono?: boolean };
const chips: Chip[] = [
  { t0: 0.2, t1: 1.0, scr: [540, 470], text: "اینترنت  ×۱", size: 54, color: "#ffffff" },
  { t0: 1.05, t1: 2.95, scr: [540, 470], text: "دو برابر سریع‌تر!", size: 64, color: CY },
  { t0: 3.0, t1: 4.7, scr: [540, 540], text: "باز هم کند؟!", size: 120, color: OR },
  { t0: 4.75, t1: 5.65, scr: [540, 640], text: "؟", size: 220, color: YE },
  { t0: 5.85, t1: 8.5, scr: [540, 470], text: "روزای اول: پرواز!", size: 56, color: GRN },
  { t0: 6.6, t1: 8.5, scr: [540, 590], text: "تقریباً خالی و تندرو", size: 36, color: "#ffffff" },
  { t0: 9.05, t1: 14.4, scr: [540, 420], text: "قانون ویرت", size: 40, color: YE },
  { t0: 9.4, t1: 14.4, scr: [540, 520], text: "WIRTH'S LAW · 1995", size: 26, color: CY, mono: true },
  { t0: 10.4, t1: 14.4, scr: [540, 610], text: "یه گفته‌ی معروف (نه قانون فیزیکی)", size: 34, color: "#ffffff" },
  { t0: 11.6, t1: 14.4, at: [-11.4, 5.2, -4], text: "سخت‌افزار", size: 26, color: CY },
  { t0: 11.6, t1: 14.4, at: [-6.6, 5.2, -4], text: "نرم‌افزار", size: 26, color: OR },
  { t0: 15.0, t1: 16.8, scr: [540, 520], text: "سه بار تازه!", size: 80, color: OR },
  { t0: 17.0, t1: 18.6, scr: [540, 470], text: "صفحه‌های سنگین‌تر", size: 52, color: CY },
  { t0: 18.7, t1: 20.7, scr: [540, 470], text: "ویدیوی ۴K", size: 62, color: VIO },
  { t0: 20.85, t1: 22.4, scr: [540, 470], text: "آپدیت پس‌زمینه", size: 52, color: YE },
  { t0: 23.3, t1: 30.8, at: [-20.2, 3.3, 2], text: "۲۰۱۴", size: 30, color: CY, mono: true },
  { t0: 37.0, t1: 41.3, scr: [540, 470], text: "", size: 10 },
];
const ChipsX: React.FC<{ t: number; proj: (p: [number, number, number]) => { x: number; y: number } }> = ({ t, proj }) => (<>
  {chips.map((c, i) => { if (!c.text || t < c.t0 || t > c.t1 + 0.01) return null; const sz = c.size ?? 34, k = outBack(clamp01((t - c.t0) / 0.3)), o = clamp01((t - c.t0) / 0.15) * clamp01((c.t1 - t) / 0.2);
    let x: number, y: number; if (c.scr) { [x, y] = c.scr; } else { const q = proj(c.at!); const wEst = c.text.length * sz * 0.75 + 70; x = Math.min(W - 24 - wEst / 2, Math.max(24 + wEst / 2, q.x)); y = Math.max(400, q.y); }
    const col = c.color ?? "#fff", big = sz > 100;
    return (<div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * k})`, opacity: o, whiteSpace: "nowrap", fontFamily: c.mono ? MONO : V, fontWeight: 800, fontSize: c.mono ? sz : sz * 1.2, color: col, direction: c.mono ? "ltr" : "rtl",
      background: big ? "transparent" : "#0b0d12ee", border: big ? "none" : `3px solid ${col}`, borderRadius: 16, padding: big ? 0 : c.mono ? "6px 24px" : "2px 26px 6px", textShadow: big ? `0 0 60px ${col}aa, 0 6px 30px #000` : undefined, boxShadow: big ? undefined : `0 0 34px ${col}55` }}>{c.text}</div>); })}
</>);
const CHAPTERS = [{ from: 0, name: "HOOK" }, { from: 5.66, name: "FAST" }, { from: 8.9, name: "WIRTH" }, { from: 14.98, name: "CARGO" }, { from: 22.4, name: "DATA" }, { from: 30.86, name: "FEEL" }];
const TopTag2: React.FC<{ t: number }> = ({ t }) => {
  let ci = 0; CHAPTERS.forEach((c, i) => { if (t >= c.from) ci = i; }); const pop = outBack(clamp01((t - CHAPTERS[ci].from) / 0.35));
  return (<div style={{ position: "absolute", left: 70, top: 250, display: "flex", alignItems: "center", gap: 26, padding: "16px 30px 16px 26px", background: "#ffffff0d", border: "2px solid #ffffff1c", borderRadius: 28 }}>
    <div style={{ display: "flex", alignItems: "center", width: 190 }}>
      {CHAPTERS.map((_, i) => (<React.Fragment key={i}>{i > 0 && <div style={{ flex: 1, height: 3, background: i <= ci ? CY + "bb" : "#ffffff22" }} />}
        <div style={{ width: 22, height: 22, borderRadius: 11, flex: "none", background: i <= ci ? CY : "#ffffff30", boxShadow: i === ci ? `0 0 20px ${CY}` : "none", transform: i === ci ? `scale(${0.8 + 0.2 * pop})` : "none" }} /></React.Fragment>))}
    </div>
    <div style={{ fontFamily: MONO, lineHeight: 1.1 }}><div style={{ fontSize: 22, letterSpacing: 4, color: "#ffffff77", fontWeight: 600 }}>INTERNET</div>
      <div style={{ fontSize: 40, letterSpacing: 2, color: CY, fontWeight: 800, opacity: pop, transform: `translateY(${(1 - pop) * 8}px)` }}>{CHAPTERS[ci].name}</div></div>
  </div>); };
const Wm: React.FC = () => (<div style={{ position: "absolute", left: 0, right: 0, top: 196, textAlign: "center", fontFamily: V, fontWeight: 800, fontSize: 36, color: "#ffffff40", letterSpacing: 1 }}>@techrooz.fa · تک‌روز</div>);
const Panel: React.FC<{ t: number; s: number; e: number; rows: { label: string; val: string; p: number; col: string }[]; note: string }> = ({ t, s, e, rows, note }) => {
  if (t < s || t > e) return null; const o = clamp01((t - s) / 0.3) * clamp01((e - t) / 0.3); const k = outBack(clamp01((t - s) / 0.5));
  return (<div style={{ position: "absolute", left: 90, right: 90, top: 400, opacity: o, transform: `scale(${0.9 + 0.1 * k})`, direction: "rtl", fontFamily: V, background: "#0b0e14ee", border: "3px solid #ffffff22", borderRadius: 40, padding: "30px 40px 24px", boxShadow: "0 0 80px #000a" }}>
    {rows.map((r, i) => (<div key={i} style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ fontSize: 46, fontWeight: 800, color: "#ffffffcc" }}>{r.label}</span><span style={{ fontSize: 66, fontWeight: 900, color: r.col, textShadow: `0 0 36px ${r.col}88`, direction: "rtl" }}>{r.val}</span></div>
      <div style={{ direction: "ltr", height: 26, borderRadius: 13, background: "#ffffff14", overflow: "hidden", marginTop: 6 }}><div style={{ width: `${r.p * 100}%`, height: "100%", background: r.col, boxShadow: `0 0 24px ${r.col}`, borderRadius: 13 }} /></div></div>))}
    <div style={{ fontSize: 28, fontWeight: 700, color: "#ffffff77", textAlign: "center" }}>{note}</div>
  </div>); };
const fa = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const Cta: React.FC<{ t: number }> = ({ t }) => { const s = 37.0; if (t < s || t > T_END) return null; const k = outBack(clamp01((t - s - 0.1) / 0.5));
  return (<div style={{ position: "absolute", left: 110, right: 110, top: 520, fontFamily: V, direction: "rtl", textAlign: "center", opacity: clamp01((t - s) / 0.2), transform: `scale(${0.8 + 0.2 * k})` }}>
    <div style={{ background: "#0e1218f2", border: `3px solid ${OR}`, borderRadius: 48, padding: "44px 30px", boxShadow: `0 0 90px ${OR}55` }}>
      <div style={{ fontSize: 54, fontWeight: 800, color: "#ffffffcc" }}>کامنت کن:</div>
      <div style={{ fontSize: 170, fontWeight: 900, color: OR, lineHeight: 1.25, textShadow: `0 0 60px ${OR}88` }}>اینترنت</div>
      <div style={{ fontSize: 40, fontWeight: 800, color: CY }}>۳ ترفند کم‌کردن مصرف دیتا</div></div></div>); };
const End: React.FC<{ t: number }> = ({ t }) => { const s = t - T_END; if (s < 0) return null; const k = outCubic(clamp01(s / 0.4));
  return (<AbsoluteFill style={{ background: "#0e1116", opacity: clamp01(s * 8), fontFamily: V, direction: "rtl", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", transform: `scale(${0.85 + 0.15 * k})` }}>
      <div style={{ width: 240, height: 240, margin: "0 auto", borderRadius: 66, background: OR, boxShadow: `0 0 110px ${OR}99`, display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
        {[0, 1, 2].map((i) => (<div key={i} style={{ width: 22, height: 130, borderRadius: 11, background: "#fff", opacity: i === 1 ? 1 : 0.7 }} />))}</div>
      <div style={{ marginTop: 46, fontSize: 190, fontWeight: 900, color: "#fff", lineHeight: 1 }}>تک‌روز</div>
      <div style={{ marginTop: 22, fontSize: 50, fontWeight: 800, color: "#ffffffaa" }}>هوش مصنوعی و تکنولوژی</div>
      <div style={{ marginTop: 16, fontSize: 46, fontWeight: 800, color: CY, direction: "ltr", fontFamily: MONO }}>@techrooz.fa</div>
      <div style={{ marginTop: 40, display: "inline-block", fontSize: 54, fontWeight: 900, color: "#fff", border: `3px solid ${OR}`, borderRadius: 40, padding: "6px 36px" }}>کامنت کن: <span style={{ color: OR }}>اینترنت</span></div></div></AbsoluteFill>); };
const pulse = (t: number, t0: number, d = 0.14) => Math.max(0, 1 - Math.abs(t - t0) / d);
export const Internet3D: React.FC = () => {
  const t = useCurrentFrame() / FPS; const cam = camAt(t, CAM, kf(t, [[0, 24], [8.5, 24], [8.85, 28], [14, 28], [14.9, 24], [60, 24]])); cam.ty -= 2.0; const proj = projector(cam, W, H);
  const Wd = pipeW(t), jam = jamAt(t), edge = lerpC(CY, OR, jam);
  const flash = pulse(t, 1.05, 0.12) * 0.55 + pulse(t, 3.0, 0.1) * 0.8 + pulse(t, 5.66, 0.1) * 0.35 + pulse(t, 8.85, 0.1) * 0.3 + pulse(t, 14.98, 0.1) * 0.35 + pulse(t, 22.42, 0.1) * 0.3 + pulse(t, 30.9, 0.1) * 0.3 + pulse(t, 37.0, 0.1) * 0.3;
  const shake = (t > 3.0 && t < 3.3) || (t > 14.98 && t < 15.25);
  return (<AbsoluteFill style={{ background: "#0e1116" }}>
    <ThreeCanvas width={W} height={H} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }} camera={{ fov: 24, position: [0, 40, 60], near: 1, far: 500 }} style={{ position: "absolute", inset: 0, transform: shake ? `translate(${7 * Math.sin(t * 90)}px, ${7 * Math.cos(t * 77)}px)` : undefined }}>
      <color attach="background" args={["#0e1116"]} /><fog attach="fog" args={["#0e1116", 90, 250]} />
      <CameraRig cam={cam} />
      <ambientLight intensity={1.2} color="#c9d6ff" /><directionalLight position={[-14, 26, 16]} intensity={2.0} /><directionalLight position={[16, 10, -10]} intensity={0.8} color="#7fd8ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}><planeGeometry args={[700, 700]} /><meshStandardMaterial color="#0c0f14" roughness={1} /></mesh>
      <mesh position={[0, 0, -60]}><boxGeometry args={[Wd, 0.2, 420]} /><meshStandardMaterial color="#1a1e27" roughness={0.9} /></mesh>
      {[-1, 1].map((s) => (<mesh key={s} position={[s * Wd / 2, 0.3, -60]}><boxGeometry args={[0.3, 0.5, 420]} /><meshBasicMaterial color={edge} toneMapped={false} /></mesh>))}
      <Lamps t={t} />
      <BlockField items={CITY} /><BlockField items={buildMarks(t)} /><BlockField items={buildGantries(t)} /><BlockField items={buildStreaks(t)} /><BlockField items={buildCubes(t)} /><BlockField items={buildCargo(t)} />
      <Router t={t} /><Plaque t={t} /><Towers t={t} />
    </ThreeCanvas>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 40%, transparent 55%, #05070a 100%)", pointerEvents: "none" }} />
    <AbsoluteFill style={{ background: "#07090c", opacity: prog(t, 37.0, 0.6) * 0.5, pointerEvents: "none" }} />
    <ChipsX t={t} proj={proj} /><TopTag2 t={t} /><Wm />
    <Panel t={t} s={24.6} e={30.85} note="میانه‌ی وزن صفحه‌ی موبایل (حدودی) · HTTP Archive، Web Almanac 2024" rows={[
      { label: "۲۰۱۴", val: "حدود ۰٫۵ مگابایت", p: 0.22 * prog(t, 25.0, 0.8), col: CY }, { label: "۲۰۲۴", val: "حدود ۲٫۳ مگابایت", p: prog(t, 29.0, 1.6), col: OR }]} />
    <Panel t={t} s={31.1} e={36.9} note="نمودار ساده‌شده برای توضیح؛ عدد دقیق نیست" rows={[
      { label: "سرعت اینترنت", val: "×" + fa(Math.round(1 + prog(t, 31.5, 1.8))), p: 0.25 + 0.75 * prog(t, 31.5, 1.8), col: CY }, { label: "حس سرعت", val: "تقریباً ثابت", p: 0.25 + 0.04 * prog(t, 33.4, 1.5), col: OR }]} />
    {t > 34.2 && t < 36.9 && <div style={{ position: "absolute", left: 0, right: 0, top: 1000, textAlign: "center", fontFamily: V, fontWeight: 800, fontSize: 48, color: "#fff", opacity: clamp01((t - 34.2) / 0.3) * clamp01((36.9 - t) / 0.3) }}><span style={{ background: "#0b0d12ee", border: `3px solid ${YE}`, borderRadius: 16, padding: "2px 26px 8px", color: YE }}>مثل جاده‌ی عریض‌تری که دوباره پر می‌شه</span></div>}
    <Cta t={t} />
    <Subs t={t} words={words} phrases={phrases} hl={HL} />
    <AbsoluteFill style={{ background: t > 2.95 && t < 3.4 ? "#ff7a1a" : "#fff", opacity: Math.min(1, flash), pointerEvents: "none" }} />
    <End t={t} />
  </AbsoluteFill>); };
