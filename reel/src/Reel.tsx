// TechRooz "documentary collage" reel: crimson film look, torn-paper photos,
// hand-drawn doodles, layered big type. Scenes are timed to the voice-over.
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig, Sequence, random } from "remotion";
import { loadFont as vazir } from "@remotion/google-fonts/Vazirmatn";
import { loadFont as lalezar } from "@remotion/google-fonts/Lalezar";

const V = vazir("normal", { weights: ["500", "900"], subsets: ["arabic"] }).fontFamily;
const L = lalezar("normal", { weights: ["400"], subsets: ["arabic"] }).fontFamily;

export type Scene = { text: string; start: number; dur: number };
export type ReelProps = { scenes: Scene[]; photos: string[]; cat: string; seconds: number };
const CATS: Record<string, string> = { news: "خبر", games: "گیم", ai: "هوش مصنوعی", mobile: "موبایل", iran: "تک ایران", viral: "جالب", free: "رایگان" };
const RED = "#e11d2e", CREAM = "#f3e9dc";

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.16, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="1080" height="1920">
        <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 8} /></filter>
        <rect width="100%" height="100%" filter="url(#n)" />
      </svg>
    </AbsoluteFill>
  );
};

const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  const leak = interpolate(Math.sin(f / 23), [-1, 1], [0.15, 0.45]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #7a0c16 0%, #3a0309 55%, #120103 100%)" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${30 + 20 * Math.sin(f / 40)}% 15%, rgba(255,140,60,${leak}), transparent 45%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 280px 120px rgba(0,0,0,.85)" }} />
    </AbsoluteFill>
  );
};

// torn paper edge as a polygon clip path
const torn = (seed: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 20; i++) pts.push(`${i * 5}% ${random(seed + i) * 3}%`);
  for (let i = 0; i <= 20; i++) pts.push(`${100 - random(seed + 50 + i) * 3}% ${i * 5}%`);
  for (let i = 20; i >= 0; i--) pts.push(`${i * 5}% ${100 - random(seed + 100 + i) * 3}%`);
  for (let i = 20; i >= 0; i--) pts.push(`${random(seed + 150 + i) * 3}% ${i * 5}%`);
  return `polygon(${pts.join(",")})`;
};

const Photo: React.FC<{ src: string; i: number; dur: number }> = ({ src, i, dur }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 12, mass: 0.7 } });
  const zoom = interpolate(f, [0, dur * fps], [1.05, 1.18]);
  const rot = (random(i) - 0.5) * 10;
  return (
    <div style={{ position: "absolute", top: 360 + (i % 2) * 60, left: 110, width: 860, height: 820,
      transform: `translateY(${(1 - pop) * 900}px) rotate(${rot * pop}deg)`, filter: "drop-shadow(0 40px 50px rgba(0,0,0,.7))" }}>
      <div style={{ width: "100%", height: "100%", clipPath: torn(i * 7), background: CREAM, padding: 22 }}>
        <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
          <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, filter: "contrast(1.1) saturate(.85) sepia(.15)" }} />
        </div>
      </div>
    </div>
  );
};

// hand-drawn circle / arrow / sparkle that draw themselves
const Doodles: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [6, 26], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const kind = i % 3;
  const st = { fill: "none", stroke: "#fff", strokeWidth: 9, strokeLinecap: "round" as const, strokeDasharray: 1600, strokeDashoffset: 1600 * draw };
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
      {kind === 0 && <ellipse cx="540" cy="1330" rx="430" ry="150" transform="rotate(-4 540 1330)" style={st} />}
      {kind === 1 && <path d="M140 300 C 320 180, 520 260, 600 340 M560 300 L600 340 L548 362" style={st} />}
      {kind === 2 && [0, 1, 2].map(k => (
        <path key={k} d={`M${180 + k * 330} ${250 + k * 40} l20 60 l60 20 l-60 20 l-20 60 l-20 -60 l-60 -20 l60 -20 z`} style={{ ...st, strokeWidth: 6 }} />
      ))}
      <path d="M60 1840 L1020 1840" style={{ ...st, stroke: RED, strokeWidth: 14 }} />
    </svg>
  );
};

