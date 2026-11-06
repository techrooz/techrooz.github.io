// "Explain" reel: black bg, animated diagrams per sentence, word-by-word subtitles with blue highlights (style study: @alimoqdm.dev, colour swapped green->blue). Brand + EndCard from Mob.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame } from "remotion";
import { V } from "./fontLocal";
import { Brand, EndCard } from "./Mob";
import { COLD } from "./ColdVis";
const FPS = 30, BL = "#3DA5FF", BG = "#08090D", GR = "linear-gradient(135deg,#7B5CFF,#14B8E6)";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FA = "۰۱۲۳۴۵۶۷۸۹"; const fa = (n: number | string) => String(n).replace(/\d/g, (d) => FA[+d]);
export type EScene = { start: number; end: number; vis: string; text: string; acc?: string[]; tag?: string; keyword?: string };
export type ESub = { s: number; e: number; t: string; acc?: string[] };
export type ExplainProps = { seconds: number; scenes: EScene[]; subs?: ESub[] };
const useT = () => useCurrentFrame() / FPS;
const pop = (t: number, t0: number, d = 14) => (t < t0 ? 0 : spring({ frame: (t - t0) * FPS, fps: FPS, config: { damping: d, stiffness: 170 } }));
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

const Sub: React.FC<{ text: string; acc: string[]; dur: number }> = ({ text, acc, dur }) => {
  const t = useT(); const words = text.split(" "); const tot = words.reduce((a, w) => a + w.length + 2, 0);
  let acu = 0; const starts = words.map((w) => { const s = (acu / tot) * dur * 0.96; acu += w.length + 2; return s; });
  let cur = 0; starts.forEach((s, i) => { if (t >= s) cur = i; });
  const chunk = Math.floor(cur / 3), ws = words.slice(chunk * 3, chunk * 3 + 3);
  return (<div style={{ position: "absolute", top: 1180, left: 60, right: 60, textAlign: "center", fontSize: 66, fontWeight: 900, lineHeight: 1.5, direction: "rtl", minHeight: 110 }}>
    {ws.map((w, i) => { const gi = chunk * 3 + i; const on = gi <= cur; const isA = acc.some((a) => w.includes(a)); return <span key={gi} style={{ margin: "0 10px", color: isA && on ? BL : on ? "#fff" : "#ffffff55", textShadow: isA && on ? `0 0 30px ${BL}88` : undefined }}>{w}</span>; })}
  </div>);
};
const Tag: React.FC<{ label: string }> = ({ label }) => { const t = useT(); return (<div style={{ position: "absolute", left: 60, top: 335, display: "flex", alignItems: "center", gap: 12, opacity: Math.min(1, t * 4), fontFamily: "monospace", fontSize: 28, fontWeight: 800, color: BL, letterSpacing: 3 }}><span style={{ width: 14, height: 14, borderRadius: 7, background: BL, boxShadow: `0 0 14px ${BL}` }} />{label}</div>); };

// ---- visuals (area y 400..1150) ----
const Battery: React.FC<{ pct: number; w?: number; color?: string; x?: number; y?: number }> = ({ pct, w = 560, color = BL, x = 260, y = 560 }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={0} y={0} width={w} height={300} rx={46} fill="none" stroke="#ffffffcc" strokeWidth={10} />
    <rect x={w + 6} y={90} width={34} height={120} rx={12} fill="#ffffffcc" />
    <rect x={22} y={22} width={Math.max(0, (w - 44) * pct / 100)} height={256} rx={30} fill={color} style={{ filter: `drop-shadow(0 0 28px ${color}88)` }} />
  </g>);
