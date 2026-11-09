// "Traffic3D": ONE continuous 3D highway. Lanes double, cars leave (empty road), then three streams (side routes, rush-hour clock, metro) flood it. Counter 10% -> ~10%.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { V } from "../fontLocal";
import voice from "./voice_traffic.json";
import { camAt, CameraRig, CamKey, projector } from "./camera";
import { BlockField, Glow, Item } from "./primitives";
import { CY, OR, YE, MONO, Subs, Word } from "./overlay";
import { clamp01, inCubic, inOutCubic, kf, mix, outBack, outCubic, prog, rnd } from "./timeline";
const W = 1080, H = 1920;
export const FPS = 30; export const TOTAL = 55.4; const T_END = 52.6;
const words = voice.words as Word[];
const phrases = (voice.phrases as number[][]).map(([from, to]) => ({ from, to }));
const HL = voice.hl as number[];
const C = (h: string) => new THREE.Color(h);
const lerpC = (a: string, b: string, k: number) => "#" + C(a).lerp(C(b), clamp01(k)).getHexString();
const PINK = "#ff5c8a", GRN = "#5be7a9", LAV = "#a99cf0";
const fa = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const LW = 3.2, SMALL = 1e-4;
// ---- flow speed & integrated offset S(t) ----
const VK: [number, number][] = [[0, 2.5], [2.4, 2.5], [4.6, 30], [18, 30], [19.6, 4], [26, 2.2], [33, 1.2], [60, 1.0]];
const vAt = (t: number) => kf(t, VK);
const SC = new Float32Array(60 * 60 + 3); { let s = 0; for (let i = 0; i < SC.length; i++) { SC[i] = s; s += vAt(i / 60) / 60; } }
const S = (t: number) => { const x = Math.min(59.9, Math.max(0, t)) * 60, i = Math.floor(x); return SC[i] + (SC[i + 1] - SC[i]) * (x - i); };
const widen = (t: number) => prog(t, 1.2, 1.8, inOutCubic);
const roadW = (t: number) => LW * (3 + 3 * widen(t));
const jamAt = (t: number) => clamp01((8 - vAt(t)) / 6);
// ---- cars ----
type Car = { kind: 0 | 1 | 2 | 3 | 4; a: number; z0: number; u3: number; u6: number; col: string; O: [number, number, number]; dur: number };
const SLATES = ["#8a93a3", "#6b7587", "#aab5c8", "#d7dde8", "#4a5365", "#c8ced8"];
const ZS = (r: number, lane: number) => -52 + r * 7.2 + (lane % 2) * 3.4;
const cars: Car[] = [];
for (let l = 0; l < 3; l++) for (let r = 0; r < 12; r++) { const i = l * 12 + r; cars.push({ kind: 0, a: 0, z0: -26 + r * 5.6 + (l % 2) * 2.2, u3: (2 * l + 1) / 6, u6: (2 * l + (r % 2) + 0.5) / 6, col: SLATES[Math.floor(rnd(i + 1) * 6)], O: [0, 0, 0], dur: 0.1 }); }
{
  const used = new Set<string>(); const slots: [number, number][] = []; for (let r = 0; r < 14; r++) for (let l = 0; l < 6; l++) slots.push([r, l]);
  slots.sort((a, b) => rnd(a[0] * 7 + a[1] + 40) - rnd(b[0] * 7 + b[1] + 40));
  const pick = (r0: number, r1: number, n: number) => { const out: [number, number][] = []; for (const s of slots) { if (out.length >= n) break; const k = s.join(","); if (s[0] >= r0 && s[0] <= r1 && !used.has(k)) { used.add(k); out.push(s); } } return out; };
  const T34 = S(34);
  const mk = (kind: 1 | 2 | 3 | 4, sl: [number, number][], a0: number, gap: number, col: (j: number) => string, O: (j: number) => [number, number, number], dur: number) => sl.forEach(([r, l], j) => {
    const a = a0 + j * gap; cars.push({ kind, a, z0: ZS(r, l) + T34 - S(a), u3: 0, u6: (l + 0.5) / 6, col: col(j), O: O(j), dur }); });
  mk(1, pick(0, 6, 24), 18.2, 0.13, () => CY, (j) => [j % 2 ? 40 : -40, 0.2, j % 2 ? 14 : -20], 1.5);
  mk(2, pick(4, 10, 24), 22.0, 0.15, () => YE, () => [36, 10, -26], 1.6);
  mk(3, pick(7, 13, 24), 27.7, 0.16, () => PINK, () => [-26, 0.2, 31], 1.8);
  const bs = pick(3, 13, 8); // bonus cars: +10% driving
  bs.forEach(([r, l], j) => { const a = 42.4 + j * 0.12; cars.push({ kind: 4, a, z0: ZS(r, l) + T34 - S(a), u3: 0, u6: (l + 0.5) / 6, col: OR, O: [(((l + 0.5) / 6) - 0.5) * 19.2, 26, ZS(r, l) + T34 - S(a)], dur: 0.9 }); });
}
type St = { p: [number, number, number]; sc: number; ry: number; k: number };
const carState = (c: Car, t: number): St | null => {
  if (t < c.a) return null; const w = widen(t), Wd = roadW(t); const u = c.kind === 0 ? mix(c.u3, c.u6, w) : c.u6;
  const x = (u - 0.5) * Wd, z = c.z0 - (S(t) - S(c.a)); if (z < -112 || z > 80) return null;
  const e = clamp01((t - c.a) / c.dur), ee = inOutCubic(e); let k = clamp01((t - c.a) / 0.12); if (c.kind === 0) k = 1;
  if (c.kind === 0) return { p: [x, 0.1, z], sc: 1, ry: 0, k };
  const O = c.O; const fx = x, fz = z; let px = mix(O[0], fx, ee), pz = mix(c.kind === 1 ? O[2] : O[2] === 0 ? fz : mix(O[2], fz, 0), fz, c.kind === 1 ? ee : 1);
  if (c.kind === 1) pz = mix(O[2], fz, ee); else if (c.kind === 4) { px = fx; pz = fz; } else pz = mix(O[2], fz, ee);
  let py = mix(O[1], 0.1, c.kind === 4 ? outBack(e) : ee); let sc = 1; let ry = 0;
  if (c.kind === 1) ry = Math.sign(O[0]) * (1 - outCubic(clamp01(e * 1.6))) * (Math.PI / 2);
  if (c.kind === 2) { py += 3 * Math.sin(Math.PI * ee); sc = mix(0.2, 1, outCubic(e)); }
  if (c.kind === 3) sc = mix(0.3, 1, outBack(e));
  if (c.kind === 4) py = Math.max(0.1, mix(O[1], 0.1, outBack(e)));
  return { p: [px, py, pz], sc, ry, k };
};
const buildCars = (t: number): Item[] => {
  const out: Item[] = [];
  cars.forEach((c) => { const s = carState(c, t);
    if (!s) { out.push({ p: [0, -9, 0], s: [SMALL, SMALL, SMALL], c: "#000" }, { p: [0, -9, 0], s: [SMALL, SMALL, SMALL], c: "#000" }); return; }
    const q = s.sc * s.k + SMALL, [x, y, z] = s.p; const ca = Math.cos(s.ry), sa = Math.sin(s.ry);
    const col = c.kind === 3 ? lerpC(PINK, "#e9d5ff", prog(t, c.a + c.dur * 0.6, 0.5)) : c.col;
    out.push({ p: [x, y + 0.2 + 0.4 * q, z], s: [1.9 * q, 0.8 * q, 4.2 * q], c: col, ry: s.ry });
    out.push({ p: [x + 0.3 * q * sa, y + 0.2 + 1.15 * q, z + 0.3 * q * ca], s: [1.55 * q, 0.7 * q, 2.2 * q], c: "#1c2430", ry: s.ry }); });
  return out;
};
const buildMarks = (t: number): Item[] => {
  const out: Item[] = []; const w = widen(t), Wd = roadW(t); const so = S(t);
  for (let j = 1; j <= 5; j++) { const x = (j / 6 - 0.5) * Wd; const sw = j % 2 === 0 ? 1 : clamp01((w - 0.35) / 0.65);
    for (let k = 0; k < 42; k++) { const z = 74 - ((k * 7 + so) % 294); out.push({ p: [x, 0.13, z], s: [0.2 * sw + SMALL, 0.05, 3.2 * sw + SMALL], c: "#dfe6f2" }); } }
  return out;
};
// static city
const CITY: Item[] = (() => {
  const o: Item[] = []; const BC = ["#151b26", "#1a2230", "#202a3a", "#121822", "#1d2636"];
  const excl = (x: number, z: number) => (x < -8 && Math.abs(z + 20) < 6.5) || (x > 8 && Math.abs(z - 14) < 6.5) || (x < -20 && x > -44 && z > 24 && z < 44) || (x > 26 && x < 46 && z > -36 && z < -16);
  for (const sd of [-1, 1]) for (let col = 5; col < 9; col++) for (let r = 0; r < 33; r++) { const i = col * 100 + r + (sd > 0 ? 500 : 0); if (rnd(i) < 0.16) continue;
    const x = sd * (15 + col * 7.2 + rnd(i + 1) * 2), z = -150 + r * 7.4 + rnd(i + 2) * 2; if (excl(x, z)) continue;
    const h = col <= 6 ? 2.5 + rnd(i + 3) * 6 : 6 + rnd(i + 3) * 10, bw = 4 + rnd(i + 5) * 2.6;
    o.push({ p: [x, h / 2 - 0.3, z], s: [bw, h, bw + rnd(i + 6) * 1.5], c: BC[Math.floor(rnd(i + 7) * 5)] });
    if (rnd(i + 8) < 0.28) o.push({ p: [x, h - 0.2, z], s: [bw * 0.9, 0.22, bw * 0.9], c: rnd(i + 9) < 0.5 ? CY : OR }); }
  for (const sd of [-1, 1]) for (let col = 0; col < 3; col++) for (let r = 0; r < 20; r++) { const i = 3000 + col * 50 + r + (sd > 0 ? 400 : 0); const x = sd * (75 + col * 16 + rnd(i) * 6), z = -170 + r * 13 + rnd(i + 1) * 4; const h = 18 + rnd(i + 2) * 40;
    o.push({ p: [x, h / 2 - 0.3, z], s: [8 + rnd(i + 3) * 4, h, 8 + rnd(i + 4) * 4], c: BC[Math.floor(rnd(i + 5) * 5)] }); }
  return o; })();
