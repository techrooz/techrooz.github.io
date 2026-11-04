// Editorial news reel (Style B + accents of A): real footage in rounded 3D cards on a light page,
// lead + huge word, crack / circle / stamp / counter / price / glitch beats, synced captions, big brand.
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile } from "remotion";
import { loadFont as vazir } from "@remotion/google-fonts/Vazirmatn";
import { loadFont as lalezar } from "@remotion/google-fonts/Lalezar";
import { Page, Reveal, Stamp, Arrow, Captions, ease, useT, RED, TipLine } from "./Tips";
const V = vazir("normal", { weights: ["300", "800", "900"], subsets: ["arabic", "latin"] }).fontFamily;
const L = lalezar("normal", { subsets: ["arabic", "latin"] }).fontFamily;

export type EdScene = {
  start: number; end: number; lead?: string; big?: string;
  media?: { src: string; video?: boolean; rate?: number; from?: number };
  stamp?: string; crack?: number; circle?: boolean; counter?: { to: number; pre?: string; post?: string; fa?: boolean };
  glitch?: boolean; price?: [string, string]; chip?: string; outro?: boolean;
};
export type EditorialProps = { scenes: EdScene[]; lines: TipLine[]; seconds: number; hot: string[] };

const faNum = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

const Card: React.FC<{ s: EdScene }> = ({ s }) => {
  const { f, fps, t } = useT();
  const p = spring({ frame: f - Math.round(s.start * fps), fps, config: { damping: 15, stiffness: 110 } });
  const k = (t - s.start) / (s.end - s.start);
  const crackT = s.crack !== undefined ? t - s.crack : -1;
  const shake = crackT > 0 && crackT < 0.25 ? Math.sin(f * 2.3) * 14 : 0;
  const m = s.media!;
  const st: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.04 + k * 0.08})` };
  return (
    <div style={{ position: "absolute", left: 60, top: 470, width: 960, height: 860, borderRadius: 56, overflow: "hidden", background: "#fff",
      boxShadow: "0 70px 120px rgba(0,0,0,.28), 0 20px 40px rgba(0,0,0,.18)", opacity: p,
      transform: `perspective(2000px) rotateX(${(1 - p) * 30}deg) rotateZ(${(1 - p) * -4}deg) translate(${shake}px, ${(1 - p) * 220}px)` }}>
      {m.video
        ? <Sequence from={Math.round(s.start * fps)} layout="none"><OffthreadVideo src={staticFile(m.src)} muted playbackRate={m.rate || 1} startFrom={Math.round((m.from || 0) * fps)} style={st} /></Sequence>
        : <Img src={staticFile(m.src)} style={st} />}
      {crackT > 0 && <Crack p={ease(t, s.crack!, s.crack! + 0.35)} />}
      {crackT > 0 && crackT < 0.12 && <AbsoluteFill style={{ background: "#fff", opacity: 0.8 }} />}
      {s.circle && <Circle at={s.start + 0.8} />}
    </div>
  );
};

const Crack: React.FC<{ p: number }> = ({ p }) => (
  <svg viewBox="0 0 960 860" style={{ position: "absolute", inset: 0 }}>
    {["M480 0 L500 120 L462 230 L505 340 L470 430 L512 560 L476 690 L498 860",
      "M500 120 L590 170 L650 150", "M462 230 L380 270 L330 250", "M505 340 L610 380", "M470 430 L360 470 L300 520", "M512 560 L640 610 L700 600", "M476 690 L380 740"]
      .map((d, i) => <path key={i} d={d} fill="none" stroke={i ? "rgba(20,20,20,.85)" : "#111"} strokeWidth={i ? 4 : 7}
        strokeDasharray="1200" strokeDashoffset={1200 * (1 - p)} style={{ filter: "drop-shadow(0 0 3px #fff)" }} />)}
  </svg>
);

const Circle: React.FC<{ at: number }> = ({ at }) => {
  const { t } = useT();
  const p = ease(t, at, at + 0.7);
  return (
    <svg viewBox="0 0 960 860" style={{ position: "absolute", inset: 0 }}>
      <ellipse cx="480" cy="430" rx="170" ry="330" fill="none" stroke={RED} strokeWidth="12" strokeDasharray="1700" strokeDashoffset={1700 * (1 - p)} transform="rotate(-6 480 430)" />
    </svg>
  );
};

const Counter: React.FC<{ s: EdScene }> = ({ s }) => {
  const { t } = useT();
  const c = s.counter!;
  const p = ease(t, s.start + 0.2, s.start + 1.4);
  const n = Math.round(c.to * p);
  return (
    <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", fontFamily: L, fontSize: 330, color: RED, direction: "rtl",
      transform: `scale(${0.8 + 0.2 * p})`, textShadow: "0 30px 60px rgba(225,29,46,.25)" }}>
      {c.pre}{c.fa ? faNum(n) : n}{c.post}
    </div>
  );
};

const Glitch: React.FC<{ s: EdScene }> = ({ s }) => {
  const { f, t } = useT();
  const j = (k: number) => (Math.sin(f * 7.3 + k) * 12) | 0;
  const p = ease(t, s.start, s.start + 0.2);
  return (
    <AbsoluteFill style={{ background: "#0b0b0b", alignItems: "center", justifyContent: "center", opacity: p }}>
      <div style={{ fontFamily: L, fontSize: 210, color: "#fff", letterSpacing: 4, direction: "ltr",
        textShadow: `${j(1)}px 0 ${RED}, ${-j(2)}px 0 #00e5ff`, transform: `skewX(${j(3) / 3}deg)` }}>Crackgate</div>
      <div style={{ position: "absolute", top: 1150, fontFamily: V, fontWeight: 900, fontSize: 80, color: RED, direction: "rtl" }}>کرک‌گیت</div>
    </AbsoluteFill>
  );
};