const Vis1: React.FC = () => { const t = useT(); const p = ease(t / 3.6); const pct = p < 0.6 ? (p / 0.6) * 68 : 68 + ((p - 0.6) / 0.4) * 30 * 0.6; return (<svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}><Battery pct={pct} /><text x={540} y={1040} textAnchor="middle" fontSize={150} fontWeight={900} fill={BL} fontFamily={V}>{fa(Math.round(pct))}٪</text></svg>); };
const Glass: React.FC<{ lvl: number; over?: boolean }> = ({ lvl, over }) => { const t = useT(); const H = 520, y0 = 520; return (<svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
  <path d={`M330 ${y0} L400 ${y0 + H} L680 ${y0 + H} L750 ${y0}`} fill="none" stroke="#ffffffcc" strokeWidth={10} strokeLinejoin="round" />
  <path d={`M${330 + 70 * (1 - lvl)} ${y0 + H * (1 - lvl)} L${750 - 70 * (1 - lvl)} ${y0 + H * (1 - lvl)} L680 ${y0 + H} L400 ${y0 + H}Z`} fill={over ? "#ff5a5a" : BL} opacity={0.9} style={{ filter: `drop-shadow(0 0 24px ${over ? "#ff5a5a" : BL}88)` }} />
  <rect x={528} y={y0 - 200} width={24} height={200 * Math.min(1, t * 3)} fill={over ? "#ff5a5a" : BL} opacity={0.8} />
  {over && <><ellipse cx={330} cy={y0 + 40} rx={26} ry={44} fill="#ff5a5a" opacity={0.7 * Math.min(1, t)} /><ellipse cx={750} cy={y0 + 40} rx={26} ry={44} fill="#ff5a5a" opacity={0.7 * Math.min(1, t)} /></>}
</svg>); };
const Vis2: React.FC = () => <Glass lvl={ease(useT() / 3.5) * 0.7} />;
const Vis3: React.FC = () => { const t = useT(); return (<><Glass lvl={0.7 + 0.3 * ease(t / 1.6)} over={t > 1.6} />{t > 1.8 && <div style={{ position: "absolute", top: 1060, width: "100%", textAlign: "center", fontSize: 70, fontWeight: 900, color: "#ff5a5a", transform: `scale(${pop(t, 1.8)})`, fontFamily: V }}>⚠ آسیب به باتری</div>}</>); };
const Chart: React.FC<{ upTo: number; from?: number; phase: "cc" | "cv" }> = ({ upTo, from = 0, phase }) => {
  const pts: string[] = []; const X = (x: number) => 140 + x * 800, Y = (y: number) => 1000 - y * 520;
  const f = (x: number) => (x < 0.4 ? (x / 0.4) * 0.68 : 0.68 + 0.32 * (1 - Math.exp(-(x - 0.4) * 5.2)));
  for (let i = 0; i <= 100; i++) { const x = (i / 100) * upTo; pts.push(`${X(x)},${Y(f(x))}`); }
  const cur = f(upTo);
  return (<svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
    <line x1={140} y1={1000} x2={940} y2={1000} stroke="#ffffff66" strokeWidth={4} /><line x1={140} y1={1000} x2={140} y2={470} stroke="#ffffff66" strokeWidth={4} />
    <line x1={X(0.4)} y1={470} x2={X(0.4)} y2={1000} stroke={BL} strokeWidth={3} strokeDasharray="12 12" opacity={0.6} />
    <polyline points={pts.join(" ")} fill="none" stroke={BL} strokeWidth={12} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 16px ${BL})` }} />
    <circle cx={X(upTo)} cy={Y(cur)} r={16} fill="#fff" />
    <text x={X(0.2)} y={1070} textAnchor="middle" fontSize={40} fontWeight={800} fill={phase === "cc" ? BL : "#ffffff88"} fontFamily={V}>جریان ثابت</text>
    <text x={X(0.7)} y={1070} textAnchor="middle" fontSize={40} fontWeight={800} fill={phase === "cv" ? BL : "#ffffff55"} fontFamily={V}>ولتاژ ثابت</text>
  </svg>); };
const Vis4: React.FC = () => { const t = useT(); const u = ease(t / 5) * 0.4; return (<><Chart upTo={u} phase="cc" />{t > 5 && <div style={{ position: "absolute", top: 560, left: 560, fontSize: 56, fontWeight: 900, color: "#fff", fontFamily: V, transform: `scale(${pop(t, 5)})` }}>~{fa(65)}–{fa(70)}٪</div>}</>); };
const Vis5: React.FC = () => { const t = useT(); const u = 0.4 + ease(t / 6) * 0.6; const bars = [1, 0.8, 0.62, 0.46, 0.33, 0.22, 0.14, 0.08]; const n = Math.floor(ease(t / 6) * bars.length) + 1; return (<><Chart upTo={u} phase="cv" />
  <div style={{ position: "absolute", top: 1100, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 14, height: 80, direction: "ltr" }}>{bars.slice(0, n).map((b, i) => <div key={i} style={{ width: 40, height: 70 * b + 6, background: BL, borderRadius: 8, opacity: 0.9 }} />)}</div></>); };
const Vis6: React.FC = () => { const t = useT(); return (<svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}><Battery pct={100} x={260} y={560} /><g transform={`translate(540,700) scale(${pop(t, 0.5)})`}><path d="M0 -190 L150 -130 L150 10 C150 110 70 170 0 210 C-70 170 -150 110 -150 10 L-150 -130Z" fill="#08090D" stroke={BL} strokeWidth={12} style={{ filter: `drop-shadow(0 0 30px ${BL})` }} /><path d="M-60 10 L-15 60 L70 -50" fill="none" stroke="#fff" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" /></g></svg>); };
const Vis7: React.FC = () => { const t = useT(); const life = 1 - 0.7 * ease(t / 5); return (<><svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}><Battery pct={100} color="#ff8a3d" y={470} /></svg>
  <div style={{ position: "absolute", top: 860, left: 140, right: 140, fontFamily: V }}><div style={{ fontSize: 44, fontWeight: 800, color: "#ffffffaa", marginBottom: 14 }}>عمر باتری</div><div style={{ height: 36, borderRadius: 18, background: "#ffffff22" }}><div style={{ width: `${life * 100}%`, height: "100%", borderRadius: 18, background: life > 0.5 ? BL : "#ff8a3d" }} /></div></div></>); };
const Vis8: React.FC = () => { const t = useT(); const on = t > 1.6; const k = ease((t - 1.6) / 0.3); return (<div style={{ position: "absolute", left: 140, right: 140, top: 520, fontFamily: V }}>
  <div style={{ background: "#14161d", border: "2px solid #ffffff22", borderRadius: 40, padding: "50px 50px", display: "flex", justifyContent: "space-between", alignItems: "center", transform: `scale(${pop(t, 0.2)})` }}>
    <div style={{ fontSize: 54, fontWeight: 900, color: "#fff" }}>محدود کردن شارژ</div>
    <div style={{ width: 150, height: 84, borderRadius: 42, background: on ? BL : "#ffffff33", position: "relative", boxShadow: on ? `0 0 40px ${BL}` : undefined }}><div style={{ position: "absolute", top: 8, left: 8 + 66 * (on ? k : 0), width: 68, height: 68, borderRadius: 34, background: "#fff" }} /></div></div>
  {on && <div style={{ marginTop: 40, textAlign: "center", fontSize: 150, fontWeight: 900, color: BL, transform: `scale(${pop(t, 2)})`, textShadow: `0 0 60px ${BL}88` }}>{fa(80)}٪</div>}</div>); };

// ---- iso helpers ----
const iso = (x: number, y: number, z: number, S = 1, ox = 540, oy = 800) => [ox + (x - y) * 0.866 * S, oy + (x + y) * 0.5 * S - z * S];
const IsoBox: React.FC<{ x: number; y: number; w: number; d: number; h: number; c?: [string, string, string]; S?: number; ox?: number; oy?: number; glow?: string }> = ({ x, y, w, d, h, c = ["#8fcbff", "#3d8fe0", "#245fa8"], S = 1, ox = 540, oy = 800, glow }) => {
  const P = (a: number, b: number, z: number) => iso(a, b, z, S, ox, oy).join(",");
  return (<g style={glow ? { filter: `drop-shadow(0 0 18px ${glow}88)` } : undefined}>
    <polygon points={`${P(x, y, h)} ${P(x + w, y, h)} ${P(x + w, y + d, h)} ${P(x, y + d, h)}`} fill={c[0]} />
    <polygon points={`${P(x, y + d, h)} ${P(x + w, y + d, h)} ${P(x + w, y + d, 0)} ${P(x, y + d, 0)}`} fill={c[1]} />
    <polygon points={`${P(x + w, y, h)} ${P(x + w, y + d, h)} ${P(x + w, y + d, 0)} ${P(x + w, y, 0)}`} fill={c[2]} />
  </g>);
};
const BLUE: [string, string, string] = ["#8fcbff", "#3d8fe0", "#245fa8"], RED: [string, string, string] = ["#ff9a9a", "#e04a4a", "#a82a2a"], GRY: [string, string, string] = ["#c9ced8", "#8b93a3", "#5d6577"];
const IsoBars: React.FC<{ hs: number[]; shown?: number; color?: [string, string, string]; label?: string }> = ({ hs, shown = 99, color = BLUE, label }) => (<>
  <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
    <polygon points={[iso(-30, -30, 0, 1, 540, 700), iso(hs.length * 80 + 10, -30, 0, 1, 540, 700), iso(hs.length * 80 + 10, 170, 0, 1, 540, 700), iso(-30, 170, 0, 1, 540, 700)].map((p) => p.join(",")).join(" ")} fill="#11141c" stroke="#ffffff22" strokeWidth={3} />
    {hs.slice(0, shown).map((h, i) => <IsoBox key={i} x={i * 80} y={20} w={56} d={90} h={h} c={color} oy={700} glow={color[1]} />)}
  </svg>
  {label && <div style={{ position: "absolute", top: 960, width: "100%", textAlign: "center", fontFamily: V, fontSize: 52, fontWeight: 900, color: BL }}>{label}</div>}</>);
const Vbars: React.FC = () => { const t = useT(); return <IsoBars hs={[260, 260, 260, 260, 260, 260, 260, 260]} shown={Math.ceil(t * 3)} label="جریان: ثابت و زیاد" />; };
const Vshrink: React.FC = () => { const t = useT(); const hs = [260, 220, 180, 140, 105, 75, 50, 30].map((h, i) => (t > i * 0.45 ? h : 260)); return <IsoBars hs={hs} label="جریان: کم‌کم کمتر" />; };
const Vtwo: React.FC = () => { const t = useT(); return (<svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
  <g opacity={Math.min(1, t * 3)}><IsoBox x={-260} y={0} w={200} d={200} h={170} c={BLUE} oy={760} glow={BL} /></g>
  <g opacity={Math.min(1, Math.max(0, t - 0.8) * 3)}><IsoBox x={60} y={0} w={200} d={200} h={170} c={GRY} oy={760} /></g>
  <text x={300} y={880} fontSize={160} fontWeight={900} fill="#fff" fontFamily={V} opacity={Math.min(1, t * 3)}>۱</text>
  <text x={640} y={880} fontSize={160} fontWeight={900} fill="#ffffffaa" fontFamily={V} opacity={Math.min(1, Math.max(0, t - 0.8) * 3)}>۲</text></svg>); };
const Vdmg: React.FC = () => { const t = useT(); const sh = Math.sin(t * 40) * (t < 1.2 ? 6 : 0); return (<><svg width="1080" height="1920" style={{ position: "absolute", inset: 0, transform: `translateX(${sh}px)` }}><Battery pct={100} color="#ff5a5a" /><path d="M520 560 L560 640 L520 700 L580 790 L560 860" stroke="#fff" strokeWidth={10} fill="none" opacity={Math.min(1, Math.max(0, t - 0.5) * 3)} /></svg>
  <div style={{ position: "absolute", top: 1000, width: "100%", textAlign: "center", fontSize: 76, fontWeight: 900, color: "#ff5a5a", fontFamily: V, transform: `scale(${pop(t, 0.7)})` }}>⚠ آسیب دیدن</div></>); };
const Vflow: React.FC = () => { const t = useT(); return (<><svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}><Battery pct={Math.min(68, ease(t / 4) * 68)} x={380} y={600} w={440} />
  <rect x={80} y={650} width={190} height={200} rx={30} fill="#1b1f2a" stroke={BL} strokeWidth={6} /><text x={175} y={775} textAnchor="middle" fill={BL} fontSize={100} fontWeight={900} fontFamily={V}>⚡</text>
  {[0, 1, 2, 3].map((i) => <polygon key={i} points="0,-24 40,0 0,24" fill={BL} opacity={0.9} transform={`translate(${290 + ((t * 120 + i * 20) % 80)},750)`} />)}</svg>
  <div style={{ position: "absolute", top: 960, width: "100%", textAlign: "center", fontFamily: V, fontSize: 48, fontWeight: 800, color: "#fff" }}>تا رسیدن ولتاژ به حدِ مجاز <span style={{ color: BL }}>({fa(4.2)}V)</span></div></>); };
const Vvolt: React.FC = () => { const t = useT(); const u = ease(t / 2.4); return (<svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
  <line x1={140} y1={1000} x2={940} y2={1000} stroke="#ffffff66" strokeWidth={4} /><line x1={140} y1={1000} x2={140} y2={520} stroke="#ffffff66" strokeWidth={4} />
  <polyline points={`140,1000 340,600 ${340 + 600 * u},600`} fill="none" stroke={BL} strokeWidth={12} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 16px ${BL})` }} />
  <text x={640} y={560} textAnchor="middle" fill={BL} fontSize={60} fontWeight={900} fontFamily={V}>ولتاژ ثابت</text></svg>); };