// ---- camera ----
const CAM: CamKey[] = [
  { t: 0, d: 24, yaw: 4, el: 9, tx: 0, ty: 1, tz: 22 }, { t: 1.2, d: 62, yaw: -8, el: 24, tx: 0, ty: 1.5, tz: 2 }, { t: 3.2, d: 74, yaw: 14, el: 30, tx: 0, ty: 1.5, tz: 0 },
  { t: 3.9, d: 74, yaw: 14, el: 30, tx: 0, ty: 1.5, tz: 0 }, { t: 3.98, d: 26, yaw: -38, el: 7, tx: 6, ty: 1.2, tz: 8 }, { t: 5.2, d: 30, yaw: -30, el: 9, tx: 4, ty: 1.2, tz: 0 },
  { t: 6.6, d: 112, yaw: 0, el: 72, tx: 0, ty: 0, tz: -8 }, { t: 6.9, d: 112, yaw: 0, el: 72, tx: 0, ty: 0, tz: -8 }, { t: 7.8, d: 20, yaw: 0, el: 5, tx: 0, ty: 1.4, tz: 50 },
  { t: 10.6, d: 20, yaw: -6, el: 5, tx: 0, ty: 1.4, tz: -10 }, { t: 10.95, d: 46, yaw: -55, el: 16, tx: -6, ty: 3, tz: -10 }, { t: 16.0, d: 46, yaw: 45, el: 16, tx: -6, ty: 3, tz: 0 },
  { t: 16.5, d: 90, yaw: 8, el: 36, tx: 0, ty: 3, tz: 0 }, { t: 18.0, d: 88, yaw: 0, el: 45, tx: 0, ty: 0, tz: -3 }, { t: 21.3, d: 84, yaw: 8, el: 42, tx: 0, ty: 0, tz: -3 },
  { t: 21.9, d: 38, yaw: 52, el: 13, tx: 20, ty: 6, tz: -4 }, { t: 26.8, d: 40, yaw: 38, el: 12, tx: 18, ty: 5, tz: -4 }, { t: 27.6, d: 60, yaw: -35, el: 22, tx: -26, ty: 2, tz: 30 },
  { t: 30.0, d: 56, yaw: -25, el: 24, tx: -18, ty: 2, tz: 28 }, { t: 30.2, d: 22, yaw: -4, el: 8, tx: 0, ty: 1.4, tz: 44 }, { t: 31.7, d: 22, yaw: 0, el: 8, tx: 0, ty: 1.4, tz: -22 },
  { t: 34.0, d: 112, yaw: 20, el: 55, tx: 0, ty: 0, tz: 0 }, { t: 37.6, d: 106, yaw: -10, el: 60, tx: 0, ty: 0, tz: 0 }, { t: 38.2, d: 72, yaw: 0, el: 78, tx: 0, ty: 0, tz: 6 },
  { t: 44.0, d: 66, yaw: 8, el: 72, tx: 0, ty: 0, tz: 6 }, { t: 48.4, d: 190, yaw: 28, el: 36, tx: 0, ty: 0, tz: -30 }, { t: 55.4, d: 205, yaw: 40, el: 40, tx: 0, ty: 0, tz: -30 }];
