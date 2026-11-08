import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { kf } from "./timeline";
export type CamKey = { t: number; d: number; yaw: number; el: number; tx: number; ty: number; tz: number };
export type Cam = { d: number; yaw: number; el: number; tx: number; ty: number; tz: number; fov: number };
const D2R = Math.PI / 180;
/** orbit camera defined by distance/yaw/elevation around a target; keyframed by seconds. */
export const camAt = (t: number, keys: CamKey[], fov = 24): Cam => {
  const f = (k: keyof CamKey) => kf(t, keys.map((q) => [q.t, q[k]] as [number, number]));
  return { d: f("d"), yaw: f("yaw") + 1.4 * Math.sin(t * 0.45), el: f("el") + 0.8 * Math.sin(t * 0.31 + 1), tx: f("tx"), ty: f("ty"), tz: f("tz"), fov };
};
export const camPos = (c: Cam): [number, number, number] => [c.tx + c.d * Math.sin(c.yaw * D2R) * Math.cos(c.el * D2R), c.ty + c.d * Math.sin(c.el * D2R), c.tz + c.d * Math.cos(c.yaw * D2R) * Math.cos(c.el * D2R)];
export const CameraRig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const p = camPos(cam); const pc = camera as THREE.PerspectiveCamera;
    pc.position.set(...p); pc.fov = cam.fov; pc.near = 1; pc.far = 400; pc.lookAt(cam.tx, cam.ty, cam.tz); pc.updateProjectionMatrix(); pc.updateMatrixWorld();
  });
  return null;
};
/** project a world point to canvas pixels with exactly the camera the rig uses (for HTML chips). */
export const projector = (cam: Cam, w: number, h: number) => {
  const c = new THREE.PerspectiveCamera(cam.fov, w / h, 1, 400); c.position.set(...camPos(cam)); c.lookAt(cam.tx, cam.ty, cam.tz); c.updateMatrixWorld(); c.updateProjectionMatrix();
  return (p: [number, number, number]) => { const v = new THREE.Vector3(...p).project(c); return { x: (v.x * 0.5 + 0.5) * w, y: (1 - (v.y * 0.5 + 0.5)) * h }; };
};