const Vtime: React.FC = () => { const t = useT(); const a = ease(t / 1.2), b = ease((t - 1.2) / 1.5); return (<div style={{ position: "absolute", left: 100, right: 100, top: 560, fontFamily: V }}>
  <div style={{ fontSize: 46, fontWeight: 800, color: "#ffffffbb", marginBottom: 12 }}>مرحله‌ی ۱ (جریان ثابت)</div><div style={{ height: 70, width: `${a * 100}%`, background: BL, borderRadius: 18 }} />
  <div style={{ fontSize: 46, fontWeight: 800, color: "#ffffffbb", margin: "50px 0 12px" }}>مرحله‌ی ۲ (ولتاژ ثابت)</div><div style={{ height: 70, width: `${Math.min(1, b) * 100}%`, background: "#8b93a3", borderRadius: 18 }} /></div>); };
const Vtop: React.FC = () => { const t = useT(); return (<svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}><Battery pct={100} /><g transform={`translate(800,540) scale(${pop(t, 0.6)})`}><circle r={90} fill="#ff5a5a" /><path d="M-40 -40 L40 40 M40 -40 L-40 40" stroke="#fff" strokeWidth={22} strokeLinecap="round" /></g></svg>); };
const Vtitle: React.FC = () => { const t = useT(); return (<><Glass lvl={0.15} /><div style={{ position: "absolute", top: 400, width: "100%", textAlign: "center", fontFamily: V, fontSize: 90, fontWeight: 900, color: BL, transform: `scale(${pop(t, 0.2)})` }}>یه مثال ساده</div></>); };
const Vgfill: React.FC = () => <Glass lvl={0.15 + ease(useT() / 2.6) * 0.55} />;
const Vgover: React.FC = () => { const t = useT(); return <Glass lvl={0.7 + 0.3 * ease(t / 2.2)} over={t > 2.4} />; };