// ---- 3D props ----
const Clock: React.FC<{ t: number }> = ({ t }) => {
  const k = outBack(prog(t, 21.5, 0.6)) * (1 - prog(t, 27.3, 0.3)); if (k < 0.02) return null; const rush = prog(t, 22.3, 3.5); const hr = (150 + 95 * rush) * Math.PI / 180, mn = (t - 21.5) * 7;
  const col = lerpC(CY, OR, rush);
  return (<group position={[36, 10, -26]} scale={k} rotation={[0, -0.5, 0]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[4.2, 4.2, 0.7, 40]} /><meshStandardMaterial color="#e8efff" emissive={col} emissiveIntensity={0.55} /></mesh>
    <mesh rotation={[0, 0, 0]} position={[0, 0, 0.1]}><torusGeometry args={[4.25, 0.22, 10, 48]} /><meshBasicMaterial color={col} toneMapped={false} /></mesh>
    {Array.from({ length: 12 }).map((_, i) => (<mesh key={i} position={[Math.sin(i * Math.PI / 6) * 3.4, Math.cos(i * Math.PI / 6) * 3.4, 0.42]}><boxGeometry args={[0.28, 0.28, 0.1]} /><meshBasicMaterial color="#222" /></mesh>))}
    <group rotation={[0, 0, -hr]} position={[0, 0, 0.5]}><mesh position={[0, 0.95, 0]}><boxGeometry args={[0.4, 1.9, 0.2]} /><meshBasicMaterial color="#111" /></mesh></group>
    <group rotation={[0, 0, -mn]} position={[0, 0, 0.6]}><mesh position={[0, 1.4, 0]}><boxGeometry args={[0.24, 2.8, 0.2]} /><meshBasicMaterial color="#111" /></mesh></group>
    <Glow p={[0, 0, 1.2]} size={13} color={col} opacity={0.5} />
  </group>); };