const Price: React.FC<{ s: EdScene }> = ({ s }) => {
  const { t } = useT();
  const box = (txt: string, i: number, label: string) => {
    const p = ease(t, s.start + 0.3 + i * 0.6, s.start + 0.8 + i * 0.6);
    return (
      <div style={{ width: 440, padding: "50px 20px", borderRadius: 48, background: i ? RED : "#fff", color: i ? "#fff" : "#111", textAlign: "center",
        boxShadow: "0 40px 80px rgba(0,0,0,.2)", opacity: p, transform: `translateY(${(1 - p) * 120}px) rotate(${i ? 3 : -3}deg)` }}>
        <div style={{ fontFamily: V, fontWeight: 800, fontSize: 40, direction: "rtl", opacity: 0.8 }}>{label}</div>
        <div style={{ fontFamily: L, fontSize: 130, direction: "ltr" }}>{txt}</div>
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", top: 640, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 40, direction: "rtl" }}>
      {box(s.price![0], 0, "قیمت گوشی")}{box(s.price![1], 1, "تعمیر صفحه")}
    </div>
  );
};

const Scene: React.FC<{ s: EdScene }> = ({ s }) => {
  const { t } = useT();
  const inP = ease(t, s.start, s.start + 0.22), outP = ease(t, s.end - 0.04, s.end + 0.16);
  const op = Math.min(inP, 1 - outP);
  if (op <= 0) return null;
  if (s.glitch) return <AbsoluteFill style={{ opacity: op }}><Glitch s={s} /></AbsoluteFill>;
  // whip-in from the right, whip-out to the left (with motion blur) + punch-in zoom
  const x = (1 - inP) * 260 - outP * 260;
  const punch = 1 + (1 - ease(t, s.start, s.start + 0.3)) * 0.12;
  return (
    <AbsoluteFill style={{ opacity: op, filter: `blur(${Math.abs(x) / 18}px)`, transform: `translateX(${x}px) scale(${punch * (1 + (t - s.start) * 0.01)})` }}>
      {s.lead && <Reveal text={s.lead} at={s.start + 0.02} style={{ position: "absolute", top: 220, left: 60, right: 60, fontFamily: V, fontWeight: 300, fontSize: 58, color: "#444" }} />}
      {s.big && <Reveal ghost text={s.big} at={s.start + 0.2} style={{ position: "absolute", top: 290, left: 30, right: 30, fontFamily: L, fontSize: 132, lineHeight: 1.05, color: "#111" }} />}
      {s.media && <Card s={s} />}
      {s.counter && <Counter s={s} />}
      {s.price && <Price s={s} />}
      {s.chip && <Reveal text={s.chip} at={s.start + 0.8} style={{ position: "absolute", top: 1060, left: 0, right: 0, fontFamily: V, fontWeight: 900, fontSize: 56, color: "#111", direction: "ltr" }} />}
      {s.stamp && <Stamp text={s.stamp} at={(s.crack ?? s.start) + 0.35} x={700} y={1130} size={290} />}
      {s.outro && <Arrow at={s.start + 1.2} x={430} y={1340} />}
      {s.outro && <Reveal text="@techrooz_fa" at={s.start + 1.6} style={{ position: "absolute", top: 1360, left: 0, right: 0, fontFamily: V, fontWeight: 900, fontSize: 64, color: RED, direction: "ltr" }} />}
    </AbsoluteFill>
  );
};

const Leak: React.FC<{ scenes: EdScene[] }> = ({ scenes }) => {
  const { t } = useT();
  const s = scenes.find((q) => t >= q.start - 0.05 && t < q.start + 0.6);
  if (!s) return null;
  const p = (t - s.start + 0.05) / 0.65;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${-20 + p * 140}% 30%, rgba(255,170,90,.55), rgba(255,60,90,.25) 25%, transparent 50%)`, opacity: Math.sin(Math.PI * Math.min(1, p)) }} />
      <AbsoluteFill style={{ background: "#fff", opacity: Math.max(0, 0.35 - p * 3) }} />
    </AbsoluteFill>
  );
};

export const Editorial: React.FC<EditorialProps> = ({ scenes, lines, seconds, hot }) => {
  const { t } = useT();
  const dark = scenes.some((s) => s.glitch && t >= s.start && t < s.end);
  return (
    <AbsoluteFill style={{ direction: "ltr" }}>
      <Page />
      {scenes.map((s, i) => <Scene key={i} s={s} />)}
      <Leak scenes={scenes} />
      <Captions lines={lines} hot={hot} />
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ fontFamily: L, fontSize: 64, color: dark ? "#111" : "#fff", background: dark ? "#fff" : "#111", padding: "6px 34px", borderRadius: 999, direction: "rtl", boxShadow: "0 10px 30px rgba(0,0,0,.25)" }}>⚡ تک‌روز</div>
      </div>
      <div style={{ position: "absolute", top: 0, right: 0, height: 8, background: RED, width: `${(t / seconds) * 100}%` }} />
    </AbsoluteFill>
  );
};