const Cta: React.FC<{ kw: string }> = ({ kw }) => { const t = useT(); const n = Math.floor(interpolate(t, [0.8, 2], [0, kw.length], cl)); return (<div style={{ position: "absolute", left: 140, right: 140, top: 520, fontFamily: V, transform: `scale(${pop(t, 0.15)})` }}><div style={{ background: "#14161d", border: "2px solid #ffffff22", borderRadius: 40, padding: 44 }}><div style={{ fontSize: 38, fontWeight: 800, color: "#ffffff88", direction: "ltr" }}>@techrooz.fa</div><div style={{ marginTop: 30, height: 120, borderRadius: 60, background: "#23262f", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", fontSize: 56, fontWeight: 900, color: "#fff" }}><div>{kw.slice(0, n)}<span style={{ color: BL, opacity: Math.floor(t * 3) % 2 }}>|</span></div><div style={{ width: 80, height: 80, borderRadius: 40, background: BL, color: "#fff", textAlign: "center", lineHeight: "80px" }}>↑</div></div><div style={{ marginTop: 36, fontSize: 52, fontWeight: 900, color: "#30d158", opacity: Math.min(1, Math.max(0, t - 2.3) * 4) }}>✓ ارسال شد</div></div></div>); };
const VIS: Record<string, React.FC<any>> = { v1: Vis1, v2: Vis2, v3: Vis3, v4: Vis4, v5: Vis5, v6: Vis6, v7: Vis7, v8: Vis8, bars: Vbars, shrink: Vshrink, two: Vtwo, dmg: Vdmg, flow: Vflow, volt: Vvolt, time: Vtime, top: Vtop, gtitle: Vtitle, gfill: Vgfill, gover: Vgover, ...COLD };

const ScenePart: React.FC<{ s: EScene }> = ({ s }) => {
  const t = useT(); const dur = s.end - s.start; const V_ = VIS[s.vis]; const o = Math.min(1, t * 8);
  return (<AbsoluteFill style={{ fontFamily: V, background: BG }}>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%,#3da5ff14,transparent 60%)" }} />
    <AbsoluteFill style={{ opacity: o, transform: `scale(${1 + 0.07 * Math.min(1, t / Math.max(1, dur))})`, transformOrigin: "50% 45%" }}>{V_ ? <V_ /> : <Cta kw={s.keyword || ""} />}</AbsoluteFill>
    {s.tag && <Tag label={s.tag} />}
  </AbsoluteFill>);
};
const Subs: React.FC<{ subs: ESub[] }> = ({ subs }) => {
  const t = useCurrentFrame() / FPS; let cur: ESub | undefined;
  subs.forEach((x) => { if (t >= x.s) cur = x; });
  if (!cur || t > cur.e + 0.7) return null;
  const k = Math.min(1, (t - cur.s) * 10);
  return (<div style={{ position: "absolute", top: 1180, left: 60, right: 60, textAlign: "center", fontSize: 70, fontWeight: 900, lineHeight: 1.4, direction: "rtl", fontFamily: V, transform: `translateY(${(1 - k) * 18}px)`, opacity: k }}>
    {cur.t.split(" ").map((w, i) => { const isA = (cur!.acc || []).some((a) => w.includes(a)); return <span key={i} style={{ display: "inline-block", margin: "0 11px", color: isA ? BL : "#fff", textShadow: isA ? `0 0 30px ${BL}99` : "0 4px 20px #000" }}>{w}</span>; })}
  </div>);
};
export const Explain: React.FC<ExplainProps> = ({ scenes, seconds, subs = [] }) => (
  <AbsoluteFill style={{ background: BG }}>
    {scenes.map((s, i) => <Sequence key={i} from={Math.round(s.start * FPS)} durationInFrames={Math.max(1, Math.round((s.end - s.start) * FPS))}><ScenePart s={s} /></Sequence>)}
    <Subs subs={subs} />
    <Brand total={seconds} />
    <EndCard start={seconds - 1.9} />
  </AbsoluteFill>
);