const Station: React.FC<{ t: number }> = ({ t }) => {
  const k = outBack(prog(t, 26.8, 0.6)); if (k < 0.02) return null; const tr = prog(t, 27.0, 1.3, outCubic);
  return (<group position={[-32, 0, 34]} scale={k}>
    <mesh position={[0, 2.4, 0]}><boxGeometry args={[11, 4.8, 8]} /><meshStandardMaterial color="#1b2535" roughness={0.6} /></mesh>
    <mesh position={[0, 4.95, 0]}><boxGeometry args={[11.4, 0.3, 8.4]} /><meshBasicMaterial color={CY} toneMapped={false} /></mesh>
    <mesh position={[5.6, 1.6, 2]}><boxGeometry args={[0.2, 3, 3]} /><meshBasicMaterial color={YE} toneMapped={false} /></mesh>
    <group position={[mix(-46, 0, tr), 1.1, 7.4]}>{[0, 1, 2].map((i) => (<mesh key={i} position={[i * 5.6, 0.2, 0]}><boxGeometry args={[5.2, 2.2, 2.2]} /><meshStandardMaterial color={PINK} emissive={PINK} emissiveIntensity={0.35} /></mesh>))}</group>
    <Glow p={[0, 6, 0]} size={12} color={CY} opacity={0.5} />
  </group>); };
const Doc: React.FC<{ t: number }> = ({ t }) => {
  const k = outBack(prog(t, 11.0, 0.6)) * (1 - prog(t, 16.2, 0.3)); if (k < 0.02) return null;
  return (<group position={[-15, 6 + 0.4 * Math.sin(t * 1.4), 0]} rotation={[0.15, t * 0.6, 0.08]} scale={k}>
    <mesh><boxGeometry args={[5.4, 7.2, 0.3]} /><meshStandardMaterial color="#e8efff" emissive="#19c9ff" emissiveIntensity={0.25} /></mesh>
    {[2.4, 1.2, 0.2, -0.8, -1.8, -2.6].map((y, i) => (<mesh key={i} position={[i === 0 ? -0.6 : 0, y, 0.2]}><boxGeometry args={[i === 0 ? 3.2 : 4.2, i === 0 ? 0.55 : 0.28, 0.1]} /><meshBasicMaterial color={i === 0 ? OR : "#5b6577"} /></mesh>))}
    <Glow p={[0, 0, 1]} size={14} color={CY} opacity={0.45} /></group>); };
