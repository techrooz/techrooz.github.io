// News clip: real footage (trailer cuts + screenshots), big hook, word-by-word captions,
// key-number pop-ups, TechRooz header + progress bar. Audio is muxed later with ffmpeg.
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as vazir } from "@remotion/google-fonts/Vazirmatn";
const V = vazir("normal", { weights: ["500", "900"], subsets: ["arabic", "latin"] }).fontFamily;

export type ClipShot = { src: string; start: number; dur: number; from?: number; img?: boolean };
export type ClipLine = { text: string; start: number; end: number };
export type ClipPop = { text: string; start: number; dur: number };
export type ClipProps = { shots: ClipShot[]; lines: ClipLine[]; pops: ClipPop[]; hook: string; title: string; credit: string; seconds: number };

const Shot: React.FC<{ s: ClipShot; i: number }> = ({ s, i }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const t = f / (s.dur * fps);
  const z = interpolate(t, [0, 1], i % 2 ? [1.18, 1.05] : [1.05, 1.18]);
  const flash = interpolate(f, [0, 4], [0.5, 0], { extrapolateRight: "clamp" });
  const st: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})` };
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      {s.img ? <Img src={staticFile(s.src)} style={st} />
        : <OffthreadVideo src={staticFile(s.src)} muted startFrom={Math.round((s.from || 0) * fps)} style={st} />}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

// Captions: 3-word chunks, each word pops in; timed by character share inside its line.
const Captions: React.FC<{ lines: ClipLine[] }> = ({ lines }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const now = f / fps;
  const line = lines.find((l) => now >= l.start && now < l.end + 0.3);
  if (!line) return null;
  const words = line.text.split(/\s+/);
  const chunks: string[][] = [];
  for (let k = 0; k < words.length; k += 3) chunks.push(words.slice(k, k + 3));
  const total = chunks.reduce((a, c) => a + c.join(" ").length, 0);
  let acc = line.start, idx = 0;
  const span = line.end - line.start;
  for (let k = 0; k < chunks.length; k++) {
    const d = (chunks[k].join(" ").length / total) * span;
    if (now < acc + d || k === chunks.length - 1) { idx = k; break; }
    acc += d;
  }
  const local = (now - acc) * fps;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1250, direction: "rtl", textAlign: "center",
      fontFamily: V, fontWeight: 900, fontSize: 82, lineHeight: 1.35, color: "#fff",
      textShadow: "0 6px 24px rgba(0,0,0,.95), 0 0 4px #000" }}>
      {chunks[idx].map((w, k) => {
        const sp = spring({ frame: local - k * 3, fps, config: { damping: 12, stiffness: 220 } });
        const hot = /[!؟?]$|دلار|استیم|کنسول|تک‌روز|پلی‌استیشن/.test(w);
        return <span key={k} style={{ display: "inline-block", margin: "0 12px", transform: `scale(${0.6 + 0.4 * sp})`, opacity: sp,
          color: hot ? "#FFD60A" : "#fff" }}>{w}</span>;
      })}
    </div>
  );
};

const Pop: React.FC<{ p: ClipPop }> = ({ p }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const sp = spring({ frame: f, fps, config: { damping: 9, stiffness: 160 } });
  const out = interpolate(f, [p.dur * fps - 8, p.dur * fps], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: out }}>
      <div style={{ marginTop: -250, padding: "26px 60px", borderRadius: 36, background: "#FFD60A", color: "#111",
        fontFamily: V, fontWeight: 900, fontSize: 120, direction: "rtl", transform: `scale(${sp}) rotate(${(1 - sp) * -8}deg)`,
        boxShadow: "0 20px 60px rgba(0,0,0,.6)" }}>{p.text}</div>
    </AbsoluteFill>
  );
};

const Hook: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const sp = spring({ frame: f, fps, config: { damping: 10, stiffness: 200 } });
  const out = interpolate(f, [3.6 * fps, 4.4 * fps], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 300, opacity: out }}>
      <div style={{ fontFamily: V, fontWeight: 900, fontSize: 104, lineHeight: 1.25, color: "#fff", direction: "rtl", textAlign: "center",
        padding: "0 60px", transform: `translateY(${(1 - sp) * -80}px)`, opacity: sp, textShadow: "0 8px 30px rgba(0,0,0,.9)" }}>{text}</div>
    </AbsoluteFill>
  );
};

export const Clip: React.FC<ClipProps> = ({ shots, lines, pops, hook, title, credit, seconds }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000", direction: "ltr" }}>
      {shots.map((s, i) => (
        <Sequence key={i} from={Math.round(s.start * fps)} durationInFrames={Math.round(s.dur * fps)}><Shot s={s} i={i} /></Sequence>
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.55), transparent 22%, transparent 55%, rgba(0,0,0,.7) 80%, rgba(0,0,0,.85))" }} />
      <Sequence durationInFrames={Math.round(4.5 * fps)}><Hook text={hook} /></Sequence>
      {pops.map((p, i) => (
        <Sequence key={i} from={Math.round(p.start * fps)} durationInFrames={Math.round(p.dur * fps)}><Pop p={p} /></Sequence>
      ))}
      <Captions lines={lines} />
      <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center", direction: "rtl",
        fontFamily: V, fontWeight: 900, fontSize: 40, color: "#fff", opacity: 0.92 }}>⚡ تک‌روز · {title}</div>
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center", fontFamily: V, fontWeight: 500,
        fontSize: 24, color: "rgba(255,255,255,.6)" }}>{credit}</div>
      <div style={{ position: "absolute", top: 0, right: 0, height: 10, background: "#FFD60A", width: `${(f / (seconds * fps)) * 100}%` }} />
    </AbsoluteFill>
  );
};