const Words: React.FC<{ text: string; dur: number; hook: boolean }> = ({ text, dur, hook }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const words = text.split(/\s+/);
  const step = Math.min(8, Math.floor((dur * fps * 0.6) / words.length));
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: hook ? 760 : 1240, direction: "rtl", textAlign: hook ? "center" : "right",
      fontFamily: V, fontWeight: 900, fontSize: hook ? 118 : 72, lineHeight: 1.35, color: CREAM, textShadow: "0 8px 30px rgba(0,0,0,.6)" }}>
      {words.map((w, k) => {
        const em = w.includes("*"); const clean = w.replace(/\*/g, "");
        const p = spring({ frame: f - k * step, fps, config: { damping: 14 } });
        return (
          <span key={k} style={{ display: "inline-block", marginLeft: 16, opacity: p, transform: `translateY(${(1 - p) * 50}px) scale(${0.7 + 0.3 * p})`,
            ...(em ? { fontFamily: L, fontWeight: 400, fontSize: "1.55em", color: "#fff", background: RED, padding: "0 18px", borderRadius: 8,
              transform: `translateY(${(1 - p) * 50}px) rotate(${(random(k) - 0.5) * 6}deg) scale(${0.7 + 0.3 * p})` } : {}) }}>{clean}</span>
        );
      })}
    </div>
  );
};

const Shake: React.FC<{ children: React.ReactNode; on: boolean }> = ({ children, on }) => {
  const f = useCurrentFrame();
  const a = on ? interpolate(f, [0, 12], [18, 0], { extrapolateRight: "clamp" }) : 0;
  return <AbsoluteFill style={{ transform: `translate(${Math.sin(f * 2.3) * a}px, ${Math.cos(f * 1.7) * a}px)` }}>{children}</AbsoluteFill>;
};

const SceneView: React.FC<{ s: Scene; i: number; photos: string[] }> = ({ s, i, photos }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const hook = i === 0;
  const inn = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(f, [s.dur * fps - 6, s.dur * fps], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const photo = !hook && photos.length ? photos[i % photos.length] : null;
  return (
    <AbsoluteFill style={{ opacity: Math.min(inn, out), transform: `scale(${interpolate(inn, [0, 1], [1.08, 1])})` }}>
      <Shake on={hook}>
        {photo && <Photo src={photo} i={i} dur={s.dur} />}
        <Doodles i={i} />
        <Words text={s.text} dur={s.dur} hook={hook} />
      </Shake>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: f, fps, config: { damping: 10 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", direction: "rtl", color: CREAM, background: "rgba(10,0,2,.85)" }}>
      <div style={{ transform: `scale(${p})` }}>
        <div style={{ fontFamily: L, fontSize: 190 }}>⚡ تک‌روز</div>
        <div style={{ fontFamily: V, fontWeight: 500, fontSize: 50, opacity: 0.8 }}>هر روز داغ‌ترین خبرهای تکنولوژی</div>
        <div dir="ltr" style={{ fontFamily: V, fontWeight: 900, fontSize: 72, marginTop: 40, background: RED, color: "#fff", padding: "16px 56px", borderRadius: 999, display: "inline-block" }}>@techrooz_fa</div>
      </div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC<ReelProps> = ({ scenes, photos, cat, seconds }) => {
  const { fps } = useVideoConfig(); const f = useCurrentFrame();
  const OUT = 2.6;
  return (
    <AbsoluteFill style={{ background: "#120103" }}>
      <Backdrop />
      {scenes.map((s, i) => (
        <Sequence key={i} from={Math.round(s.start * fps)} durationInFrames={Math.max(1, Math.round(s.dur * fps))}>
          <SceneView s={s} i={i} photos={photos} />
        </Sequence>
      ))}
      <Sequence from={Math.round((seconds - OUT) * fps)}><Outro /></Sequence>
      <div style={{ position: "absolute", top: 80, left: 70, right: 70, display: "flex", justifyContent: "space-between", direction: "rtl",
        fontFamily: V, fontWeight: 900, fontSize: 40, color: CREAM, zIndex: 5 }}>
        <span>⚡ تک‌روز</span>
        <span style={{ fontSize: 30, border: `3px solid ${CREAM}`, borderRadius: 999, padding: "4px 24px" }}>{CATS[cat] || "خبر"}</span>
      </div>
      <div style={{ position: "absolute", bottom: 0, right: 0, height: 12, background: RED, width: `${(f / (seconds * fps)) * 100}%` }} />
      <Grain />
    </AbsoluteFill>
  );
};