const SideRoads: React.FC<{ t: number }> = ({ t }) => {
  const g = prog(t, 16.6, 1.3); if (g < 0.01) return null; const len = 36 * g;
  return (<>{[[-1, -20], [1, 14]].map(([sd, z], i) => (<group key={i}>
    <mesh position={[sd * (9.6 + len / 2 - 0.2), 0, z]}><boxGeometry args={[len, 0.2, 5]} /><meshStandardMaterial color="#1a1e27" roughness={0.9} /></mesh>
    <mesh position={[sd * (9.6 + len / 2 - 0.2), 0.14, z]}><boxGeometry args={[len, 0.05, 0.16]} /><meshBasicMaterial color={CY} toneMapped={false} /></mesh></group>))}</>); };
const Lamps: React.FC<{ t: number }> = ({ t }) => (<>{Array.from({ length: 26 }).map((_, i) => { const z = 74 - ((i * 18 + S(t)) % 468); const s = i % 2 ? 1 : -1; return <Glow key={i} p={[s * (roadW(t) / 2 + 2.2), 4.2, z]} size={4.2} color={s > 0 ? CY : OR} opacity={0.8} />; })}</>);
const HorizonSun: React.FC<{ t: number }> = ({ t }) => { const o = 0.2 + 0.35 * clamp01(1 - Math.abs(t - 9) / 3);
  return (<sprite position={[0, 12, -190]} scale={[170, 170, 1]}><spriteMaterial color={lerpC(CY, OR, clamp01((t - 5) / 3) * (t < 12 ? 1 : 0.4))} transparent opacity={o} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} /></sprite>); };
