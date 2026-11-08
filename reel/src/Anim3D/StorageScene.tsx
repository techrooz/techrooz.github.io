// "Storage3D": ONE continuous 3D scene. 128 blocks (GB) swell ~7% into GiB, overflow, system blocks slide in, 100 cyan blocks remain, 3 chunk towers get cleaned.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { V } from "../fontLocal";
import voice from "./voice.json";
import { camAt, CameraRig, CamKey, projector } from "./camera";
import { BlockField, Ghost, Glow, Item, Rail, Slab } from "./primitives";
import { Chips, ChipSpec, CY, OR, YE, MONO, Phrase, Subs, TopTag, Watermark, Word } from "./overlay";
import { clamp01, inCubic, inOutCubic, mix, outBack, outCubic, prog } from "./timeline";
const W = 1080, H = 1920;
export const FPS = 30; export const TOTAL = 44.6; const T_END = 42.4;
const words = voice.words as Word[];
const SLATE = new THREE.Color("#aab5c8"), CYAN = new THREE.Color(CY), ORNG = new THREE.Color(OR), YEL = new THREE.Color(YE);
const lerpC = (a: THREE.Color, b: THREE.Color, k: number) => "#" + a.clone().lerp(b, clamp01(k)).getHexString();
const PH: [number, number][] = [[0,2],[3,6],[7,10],[11,13],[14,15],[16,18],[19,22],[23,25],[26,29],[30,31],[32,34],[35,36],[37,40],[41,43],[44,46],[47,49],[50,53],[54,57],[58,61],[62,65],[66,67],[68,69],[70,71],[72,73],[74,76],[77,79],[80,82],[83,85],[86,89]];
const phrases: Phrase[] = PH.map(([from, to]) => ({ from, to }));
const HL = [0, 12, 22, 35, 43, 45, 54, 66, 67, 70, 72, 76, 81];
const CHAPTERS = [{ from: 0, name: "HOOK" }, { from: 8, name: "UNITS" }, { from: 22, name: "SYSTEM" }, { from: 29.5, name: "YOURS" }, { from: 32.7, name: "CLEAN" }];
const CAM: CamKey[] = [
  { t: 0, d: 112, yaw: 13, el: 42, tx: 0, ty: 0, tz: 1 }, { t: 3, d: 103, yaw: 10, el: 40, tx: 0, ty: 0, tz: 0.5 }, { t: 6.8, d: 86, yaw: 4, el: 34, tx: 2, ty: 0, tz: 1 }, { t: 8.6, d: 94, yaw: 10, el: 44, tx: 0, ty: 0, tz: 1 },
  { t: 12.5, d: 81, yaw: 8, el: 36, tx: 0, ty: 0, tz: 2 }, { t: 15, d: 91, yaw: 8, el: 48, tx: 0, ty: 0, tz: 1.5 }, { t: 19, d: 83, yaw: 2, el: 38, tx: 1, ty: 0, tz: 2.5 },
  { t: 22, d: 91, yaw: -5, el: 40, tx: 3, ty: 0, tz: 1.5 }, { t: 27, d: 81, yaw: -10, el: 36, tx: 4, ty: 0, tz: 1.8 }, { t: 29.6, d: 90, yaw: 0, el: 52, tx: 0, ty: 0, tz: 1 },
  { t: 33, d: 83, yaw: 8, el: 38, tx: 0, ty: 0.5, tz: 1.5 }, { t: 37.5, d: 91, yaw: 13, el: 44, tx: 0, ty: 0, tz: 1 }, { t: 44.6, d: 123, yaw: 17, el: 50, tx: 0, ty: 0, tz: 0 }];
