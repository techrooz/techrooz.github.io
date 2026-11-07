// "Cine" reel: real 3D (three.js) cinematic explainer, copy of @scroll.engineer's edit: dark 3D scenes, camera flies into the part, callout labels, mono tag, subtitles on dark pill.
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { V } from "./fontLocal";
import { Brand, EndCard } from "./Mob";
import { COLD } from "./ColdVis";
const FPS = 30, BL = "#3DA5FF", ICE = "#bfeaff", BG = "#06080e";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const ease2 = (x: number) => { const k = Math.min(1, Math.max(0, x)); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export type CScene = { start: number; end: number; vis: string; tag?: string; text?: string };
export type CSub = { s: number; e: number; t: string; acc?: string[] };
export type CineProps = { seconds: number; scenes: CScene[]; subs?: CSub[] };
const useT = () => useCurrentFrame() / FPS;
const rnd = (i: number, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

const rrShape = (w: number, h: number, r: number) => { const s = new THREE.Shape(); const x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };

const screenTex = (on: boolean) => {
  const c = document.createElement("canvas"); c.width = 512; c.height = 1024; const g = c.getContext("2d")!;
  g.fillStyle = on ? "#0b1d38" : "#000"; g.fillRect(0, 0, 512, 1024);
  if (on) { g.strokeStyle = "#fff"; g.lineWidth = 12; g.strokeRect(150, 400, 190, 100); g.fillStyle = "#fff"; g.fillRect(344, 428, 14, 44); g.fillStyle = "#ff5a5a"; g.fillRect(162, 412, 56, 76); g.font = "bold 150px sans-serif"; g.textAlign = "center"; g.fillText("30%", 256, 660); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const Phone: React.FC<{ on: boolean; glow?: string }> = ({ on, glow }) => {
  const body = useMemo(() => new THREE.ExtrudeGeometry(rrShape(0.8, 1.64, 0.12), { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }), []);
  const tOn = useMemo(() => screenTex(true), []); const tOff = useMemo(() => screenTex(false), []);
  return (<group>
    <mesh geometry={body} position={[0, 0, -0.04]}><meshStandardMaterial color="#1a1d27" metalness={0.85} roughness={0.28} /></mesh>
    <mesh position={[0, 0, 0.075]}><planeGeometry args={[0.72, 1.56]} /><meshBasicMaterial map={on ? tOn : tOff} /></mesh>
    <mesh position={[0, 0.7, 0.077]}><circleGeometry args={[0.035, 24]} /><meshBasicMaterial color="#000" /></mesh>
    {glow && <pointLight position={[0, 0, 0.7]} intensity={on ? 1.4 : 0} color={glow} distance={4} />}
  </group>);
};
const Snow: React.FC<{ t: number; n?: number; spread?: number }> = ({ t, n = 260, spread = 6 }) => {
  const pos = useMemo(() => new Float32Array(n * 3), [n]);
  for (let i = 0; i < n; i++) { pos[i * 3] = (rnd(i) - 0.5) * spread + Math.sin(t * 0.8 + i) * 0.15; pos[i * 3 + 1] = ((rnd(i, 2) * spread - t * (0.5 + rnd(i, 3) * 0.7)) % spread + spread) % spread - spread / 2; pos[i * 3 + 2] = (rnd(i, 4) - 0.5) * 4; }
  return (<points><bufferGeometry><bufferAttribute attach="attributes-position" array={pos} count={n} itemSize={3} /></bufferGeometry><pointsMaterial color="#dff4ff" size={0.045} transparent opacity={0.85} sizeAttenuation /></points>);
};
const Lights: React.FC<{ a?: string; b?: string }> = ({ a = "#4aa8ff", b = "#7b5cff" }) => (<><ambientLight intensity={0.35} /><directionalLight position={[3, 4, 5]} intensity={1.6} color={a} /><directionalLight position={[-4, -1, 3]} intensity={1.1} color={b} /></>);

const Cam: React.FC<{ p: [number, number, number]; look?: [number, number, number]; fov?: number }> = ({ p, look = [0, 0, 0], fov = 40 }) => {
  const { camera } = useThree();
  camera.position.set(...p); (camera as THREE.PerspectiveCamera).fov = fov; camera.lookAt(...look); (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
};
const Canvas3D: React.FC<{ children: React.ReactNode; cam: [number, number, number]; look?: [number, number, number]; fov?: number }> = ({ children, cam, look, fov }) => (
  <ThreeCanvas width={1080} height={1920} style={{ position: "absolute", inset: 0 }} camera={{ position: cam, fov }} gl={{ antialias: true }}>
    <color attach="background" args={[BG]} /><fog attach="fog" args={[BG, 6, 16]} />
    <Cam p={cam} look={look} fov={fov} />{children}
  </ThreeCanvas>);

// ---- scenes ----
const SPhone: React.FC = () => {
  const t = useT(); const on = t < 2.1; const a = 0.5 - t * 0.12; const d = 5.0 - ease(t / 4) * 0.8;
  return (<Canvas3D cam={[Math.sin(a) * d, 0.25, Math.cos(a) * d]} fov={38}>
    <Lights a="#7ec8ff" b="#6a4cf0" /><group rotation={[0.05, Math.sin(t * 0.6) * 0.25, 0]}><Phone on={on} glow="#4aa8ff" /></group><Snow t={t} />
  </Canvas3D>);
};
const SDive: React.FC = () => {
  const t = useT(); const k = ease2(t / 1.7); const z = 4.4 - k * 4.1; const fl = interpolate(t, [1.35, 1.8], [0, 0.9], cl);
  return (<><Canvas3D cam={[0, 0.1 * (1 - k), z]} look={[0, 0, 0]} fov={38}><Lights /><group rotation={[0, Math.PI * (1 - k) * 0.4, 0]}><Phone on={true} /></group><Snow t={t} n={120} /></Canvas3D>
    <AbsoluteFill style={{ background: "#9fd8ff", opacity: fl }} /></>);
};
const Cell: React.FC<{ cold: boolean }> = ({ cold }) => {
  const t = useT(); const col = cold ? ICE : "#2fa0ff"; const sp = cold ? 0.22 : 1.1; const N = 48;
  const intro = ease(t / 1.2); const camx = -2.2 + t * (cold ? 0.18 : 0.3);
  const ions = [];
  for (let i = 0; i < N; i++) {
    const ph = (t * sp * 0.35 + rnd(i, 5)) % 1; const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
    const x = -1.5 + tri * 3 + (cold ? (rnd(i, 6) - 0.5) * 0.2 : 0); const y = (rnd(i, 7) - 0.5) * 1.5 + Math.sin(t * (cold ? 1 : 3) + i) * (cold ? 0.015 : 0.07); const z = (rnd(i, 8) - 0.5) * 1.2;
    ions.push(<mesh key={i} position={[x, y, z]}><sphereGeometry args={[i === 0 ? 0.1 : 0.06, 14, 14]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={i === 0 ? 2.4 : 1.5} /></mesh>);
  }
  return (<Canvas3D cam={[camx * 0.3, 0.3, 7.4 - intro * 1.4]} look={[0, 0, 0]} fov={42}>
    <Lights a={cold ? "#bfeaff" : "#4aa8ff"} /><group rotation={[0, 0, Math.PI / 2]}>
    <mesh position={[-1.85, 0, 0]}><boxGeometry args={[0.45, 1.8, 1.5]} /><meshStandardMaterial color="#2c3243" metalness={0.7} roughness={0.35} /></mesh>
    <mesh position={[1.85, 0, 0]}><boxGeometry args={[0.45, 1.8, 1.5]} /><meshStandardMaterial color="#2c3243" metalness={0.7} roughness={0.35} /></mesh>
    <mesh><boxGeometry args={[3.3, 1.8, 1.5]} /><meshStandardMaterial color={cold ? "#8fd0ff" : "#2a6ad0"} transparent opacity={cold ? 0.22 : 0.09} /></mesh>
    {ions}
    {cold && Array.from({ length: 14 }).map((_, i) => (<mesh key={"c" + i} position={[(rnd(i, 9) - 0.5) * 3, (rnd(i, 10) - 0.5) * 1.6, (rnd(i, 11) - 0.5) * 1.2]} rotation={[t * 0.2 + i, i, 0]}><octahedronGeometry args={[0.07 + rnd(i, 12) * 0.05]} /><meshStandardMaterial color="#e8f8ff" emissive="#9fe0ff" emissiveIntensity={0.9} /></mesh>))}
  </group></Canvas3D>);
};
const Jam: React.FC = () => {
  const t = useT(); const N = 34; const ions = [];
  for (let i = 0; i < N; i++) {
    const lane = (rnd(i, 1) - 0.5) * 1.1; const base = ((rnd(i, 2) + t * (0.12 + 0.05 * rnd(i, 3))) % 1); const x = -2.2 + base * 4.4;
    const squeeze = Math.exp(-Math.pow(x / 0.55, 2)); const y = lane * (1 - 0.82 * squeeze) ; const z = (rnd(i, 4) - 0.5) * 0.8 * (1 - 0.8 * squeeze);
    ions.push(<mesh key={i} position={[x, y, z]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color="#cfeeff" emissive="#9fe0ff" emissiveIntensity={1.4} /></mesh>);
  }
  const heat = ease((t - 1) / 3);
  return (<Canvas3D cam={[0.4 + Math.sin(t * 0.4) * 0.3, 0.4, 7.2 - ease(t / 5) * 1.2]} look={[0, 0, 0]} fov={42}>
    <Lights /><group rotation={[0, 0, Math.PI / 2]}><pointLight position={[0, 0, 1]} intensity={heat * 3} color="#ff8a3d" distance={4} />
    <mesh position={[0, 0.92, 0]}><boxGeometry args={[4.6, 0.12, 1.2]} /><meshStandardMaterial color="#2c3243" metalness={0.6} roughness={0.4} /></mesh>
    <mesh position={[0, -0.92, 0]}><boxGeometry args={[4.6, 0.12, 1.2]} /><meshStandardMaterial color="#2c3243" metalness={0.6} roughness={0.4} /></mesh>
    <mesh position={[0, 0.62, 0]} scale={[1, 1, 1]}><sphereGeometry args={[0.62, 24, 24]} /><meshStandardMaterial color="#1b2030" metalness={0.5} roughness={0.5} /></mesh>
    <mesh position={[0, -0.62, 0]}><sphereGeometry args={[0.62, 24, 24]} /><meshStandardMaterial color="#1b2030" metalness={0.5} roughness={0.5} /></mesh>
    {ions}
  </group></Canvas3D>);
};
const Backdrop: React.FC<{ warm?: boolean }> = ({ warm }) => {
  const t = useT();
  return (<Canvas3D cam={[0, 0, 4]} fov={45}><Lights a={warm ? "#ff9a4a" : "#4aa8ff"} />
    <group rotation={[0.1, t * 0.35, 0]} position={[0, 2.2, -1.5]} scale={0.7}><Phone on={!warm} /></group><Snow t={t} n={180} /></Canvas3D>);
};
const S3D: Record<string, React.FC<any>> = {
  p_phone: SPhone, p_dive: SDive, p_cell: () => <Cell cold={false} />, p_cold: () => <Cell cold={true} />, p_jam: Jam,
};
const Over: React.FC<{ vis: string }> = ({ vis }) => {
  const C = COLD[vis]; return C ? <C /> : null;
};
const Tag: React.FC<{ label: string }> = ({ label }) => { const t = useT(); return (<div style={{ position: "absolute", right: 60, top: 335, opacity: Math.min(1, t * 4), fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: "#ffffff99", letterSpacing: 3, border: "1px solid #ffffff44", padding: "6px 14px", borderRadius: 6 }}>{label}</div>); };

const ScenePart: React.FC<{ s: CScene }> = ({ s }) => {
  const t = useT(); const S = S3D[s.vis]; const isOver = !S;
  return (<AbsoluteFill style={{ background: BG, opacity: Math.min(1, t * 10) }}>
    {S ? <S /> : <Backdrop warm={s.vis === "pocket" || s.vis === "wait"} />}
    {isOver && <AbsoluteFill style={{ background: "linear-gradient(#06080ecc,#06080e66 60%,#06080ecc)" }}><Over vis={s.vis} /></AbsoluteFill>}
    {s.tag && <Tag label={s.tag} />}
  </AbsoluteFill>);
};
const Subs: React.FC<{ subs: CSub[] }> = ({ subs }) => {
  const t = useCurrentFrame() / FPS; let cur: CSub | undefined; subs.forEach((x) => { if (t >= x.s) cur = x; });
  if (!cur || t > cur.e + 0.6) return null; const k = Math.min(1, (t - cur.s) * 12);
  return (<div style={{ position: "absolute", top: 1230, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: k, transform: `translateY(${(1 - k) * 14}px)` }}>
    <div style={{ background: "#000000b8", borderRadius: 22, padding: "12px 34px", direction: "rtl", fontFamily: V, fontSize: 64, fontWeight: 900, lineHeight: 1.45, boxShadow: "0 8px 30px #0008" }}>
      {cur.t.split(" ").map((w, i) => { const isA = (cur!.acc || []).some((a) => w.includes(a)); return <span key={i} style={{ display: "inline-block", margin: "0 10px", color: isA ? BL : "#fff" }}>{w}</span>; })}
    </div></div>);
};
export const Cine: React.FC<CineProps> = ({ scenes, seconds, subs = [] }) => (
  <AbsoluteFill style={{ background: BG }}>
    {scenes.map((s, i) => <Sequence key={i} from={Math.round(s.start * FPS)} durationInFrames={Math.max(1, Math.round((s.end - s.start) * FPS))}><ScenePart s={s} /></Sequence>)}
    <Subs subs={subs} /><Brand total={seconds} /><EndCard start={seconds - 1.9} />
  </AbsoluteFill>
);
