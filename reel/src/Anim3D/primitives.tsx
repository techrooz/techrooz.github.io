// Anim3D primitives: BlockField (instanced rounded tiles/stacks/towers), GlowFrame (slab edge with travelling light), Rail (path + cursor light).
import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
export type Item = { p: [number, number, number]; s: [number, number, number]; c: THREE.ColorRepresentation; ry?: number };
let _geo: THREE.BufferGeometry | null = null;
/** unit rounded box (1x1x1, bevelled). Scaled per instance -> Tile (flat), Stack/Tower slab (height animation). */
export const roundedUnit = () => {
  if (_geo) return _geo;
  const r = 0.16, h = 0.5; const sh = new THREE.Shape();
  sh.moveTo(-h + r, -h); sh.lineTo(h - r, -h); sh.quadraticCurveTo(h, -h, h, -h + r); sh.lineTo(h, h - r); sh.quadraticCurveTo(h, h, h - r, h); sh.lineTo(-h + r, h); sh.quadraticCurveTo(-h, h, -h, h - r); sh.lineTo(-h, -h + r); sh.quadraticCurveTo(-h, -h, -h + r, -h);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.06, bevelSegments: 3, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); g.computeBoundingBox(); const b = g.boundingBox!; const c = new THREE.Vector3(); b.getCenter(c); g.translate(-c.x, -c.y, -c.z);
  const s = new THREE.Vector3(); b.getSize(s); g.scale(1 / s.x, 1 / s.y, 1 / s.z); g.computeVertexNormals(); _geo = g; return g;
};
export const BlockField: React.FC<{ items: Item[] }> = ({ items }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => roundedUnit(), []);
  useLayoutEffect(() => {
    const m = ref.current!; const d = new THREE.Object3D(); const col = new THREE.Color();
    items.forEach((it, i) => { d.position.set(...it.p); d.rotation.set(0, it.ry ?? 0, 0); d.scale.set(Math.max(1e-4, it.s[0]), Math.max(1e-4, it.s[1]), Math.max(1e-4, it.s[2])); d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, col.set(it.c)); });
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere();
  });
  return (<instancedMesh ref={ref} args={[geo, undefined, items.length]} frustumCulled={false} castShadow receiveShadow>
    <meshStandardMaterial roughness={0.5} metalness={0.08} emissive="#ffffff" emissiveIntensity={0.07} />
  </instancedMesh>);
};
/** thin glowing line segment as a box (no line-width limits). */
const Bar: React.FC<{ a: [number, number, number]; b: [number, number, number]; w?: number; color: string }> = ({ a, b, w = 0.07, color }) => {
  const dx = b[0] - a[0], dz = b[2] - a[2]; const len = Math.hypot(dx, dz);
  return (<mesh position={[(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]}><boxGeometry args={[len, w, w]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>);
};
const glowTex = (() => { if (typeof document === "undefined") return null; const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d")!; const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
export const Glow: React.FC<{ p: [number, number, number]; size: number; color: string; opacity?: number }> = ({ p, size, color, opacity = 1 }) => (
  <sprite position={p} scale={[size, size, 1]}><spriteMaterial map={glowTex} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></sprite>);
const perim = (w: number, d: number, u: number): [number, number] => { const P = 2 * (w + d); let s = ((u % 1) + 1) % 1 * P; if (s < w) return [-w / 2 + s, -d / 2]; s -= w; if (s < d) return [w / 2, -d / 2 + s]; s -= d; if (s < w) return [w / 2 - s, d / 2]; s -= w; return [-w / 2, d / 2 - s]; };
/** Slab: flat dark plate with an emissive edge loop and travelling light dots (like the ref's glowing slabs). */
export const Slab: React.FC<{ w: number; d: number; h?: number; y?: number; color?: string; edge: string; t: number; dots?: number; glow?: number; body?: boolean }> = ({ w, d, h = 0.3, y = 0, color = "#171c25", edge, t, dots = 3, glow = 1, body = true }) => {
  const yy = y + h / 2 + 0.01; const c: [number, number, number][] = [[-w / 2, yy, -d / 2], [w / 2, yy, -d / 2], [w / 2, yy, d / 2], [-w / 2, yy, d / 2]];
  return (<group>
    {body && <mesh position={[0, y, 0]} receiveShadow castShadow><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={color} roughness={0.6} /></mesh>}
    {c.map((p, i) => <Bar key={i} a={p} b={c[(i + 1) % 4]} color={edge} />)}
    {Array.from({ length: dots }).map((_, i) => { const [x, z] = perim(w, d, t * 0.12 + i / dots); return <Glow key={i} p={[x, yy + 0.05, z]} size={1.5 * glow} color={edge} />; })}
  </group>);
};
/** Rail: tube along a curve; a cursor light travels along it with u in 0..1. */
export const Rail: React.FC<{ pts: [number, number, number][]; u: number; color: string; opacity?: number; show?: number }> = ({ pts, u, color, opacity = 1, show = 1 }) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), [JSON.stringify(pts)]);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 48, 0.06, 6, false), [curve]);
  const p = curve.getPoint(Math.min(1, Math.max(0, u)));
  return (<group visible={show > 0.01}>
    <mesh geometry={geo}><meshBasicMaterial color="#2b3442" transparent opacity={opacity} /></mesh>
    <mesh position={p}><sphereGeometry args={[0.2, 12, 12]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>
    <Glow p={[p.x, p.y, p.z]} size={2.6} color={color} opacity={opacity} />
  </group>);
};
/** wireframe ghost box (expected / removed size). */
export const Ghost: React.FC<{ p: [number, number, number]; s: [number, number, number]; opacity?: number }> = ({ p, s, opacity = 0.35 }) => {
  const g = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  return (<lineSegments geometry={g} position={p} scale={s}><lineBasicMaterial color="#9fb6d6" transparent opacity={opacity} toneMapped={false} /></lineSegments>);
};
