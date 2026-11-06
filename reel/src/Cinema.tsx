// Premium "Cinema" reel: one hero visual per scene, restrained palette, big minimal type, slow push-ins.
import React from "react";
import { AbsoluteFill, Loop, OffthreadVideo, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as vazir } from "@remotion/google-fonts/Vazirmatn";
const V = vazir("normal", { weights: ["300", "500", "800", "900"], subsets: ["arabic", "latin"] }).fontFamily;
const RED = "#FF3B30";

export type CScene = { start: number; end: number; theme: "dark" | "light"; src?: string; dur?: number; shots?: { src: string; dur: number; scale?: number; blend?: boolean; zoom?: number }[]; badge?: { text: string; color: string; at: number; rot?: number }; count?: number; zoom?: number; fx?: number; fy?: number; scale?: number; blend?: boolean; dim?: number; l1: string; l2?: string; accent?: string; sub?: string; crack?: boolean; big?: string; foot?: string };
export type CinemaProps = { seconds: number; scenes: CScene[] };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Scene: React.FC<{ s: CScene }> = ({ s }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps - s.start;
  const len = s.end - s.start;
  const dark = s.theme === "dark";
  const fg = dark ? "#fff" : "#111";
  const inn = interpolate(t, [0, 0.35], [0, 1], clamp);
  const out = interpolate(t, [len - 0.2, len], [1, 0], clamp);
  const push = 1 + (s.zoom ?? 0.07) * (t / len);
  const pop = spring({ frame: f - Math.round((s.start + 0.15) * fps), fps, config: { damping: 16, stiffness: 120 } });
  const sc = s.scale ?? 1;
  const crackP = interpolate(t, [0.5, 1.4], [0, 1], clamp);
  const mk = (txt: string) => txt.split(" ").map((w, i) => <span key={i} style={{ color: s.accent && w.includes(s.accent) ? RED : fg }}>{w} </span>);
  return (
    <AbsoluteFill style={{ opacity: Math.min(inn * 1.4, 1) * out, background: dark ? "radial-gradient(circle at 50% 38%,#1c1c20 0%,#09090b 75%)" : "radial-gradient(circle at 50% 40%,#f4f4f2 0%,#d9d9d6 100%)" }}>
      {(s.shots ?? (s.src ? [{ src: s.src, dur: s.dur ?? 3, scale: s.scale, blend: s.blend, zoom: s.zoom }] : [])).map((sh, k, arr) => {
        const n = arr.length, sl = len / n, ts = t - k * sl;
        if (ts < -0.001 || ts >= sl) return null;
        const alt = k % 2 ? -1 : 1;
        const z = 1 + (sh.zoom ?? 0.12) * (ts / sl) + 0.04 * (k % 3);
        const rot = alt * 1.2 * (1 - ts / sl);
        const fl = interpolate(ts, [0, 0.13], [0.9, 0], clamp);
        const bl = !!sh.blend;
        return (
          <AbsoluteFill key={k} style={{ alignItems: "center", justifyContent: "center", top: -120 }}>
            <div style={{ width: 1080 * (sh.scale ?? 1), height: 1000 * (sh.scale ?? 1), transform: `scale(${z}) rotate(${rot}deg)`, mixBlendMode: bl ? "multiply" : "normal", borderRadius: bl ? 0 : 36, overflow: "hidden", boxShadow: bl ? "none" : "0 40px 120px rgba(0,0,0,.6)", opacity: s.dim ?? 1 }}>
              <Loop durationInFrames={Math.max(10, Math.floor(sh.dur * 30))}>
                <OffthreadVideo src={staticFile(sh.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Loop>
            </div>
            <AbsoluteFill style={{ background: dark ? "#fff" : "#000", opacity: fl * 0.7 }} />
          </AbsoluteFill>
        );
      })}
      {s.crack && (
        <svg width={1080} height={1000} viewBox="0 0 1080 1000" style={{ position: "absolute", top: 160, opacity: 0.95 }}>
          <path d="M300 470 L380 500 L430 470 L520 515 L590 480 L690 520 L780 490" fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crackP} style={{ filter: "drop-shadow(0 0 16px #ff3b30)" }} />
        </svg>
      )}
      {s.badge && (() => { const bp = spring({ frame: f - Math.round((s.start + s.badge.at) * fps), fps, config: { damping: 9, stiffness: 200 } }); return (
        <div style={{ position: "absolute", top: 250, left: 90, transform: `scale(${bp}) rotate(${s.badge.rot ?? -6}deg)`, background: s.badge.color, color: "#fff", fontFamily: V, fontWeight: 900, fontSize: 70, padding: "14px 40px", borderRadius: 20, boxShadow: "0 18px 50px rgba(0,0,0,.35)", direction: "rtl" }}>{s.badge.text}</div>); })()}
      <div style={{ position: "absolute", top: 120, left: 60, right: 60, display: "flex", justifyContent: "space-between", alignItems: "center", direction: "ltr" }}>
        <div style={{ fontFamily: V, fontWeight: 800, fontSize: 38, color: fg, display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 18, height: 18, borderRadius: 9, background: RED, opacity: 0.5 + 0.5 * Math.sin(f / 5) }} />techrooz</div>
        <div style={{ fontFamily: V, fontWeight: 500, fontSize: 34, color: dark ? "#8e8e93" : "#666" }}>خبر داغ</div>
      </div>
      <div style={{ position: "absolute", top: 80, left: 60, right: 60, height: 6, background: dark ? "#2a2a2e" : "#c8c8c4", borderRadius: 3 }}><div style={{ width: `${(f / fps / 34) * 100}%`, height: 6, background: RED, borderRadius: 3 }} /></div>
      {s.big && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", top: -160 }}>
          <div style={{ fontFamily: V, fontWeight: 900, fontSize: 300, color: fg, letterSpacing: -8, transform: `scale(${0.8 + 0.2 * pop})`, opacity: pop }}>{s.count ? "$" + Math.round(s.count * interpolate(t, [0, 1.4], [0, 1], clamp)).toLocaleString("en") : s.big}</div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 330, direction: "rtl" }}>
        <div style={{ transform: `translateY(${(1 - pop) * 40}px)`, opacity: pop, textAlign: "center", padding: "0 70px" }}>
          <div style={{ fontFamily: V, fontWeight: 900, fontSize: 92, lineHeight: 1.25, letterSpacing: -1 }}>{mk(s.l1)}</div>
          {s.l2 && <div style={{ fontFamily: V, fontWeight: 900, fontSize: 92, lineHeight: 1.25 }}>{mk(s.l2)}</div>}
          {s.sub && <div style={{ fontFamily: V, fontWeight: 300, fontSize: 44, marginTop: 18, color: dark ? "#a7a7ad" : "#5a5a5f" }}>{s.sub}</div>}
        </div>
      </AbsoluteFill>
      {s.foot && <div style={{ position: "absolute", bottom: 250, width: "100%", textAlign: "center", fontFamily: V, fontWeight: 500, fontSize: 40, color: "#8e8e93", letterSpacing: 2 }}>{s.foot}</div>}
    </AbsoluteFill>
  );
};

export const Cinema: React.FC<CinemaProps> = ({ scenes }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    {scenes.map((s, i) => <Scene key={i} s={s} />)}
  </AbsoluteFill>
);