// ---- HTML overlay ----
type Chip = { t0: number; t1: number; at?: [number, number, number]; scr?: [number, number]; text: string; color?: string; size?: number; mono?: boolean };
const chips: Chip[] = [
  { t0: 0.3, t1: 1.9, at: [0, 5, 16], text: "اتوبان همت (مثال فرضی)", size: 30, color: "#ffffff" },
  { t0: 1.35, t1: 3.1, scr: [540, 470], text: "دو برابر عریض!", size: 54, color: CY },
  { t0: 2.6, t1: 3.95, scr: [540, 590], text: "ترافیک نصف؟", size: 44, color: YE },
  { t0: 4.0, t1: 5.4, scr: [540, 560], text: "نه!", size: 190, color: OR },
  { t0: 5.4, t1: 7.2, scr: [540, 520], text: "دلیلش عجیبه…", size: 54, color: "#ffffff" },
  { t0: 5.8, t1: 7.2, scr: [540, 780], text: "؟", size: 170, color: OR },
  { t0: 7.6, t1: 10.8, scr: [540, 470], text: "روزای اول: خلوت و روون", size: 44, color: GRN },
  { t0: 11.2, t1: 14.2, at: [-15, 12.5, 0], text: "آنتونی داونز", size: 36, color: YE },
  { t0: 12.4, t1: 16.1, at: [-15, 1.2, 0], text: "اقتصاددان آمریکایی", size: 26, color: "#ffffff" },
  { t0: 13.8, t1: 16.1, scr: [540, 520], text: "1962", size: 70, color: CY, mono: true },
  { t0: 16.5, t1: 18.0, scr: [540, 560], text: "سه جور واکنش!", size: 62, color: OR },
  { t0: 18.1, t1: 21.4, scr: [540, 490], text: "۱  راه‌شون رو عوض می‌کنن", size: 40, color: CY },
  { t0: 18.6, t1: 21.4, at: [-30, 4, -20], text: "فرعی‌ها", size: 30, color: CY }, { t0: 18.6, t1: 21.4, at: [30, 4, 14], text: "فرعی‌ها", size: 30, color: CY },
  { t0: 21.7, t1: 27.2, scr: [540, 490], text: "۲  ساعت رفتنشون می‌ره سر ساعت شلوغ", size: 36, color: YE },
  { t0: 22.4, t1: 27.0, at: [36, 15.5, -26], text: "ساعت شلوغی", size: 30, color: OR },
  { t0: 27.4, t1: 31.8, scr: [540, 490], text: "۳  مترو ← ماشین", size: 42, color: PINK },
  { t0: 27.9, t1: 31.0, at: [-32, 8, 34], text: "مترو", size: 32, color: CY },
  { t0: 32.0, t1: 34.5, scr: [540, 500], text: "چند ماه بعد…", size: 52, color: "#ffffff" },
  { t0: 34.6, t1: 36.0, scr: [540, 500], text: "دوباره همون ترافیک!", size: 48, color: OR },
  { t0: 36.1, t1: 37.9, scr: [540, 500], text: "تقاضای القایی", size: 62, color: YE },
  { t0: 36.4, t1: 37.9, scr: [540, 640], text: "INDUCED DEMAND", size: 28, color: CY, mono: true },
  { t0: 44.2, t1: 48.6, scr: [540, 500], text: "شهرها فقط جاده پهن نمی‌کنن", size: 44, color: CY },
];
const ChipsX: React.FC<{ t: number; proj: (p: [number, number, number]) => { x: number; y: number } }> = ({ t, proj }) => (<>
  {chips.map((c, i) => { if (t < c.t0 || t > c.t1 + 0.01) return null; const sz = c.size ?? 34, k = outBack(clamp01((t - c.t0) / 0.3)), o = clamp01((t - c.t0) / 0.15) * clamp01((c.t1 - t) / 0.2);
    let x: number, y: number; if (c.scr) { [x, y] = c.scr; } else { const q = proj(c.at!); const wEst = c.text.length * sz * 0.75 + 70; x = Math.min(W - 24 - wEst / 2, Math.max(24 + wEst / 2, q.x)); y = Math.max(400, q.y); }
    const col = c.color ?? "#fff", big = sz > 100;
    return (<div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * k})`, opacity: o, whiteSpace: "nowrap", fontFamily: c.mono ? MONO : V, fontWeight: 800, fontSize: c.mono ? sz : sz * 1.2, color: col, direction: c.mono ? "ltr" : "rtl",
      background: big ? "transparent" : "#0b0d12ee", border: big ? "none" : `3px solid ${col}`, borderRadius: 16, padding: big ? 0 : c.mono ? "6px 24px" : "2px 26px 6px", textShadow: big ? `0 0 60px ${col}aa, 0 6px 30px #000` : undefined, boxShadow: big ? undefined : `0 0 34px ${col}55` }}>{c.text}</div>); })}
</>);
const CHAPTERS = [{ from: 0, name: "HOOK" }, { from: 7.25, name: "DAY 1" }, { from: 10.9, name: "DOWNS" }, { from: 18.0, name: "3 WAYS" }, { from: 31.86, name: "RESULT" }, { from: 37.8, name: "DATA" }];
const TopTag2: React.FC<{ t: number }> = ({ t }) => {
  let ci = 0; CHAPTERS.forEach((c, i) => { if (t >= c.from) ci = i; }); const pop = outBack(clamp01((t - CHAPTERS[ci].from) / 0.35));
  return (<div style={{ position: "absolute", left: 70, top: 250, display: "flex", alignItems: "center", gap: 26, padding: "16px 30px 16px 26px", background: "#ffffff0d", border: "2px solid #ffffff1c", borderRadius: 28 }}>
    <div style={{ display: "flex", alignItems: "center", width: 190 }}>
      {CHAPTERS.map((_, i) => (<React.Fragment key={i}>{i > 0 && <div style={{ flex: 1, height: 3, background: i <= ci ? CY + "bb" : "#ffffff22" }} />}
        <div style={{ width: 22, height: 22, borderRadius: 11, flex: "none", background: i <= ci ? CY : "#ffffff30", boxShadow: i === ci ? `0 0 20px ${CY}` : "none", transform: i === ci ? `scale(${0.8 + 0.2 * pop})` : "none" }} /></React.Fragment>))}
    </div>
    <div style={{ fontFamily: MONO, lineHeight: 1.1 }}><div style={{ fontSize: 22, letterSpacing: 4, color: "#ffffff77", fontWeight: 600 }}>TRAFFIC</div>
      <div style={{ fontSize: 40, letterSpacing: 2, color: CY, fontWeight: 800, opacity: pop, transform: `translateY(${(1 - pop) * 8}px)` }}>{CHAPTERS[ci].name}</div></div>
  </div>); };
const Wm: React.FC = () => (<div style={{ position: "absolute", left: 0, right: 0, top: 196, textAlign: "center", fontFamily: V, fontWeight: 800, fontSize: 36, color: "#ffffff40", letterSpacing: 1 }}>@techrooz.fa · تک‌روز</div>);
const Counter: React.FC<{ t: number }> = ({ t }) => {
  const s = 37.9, e = 44.0; if (t < s || t > e) return null; const o = clamp01((t - s) / 0.3) * clamp01((e - t) / 0.3); const k = outBack(clamp01((t - s) / 0.5));
  const p1 = prog(t, 39.5, 1.1), p2 = prog(t, 42.2, 1.2);
  const row = (label: string, val: string, p: number, col: string, pre: string) => (<div style={{ marginBottom: 22 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ fontSize: 46, fontWeight: 800, color: "#ffffffcc" }}>{label}</span><span style={{ fontSize: 80, fontWeight: 900, color: col, textShadow: `0 0 36px ${col}88`, direction: "ltr" }}>{pre}{val}٪</span></div>
    <div style={{ direction: "ltr", height: 26, borderRadius: 13, background: "#ffffff14", overflow: "hidden", marginTop: 6 }}><div style={{ width: `${p * 100}%`, height: "100%", background: col, boxShadow: `0 0 24px ${col}`, borderRadius: 13 }} /></div></div>);
  return (<div style={{ position: "absolute", left: 90, right: 90, top: 400, opacity: o, transform: `scale(${0.9 + 0.1 * k})`, direction: "rtl", fontFamily: V, background: "#0b0e14ee", border: "3px solid #ffffff22", borderRadius: 40, padding: "30px 40px 24px", boxShadow: "0 0 80px #000a" }}>
    {row("جاده‌ی بیشتر", fa(Math.round(10 * p1)), p1, CY, "+")}
    {row("رانندگی بیشتر", fa(Math.round(10 * p2)), p2, OR, "≈ +")}
    <div style={{ fontSize: 28, fontWeight: 700, color: "#ffffff77", textAlign: "center" }}>مطالعه‌ی آماری در شهرهای آمریکا (حدودی)؛ بعضی کارشناس‌ها درباره‌ی نحوه‌ی اندازه‌گیریش بحث دارن</div>
  </div>); };
const Cta: React.FC<{ t: number }> = ({ t }) => { const s = 48.7; if (t < s || t > T_END) return null; const k = outBack(clamp01((t - s - 0.1) / 0.5));
  return (<div style={{ position: "absolute", left: 110, right: 110, top: 520, fontFamily: V, direction: "rtl", textAlign: "center", opacity: clamp01((t - s) / 0.2), transform: `scale(${0.8 + 0.2 * k})` }}>
    <div style={{ background: "#0e1218f2", border: `3px solid ${OR}`, borderRadius: 48, padding: "44px 30px", boxShadow: `0 0 90px ${OR}55` }}>
      <div style={{ fontSize: 54, fontWeight: 800, color: "#ffffffcc" }}>کامنت کن:</div>
      <div style={{ fontSize: 190, fontWeight: 900, color: OR, lineHeight: 1.25, textShadow: `0 0 60px ${OR}88` }}>ترافیک</div></div></div>); };
const End: React.FC<{ t: number }> = ({ t }) => { const s = t - T_END; if (s < 0) return null; const k = outCubic(clamp01(s / 0.4));
  return (<AbsoluteFill style={{ background: "#0e1116", opacity: clamp01(s * 8), fontFamily: V, direction: "rtl", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", transform: `scale(${0.85 + 0.15 * k})` }}>
      <div style={{ width: 240, height: 240, margin: "0 auto", borderRadius: 66, background: OR, boxShadow: `0 0 110px ${OR}99`, display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
        {[0, 1, 2].map((i) => (<div key={i} style={{ width: 22, height: 130, borderRadius: 11, background: "#fff", opacity: i === 1 ? 1 : 0.7 }} />))}</div>
      <div style={{ marginTop: 46, fontSize: 190, fontWeight: 900, color: "#fff", lineHeight: 1 }}>تک‌روز</div>
      <div style={{ marginTop: 22, fontSize: 50, fontWeight: 800, color: "#ffffffaa" }}>هوش مصنوعی و تکنولوژی</div>
      <div style={{ marginTop: 16, fontSize: 46, fontWeight: 800, color: CY, direction: "ltr", fontFamily: MONO }}>@techrooz.fa</div>
      <div style={{ marginTop: 40, display: "inline-block", fontSize: 54, fontWeight: 900, color: "#fff", border: `3px solid ${OR}`, borderRadius: 40, padding: "6px 36px" }}>کامنت کن: <span style={{ color: OR }}>ترافیک</span></div></div></AbsoluteFill>); };
const pulse = (t: number, t0: number, d = 0.14) => Math.max(0, 1 - Math.abs(t - t0) / d);
export const Traffic3D: React.FC = () => {
  const t = useCurrentFrame() / FPS; const cam = camAt(t, CAM, kf(t, [[0, 24], [16.5, 24], [17.6, 46], [21.2, 46], [21.9, 24], [60, 24]])); cam.ty -= 2.2; const proj = projector(cam, W, H);
  const Wd = roadW(t), jam = jamAt(t), edge = lerpC(CY, OR, jam);
  const flash = pulse(t, 3.98, 0.1) * 0.8 + pulse(t, 1.3, 0.1) * 0.3 + pulse(t, 18.05, 0.1) * 0.3 + pulse(t, 21.65, 0.1) * 0.3 + pulse(t, 27.4, 0.1) * 0.3 + pulse(t, 34.62, 0.12) * 0.5 + pulse(t, 36.1, 0.12) * 0.4 + pulse(t, 48.7, 0.1) * 0.3;
  const shake = (t > 3.98 && t < 4.3) || (t > 34.6 && t < 34.9);
  return (<AbsoluteFill style={{ background: "#0e1116" }}>
    <ThreeCanvas width={W} height={H} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }} camera={{ fov: 24, position: [0, 40, 60], near: 1, far: 500 }} style={{ position: "absolute", inset: 0, transform: shake ? `translate(${7 * Math.sin(t * 90)}px, ${7 * Math.cos(t * 77)}px)` : undefined }}>
      <color attach="background" args={["#0e1116"]} /><fog attach="fog" args={["#0e1116", 90, 250]} />
      <CameraRig cam={cam} />
      <ambientLight intensity={1.2} color="#c9d6ff" /><directionalLight position={[-14, 26, 16]} intensity={2.0} /><directionalLight position={[16, 10, -10]} intensity={0.8} color="#7fd8ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}><planeGeometry args={[700, 700]} /><meshStandardMaterial color="#0c0f14" roughness={1} /></mesh>
      <mesh position={[0, 0, -60]}><boxGeometry args={[Wd, 0.2, 420]} /><meshStandardMaterial color="#1a1e27" roughness={0.9} /></mesh>
      {[-1, 1].map((s) => (<mesh key={s} position={[s * Wd / 2, 0.16, -60]}><boxGeometry args={[0.22, 0.12, 420]} /><meshBasicMaterial color={edge} toneMapped={false} /></mesh>))}
      <HorizonSun t={t} /><Lamps t={t} /><SideRoads t={t} />
      <BlockField items={CITY} /><BlockField items={buildMarks(t)} /><BlockField items={buildCars(t)} />
      {cars.map((c, i) => { const s = carState(c, t); if (!s) return null; const q = s.sc * s.k; return (<React.Fragment key={i}>
        <Glow p={[s.p[0] - 0.65 * q, s.p[1] + 0.2 + 0.6 * q, s.p[2] + 2.15 * q]} size={1.6 * q} color="#ff3b2f" opacity={0.55 + 0.4 * jam} />
        <Glow p={[s.p[0] + 0.65 * q, s.p[1] + 0.2 + 0.6 * q, s.p[2] + 2.15 * q]} size={1.6 * q} color="#ff3b2f" opacity={0.55 + 0.4 * jam} /></React.Fragment>); })}
      <Clock t={t} /><Station t={t} /><Doc t={t} />
    </ThreeCanvas>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 40%, transparent 55%, #05070a 100%)", pointerEvents: "none" }} />
    <AbsoluteFill style={{ background: "#07090c", opacity: prog(t, 49.0, 0.6) * 0.5, pointerEvents: "none" }} />
    <ChipsX t={t} proj={proj} /><TopTag2 t={t} /><Wm /><Counter t={t} /><Cta t={t} />
    <Subs t={t} words={words} phrases={phrases} hl={HL} />
    <AbsoluteFill style={{ background: t > 3.9 && t < 4.4 ? "#ff7a1a" : "#fff", opacity: Math.min(1, flash), pointerEvents: "none" }} />
    <End t={t} />
  </AbsoluteFill>); };
