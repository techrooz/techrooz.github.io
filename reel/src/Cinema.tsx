// Premium "Cinema" reel: one hero visual per scene, restrained palette, big minimal type, slow push-ins.
import React from "react";
import { AbsoluteFill, Loop, OffthreadVideo, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as vazir } from "@remotion/google-fonts/Vazirmatn";
const V = vazir("normal", { weights: ["300", "500", "800", "900"], subsets: ["arabic", "latin"] }).fontFamily;
const RED = "#FF3B30";

export type CScene = { start: number; end: number; theme: "dark" | "light"; src?: string; dur?: number; zoom?: number; fx?: number; fy?: number; scale?: number; blend?: boolean; dim?: number; l1: string; l2?: string; accent?: string; sub?: string; crack?: boolean; big?: string; foot?: string };
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
      {s.src && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", top: -120 }}>
          <div style={{ width: 1080 * sc, height: 1000 * sc, transform: `scale(${push}) translate(${(s.fx ?? 0) * (1 - push) * 300}px,${(s.fy ?? 0) * (1 - push) * 300}px)`, mixBlendMode: s.blend ? "multiply" : "normal", opacity: (s.dim ?? 1) * inn, borderRadius: s.blend ? 0 : 36, overflow: "hidden", boxShadow: s.blend ? "none" : "0 40px 120px rgba(0,0,0,.6)" }}>
            <Loop durationInFrames={Math.max(10, Math.floor((s.dur ?? 3) * 30))}>
              <OffthreadVideo src={staticFile(s.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Loop>
          </div>
          {s.crack && (
            <svg width={1080} height={1000} viewBox="0 0 1080 1000" style={{ position: "absolute", opacity: 0.95 }}>
              <path d="M300 470 L380 500 L430 470 L520 515 L590 480 L690 520 L780 490" fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crackP} style={{ filter: "drop-shadow(0 0 14px #ff3b30)" }} />
            </svg>
          )}
        </AbsoluteFill>
      )}
      {s.big && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", top: -160 }}>
          <div style={{ fontFamily: V, fontWeight: 900, fontSize: 300, color: fg, letterSpacing: -8, transform: `scale(${0.8 + 0.2 * pop})`, opacity: pop }}>{s.big}</div>
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