const BH = 0.34; const NO = 19; const TW: [number, number, number, string][] = [[-5.2, 14, 33.2, "#b28cff"], [0, 10, 34.6, "#ff5c8a"], [5.2, 8, 36.0, "#5be7a9"]]; const TY = 0.22, T_CLEAN = 37.1;
const swell = (t: number) => prog(t, 14.9, 1.8, inOutCubic);
const slot = (i: number, p: number) => { const c = (i + 0.5) * p; const row = Math.floor(c / 16); return { row, x: Math.min(c - row * 16 - 8, 8 - 0.45 * p), z: -3.5 + row * (p > 1 ? 1 : 1), c }; };
const sysStart = (o: number) => 22.5 + o * 0.15;
const vanishT = (i: number) => 3.35 + (127 - i) * 0.035;
const ghostOn = (i: number, t: number) => i >= 100 && t > vanishT(i) + 0.25 && t < 8.1;
const nVanished = (t: number) => { let n = 0; for (let i = 100; i < 128; i++) if (t > vanishT(i) + 0.15) n++; return n; };
const buildItems = (t: number): Item[] => {
  const out: Item[] = []; const p = 1 + 0.074 * swell(t); const Y0 = 0.05 + (BH * p) / 2; const pile: [number, number, number] = [5.5, 0, 7.6];
  for (let i = 0; i < 128; i++) {
    const sl = slot(i, p); let x = sl.x, z = sl.z, y = Y0, k = 1; let col = lerpC(SLATE, SLATE, 0);
    const ts = 0.15 + (i / 128) * 1.3; const e = prog(t, ts, 0.65, outCubic); if (t < ts) k = 0; y += (1 - e) * 7; k *= clamp01((t - ts) / 0.08);
    if (i >= 100) { const g = prog(t, vanishT(i), 0.3, inCubic) * (1 - prog(t, 8.05 + (i - 100) * 0.02, 0.4, outBack)); k *= 1 - g; y += g * 1.6; }
    if (i >= 119) { const o = prog(t, 16.9 + (i - 119) * 0.09, 1.0, inOutCubic); const q = pile; col = lerpC(SLATE, YEL, prog(t, 16.2, 0.5));
      x = mix(x, q[0] + ((i - 119) % 3) * 0.0, o); z = mix(z, q[2], o); y = Y0 + Math.sin(Math.PI * o) * 3.2 + o * ((i - 119) * BH * 1.02 + 0.05); }
    else if (i >= 100 && i < 119) { const hidden = prog(t, sysStart(i - 100) + 0.45, 0.1, inCubic); k *= 1 - hidden; col = lerpC(SLATE, SLATE, 0); }
    if (i < 100) { const w = prog(t, 30.1 + i * 0.011, 0.45); col = lerpC(SLATE, CYAN, w); y += 0.28 * Math.sin(Math.PI * clamp01((t - 30.1 - i * 0.011) / 0.55)); if (t > 37.1) y += 0.25 * Math.sin(Math.PI * clamp01((t - T_CLEAN - (i % 16) * 0.03) / 0.5)); }
    out.push({ p: [x, y, z], s: [0.9 * p * k, BH * p * k, 0.9 * p * k], c: col });
  }
  for (let o = 0; o < NO; o++) {
    const sl = slot(100 + o, 1.074); const s0 = sysStart(o); const e = prog(t, s0, 0.7, outCubic); const k = t < s0 ? 0 : 1;
    out.push({ p: [mix(sl.x + 15, sl.x, e), 0.05 + (BH * 1.074) / 2 + 1.6 * (1 - e), sl.z], s: [0.9 * 1.074 * k, BH * 1.074 * k, 0.9 * 1.074 * k], c: lerpC(ORNG, new THREE.Color("#ff9a4d"), prog(t, s0 + 0.7, 0.4) * 0.5) });
  }
  TW.forEach(([cx, n, tk, c]) => { for (let j = 0; j < n; j++) {
    const ts = tk + j * 0.05, tr = T_CLEAN + (n - 1 - j) * 0.045; const gr = prog(t, ts, 0.4, outBack), sh = 1 - prog(t, tr, 0.3, inCubic); const k = (t < ts ? 0 : gr) * sh;
    out.push({ p: [cx, 0.05 + BH * 1.0 + 0.1 + j * (TY + 0.03) + (1 - gr) * 2.4, 0.3], s: [3.2 * k, TY * k, 3.2 * k], c });
  } });
  return out;
};
const chips: ChipSpec[] = [
  { t0: 0.7, t1: 8.0, at: [0, 1.4, -5.6], text: (t) => (t < 3.4 ? "128 GB" : t < 4.7 ? `${128 - nVanished(t)} GB` : "~100 GB ?"), color: "#ffffff", size: 44 },
  { t0: 5.5, t1: 8.0, at: [3.5, 1.6, 4.6], text: "؟", fa: true, color: OR, size: 46 },
  { t0: 10.3, t1: 14.6, at: [-3, 1.6, -5.2], text: "1 GB = 1,000,000,000 B", color: YE, size: 30 },
  { t0: 13.2, t1: 17.8, at: [-1, 1.2, 5.6], text: "1 GiB = 1,073,741,824 B", color: CY, size: 30 },
  { t0: 15.4, t1: 18.0, at: [9.2, 1.8, -1.5], text: "+7%", color: YE, size: 42 },
  { t0: 18.2, t1: 22.0, at: [0, 1.6, -5.6], text: (t) => `128 GB → ${Math.round(mix(128, 119, prog(t, 19.2, 2.0, inOutCubic)))} GiB`, color: "#fff", size: 42 },
  { t0: 22.8, t1: 29.4, at: [3, 2.4, 0.5], text: "سیستم + اپ‌های پیش‌فرض", fa: true, color: OR, size: 34 },
  { t0: 25.7, t1: 29.4, at: [4, 1.2, 5.6], text: "≈ 10-20 GB", color: OR, size: 40 },
  { t0: 30.3, t1: 33.0, at: [-1, 1.8, -5.6], text: "~100 GB", color: CY, size: 52 },
  { t0: 30.9, t1: 33.0, at: [-1, 1.6, 5.2], text: "مال تو", fa: true, color: CY, size: 40 },
  { t0: 33.5, t1: 37.2, at: [-5.2, 5.8, 0.3], text: "ویدیو", fa: true, color: "#b28cff", size: 30 },
  { t0: 34.9, t1: 37.2, at: [0, 4.8, 0.3], text: "کَش", fa: true, color: "#ff5c8a", size: 30 },
  { t0: 36.3, t1: 37.2, at: [5.2, 4.2, 0.3], text: "چت", fa: true, color: "#5be7a9", size: 30 },
  { t0: 37.6, t1: 40.0, at: [0, 1.5, 5.4], text: "فضای بیشتر", fa: true, color: CY, size: 36 },
];
const Cta: React.FC<{ t: number }> = ({ t }) => {
  const k = outBack(clamp01((t - 38.4) / 0.5)); if (t < 38.3) return null;
  return (<div style={{ position: "absolute", left: 110, right: 110, top: 560, fontFamily: V, direction: "rtl", textAlign: "center", opacity: clamp01((t - 38.3) / 0.2), transform: `scale(${0.8 + 0.2 * k})` }}>
    <div style={{ background: "#0e1218f2", border: `3px solid ${OR}`, borderRadius: 48, padding: "44px 30px", boxShadow: `0 0 90px ${OR}55` }}>
      <div style={{ fontSize: 54, fontWeight: 800, color: "#ffffffcc" }}>کامنت کن:</div>
      <div style={{ fontSize: 190, fontWeight: 900, color: OR, lineHeight: 1.25, textShadow: `0 0 60px ${OR}88` }}>حافظه</div></div></div>);
};
const End: React.FC<{ t: number }> = ({ t }) => { const s = t - T_END; if (s < 0) return null; const k = outCubic(clamp01(s / 0.4));
  return (<AbsoluteFill style={{ background: "#0e1116", opacity: clamp01(s * 8), fontFamily: V, direction: "rtl", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", transform: `scale(${0.85 + 0.15 * k})` }}>
      <div style={{ width: 240, height: 240, margin: "0 auto", borderRadius: 66, background: OR, color: "#fff", fontWeight: 900, fontSize: 130, lineHeight: "240px", boxShadow: `0 0 110px ${OR}99` }}>AI</div>
      <div style={{ marginTop: 46, fontSize: 190, fontWeight: 900, color: "#fff", lineHeight: 1 }}>تک‌روز</div>
      <div style={{ marginTop: 22, fontSize: 50, fontWeight: 800, color: "#ffffffaa" }}>هوش مصنوعی و تکنولوژی</div>
      <div style={{ marginTop: 16, fontSize: 46, fontWeight: 800, color: CY, direction: "ltr", fontFamily: MONO }}>@techrooz.fa</div>
      <div style={{ marginTop: 40, display: "inline-block", fontSize: 54, fontWeight: 900, color: "#fff", border: `3px solid ${OR}`, borderRadius: 40, padding: "6px 36px" }}>کامنت کن: <span style={{ color: OR }}>حافظه</span></div></div></AbsoluteFill>); };
export const Storage3D: React.FC = () => {
  const t = useCurrentFrame() / FPS; const cam = camAt(t, CAM); cam.ty -= 2.6; const proj = projector(cam, W, H); const items = buildItems(t);
  const edgeHot = prog(t, 16.2, 0.4) * (1 - prog(t, 18.5, 0.6));
  return (<AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 45% at 50% 33%, #1a2230 0%, #0e1116 62%, #07090c 100%)" }}>
    <ThreeCanvas width={W} height={H} shadows gl={{ antialias: true, toneMapping: THREE.NoToneMapping }} camera={{ fov: 24, position: [0, 40, 60], near: 1, far: 400 }} style={{ position: "absolute", inset: 0 }}>
      <CameraRig cam={cam} />
      <ambientLight intensity={1.15} color="#c9d6ff" />
      <directionalLight position={[-14, 26, 16]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={1} shadow-camera-far={80} shadow-bias={-0.0006} />
      <directionalLight position={[16, 10, -10]} intensity={0.7} color="#7fd8ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow><planeGeometry args={[300, 300]} /><meshStandardMaterial color="#0c0f14" roughness={1} /></mesh>
      <Slab w={17.2} d={9.2} y={-0.1} h={0.3} edge={CY} t={t} dots={4} glow={1} />
      {edgeHot > 0.01 && <Slab w={17.2} d={9.2} y={-0.1} h={0.3} edge={YE} t={t + 3} dots={2} glow={edgeHot * 1.2} body={false} />}
      <BlockField items={items} />
      {Array.from({ length: 28 }).map((_, j) => { const i = 100 + j; if (!ghostOn(i, t)) return null; const sl = slot(i, 1); return <Ghost key={i} p={[sl.x, 0.05 + BH / 2, sl.z]} s={[0.9, BH, 0.9]} opacity={0.35 * clamp01((t - vanishT(i) - 0.25) / 0.3)} />; })}
      <Rail pts={[[-9.5, 0.2, 5.6], [-3, 0.2, 5.9], [4, 0.2, 5.9], [9.5, 0.2, 5.6]]} u={prog(t, 9.0, 3.0, inOutCubic)} color={CY} opacity={clamp01((t - 8.8) / 0.3) * (1 - clamp01((t - 12.3) / 0.4))} show={t > 8.8 && t < 12.8 ? 1 : 0} />
      <Rail pts={[[17, 0.3, 3.6], [11, 0.3, 4.2], [8.6, 0.3, 2.6], [8.2, 0.3, 0.9]]} u={prog(t, 22.2, 3.4, inOutCubic)} color={OR} opacity={clamp01((t - 22.1) / 0.3) * (1 - clamp01((t - 25.8) / 0.4))} show={t > 22.1 && t < 26.3 ? 1 : 0} />
    </ThreeCanvas>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 40%, transparent 55%, #05070a 100%)", pointerEvents: "none" }} />
    <AbsoluteFill style={{ background: "#07090c", opacity: prog(t, 38.2, 0.6) * 0.55, pointerEvents: "none" }} />
    <Chips t={t} chips={chips} proj={proj} />
    <TopTag t={t} chapters={CHAPTERS} /><Watermark />
    <Cta t={t} />
    <Subs t={t} words={words} phrases={phrases} hl={HL} />
    <End t={t} />
  </AbsoluteFill>);
};
