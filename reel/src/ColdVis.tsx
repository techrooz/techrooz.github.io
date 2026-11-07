// Visuals for the "why phone dies in cold" reel (style study: @scroll.engineer - callouts, slow camera, cinematic dark).
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { V } from "./fontLocal";
const FPS = 30, BL = "#3DA5FF", ICE = "#9fe0ff", OR = "#ff8a3d", RD = "#ff5a5a";
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FA = "۰۱۲۳۴۵۶۷۸۹"; const fa = (n: number | string) => String(n).replace(/\d/g, (d) => FA[+d]);
const useT = () => useCurrentFrame() / FPS;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const SVG: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>{children}</svg>;

const Snow: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} stroke={ICE} strokeWidth={5} strokeLinecap="round" opacity={o}>
    {[0, 60, 120].map((a) => <line key={a} x1={0} y1={-22} x2={0} y2={22} transform={`rotate(${a})`} />)}
  </g>);

export const Callout: React.FC<{ px: number; py: number; tx: number; ty: number; label: string; t0: number; color?: string }> = ({ px, py, tx, ty, label, t0, color = "#fff" }) => {
  const t = useT(); const k = ease((t - t0) / 0.5); if (k <= 0) return null;
  const ex = px + (tx - px) * k, ey = py + (ty - py) * k;
  return (<g opacity={Math.min(1, k * 2)}>
    <circle cx={px} cy={py} r={9} fill={color} /><circle cx={px} cy={py} r={20} fill="none" stroke={color} strokeWidth={2} opacity={0.6} />
    <line x1={px} y1={py} x2={ex} y2={ey} stroke={color} strokeWidth={3} />
    <text x={tx} y={ty - 14} textAnchor="middle" fontSize={42} fontWeight={800} fill={color} fontFamily={V} opacity={ease((t - t0 - 0.35) / 0.3)}>{label}</text></g>);
};

const Phone: React.FC<{ cx: number; cy: number; w?: number; h?: number; on: boolean; pct?: number }> = ({ cx, cy, w = 330, h = 640, on, pct = 30 }) => (
  <g transform={`translate(${cx - w / 2},${cy - h / 2})`}>
    <rect width={w} height={h} rx={56} fill="#0d0f16" stroke="#ffffffcc" strokeWidth={9} />
    <rect x={18} y={18} width={w - 36} height={h - 36} rx={40} fill={on ? "#10213a" : "#000"} />
    {on && <><rect x={w / 2 - 70} y={h / 2 - 30} width={140} height={66} rx={14} fill="none" stroke="#fff" strokeWidth={6} /><rect x={w / 2 + 72} y={h / 2 - 8} width={9} height={22} rx={4} fill="#fff" />
      <rect x={w / 2 - 62} y={h / 2 - 22} width={(124 * pct) / 100} height={50} rx={8} fill={RD} />
      <text x={w / 2} y={h / 2 + 130} textAnchor="middle" fontSize={78} fontWeight={900} fill="#fff" fontFamily={V}>{fa(pct)}٪</text></>}
    {!on && <text x={w / 2} y={h / 2 + 20} textAnchor="middle" fontSize={50} fontWeight={800} fill="#ffffff33" fontFamily={V}>خاموش</text>}
  </g>);

export const VPhoff: React.FC = () => {
  const t = useT(); const on = t < 2.1; const flash = interpolate(t, [2.05, 2.15, 2.5], [0, 0.35, 0], cl);
  return (<SVG>
    <circle cx={540} cy={780} r={380} fill={BL} opacity={0.07} />
    <Phone cx={540} cy={780} on={on} />
    {Array.from({ length: 14 }).map((_, i) => { const x = 90 + ((i * 197) % 900); const y = 420 + (((i * 131) + t * (70 + (i % 4) * 25)) % 760); return <Snow key={i} x={x} y={y} s={0.5 + (i % 3) * 0.25} o={0.5} />; })}
    <rect width={1080} height={1920} fill="#fff" opacity={flash} />
  </SVG>);
};

const Ions: React.FC<{ cold: boolean }> = ({ cold }) => {
  const t = useT(); const col = cold ? ICE : BL; const sp = cold ? 0.8 : 3.2;
  return (<SVG>
    <rect x={250} y={540} width={580} height={480} rx={36} fill={cold ? ICE : BL} opacity={cold ? 0.16 : 0.07} />
    <rect x={120} y={540} width={130} height={480} rx={20} fill="#2a2f3d" stroke="#ffffff88" strokeWidth={4} />
    <rect x={830} y={540} width={130} height={480} rx={20} fill="#2a2f3d" stroke="#ffffff88" strokeWidth={4} />
    {Array.from({ length: 11 }).map((_, i) => { const ph = (t * sp * 0.5 + i * 0.37) % 1; const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2; const x = 285 + tri * 510; const y = 580 + ((i * 83) % 400) + Math.sin(t * 3 + i) * (cold ? 4 : 14); return <circle key={i} cx={x} cy={y} r={i === 0 ? 20 : 15} fill={col} style={{ filter: `drop-shadow(0 0 14px ${col})` }} />; })}
    <Callout px={540} py={640} tx={540} ty={480} label="یون لیتیوم" t0={0.5} color={col} />
    <Callout px={185} py={780} tx={250} ty={1090} label="الکترود" t0={2.2} />
    {!cold && <text x={540} y={1110} textAnchor="middle" fontSize={64} fontWeight={900} fill={BL} fontFamily={V} opacity={ease((t - 4.5) / 0.5)}>رفت‌وآمد = جریان برق ⚡</text>}
    {cold && <><Callout px={420} py={900} tx={540} ty={1090} label="مایعِ غلیظ" t0={1.0} color={ICE} />{[0, 1, 2, 3].map((i) => <Snow key={i} x={330 + i * 140} y={560 + (i % 2) * 30} s={0.9} o={0.8} />)}</>}
  </SVG>);
};
export const VIonsA: React.FC = () => <Ions cold={false} />;
export const VIonsB: React.FC = () => <Ions cold={true} />;

export const VResist: React.FC = () => {
  const t = useT(); const k = ease(t / 3.5); const w = 140 + k * 640;
  return (<SVG>
    <text x={540} y={560} textAnchor="middle" fontSize={78} fontWeight={900} fill="#fff" fontFamily={V}>مقاومت داخلی باتری</text>
    <rect x={150} y={680} width={780} height={90} rx={45} fill="#1a1d27" stroke="#ffffff44" strokeWidth={4} />
    <rect x={150} y={680} width={w} height={90} rx={45} fill={k < 0.5 ? BL : OR} style={{ filter: `drop-shadow(0 0 24px ${k < 0.5 ? BL : OR}99)` }} />
    <Snow x={200} y={900} s={1.6} /><text x={290} y={915} fontSize={56} fontWeight={800} fill={ICE} fontFamily={V}>سرما</text>
    <text x={540} y={1090} textAnchor="middle" fontSize={150} fontWeight={900} fill={OR} fontFamily={V} opacity={ease((t - 2) / 0.6)}>↑</text>
    <Callout px={150 + w} py={725} tx={540} ty={1010} label="برق سخت‌تر رد می‌شه" t0={2.8} color={OR} />
  </SVG>);
};

const Sag: React.FC<{ stage: number }> = ({ stage }) => {
  const t = useT(); const X0 = 130, X1 = 950, YT = 640, YB = 1040, YC = 900;
  const pts = [[0, 0.1], [0.3, 0.1], [0.4, 0.15], [0.55, 0.62], [0.7, 0.8], [1, 0.82]];
  const path = pts.map(([x, y]) => `${X0 + x * (X1 - X0)},${YT + y * (YB - YT)}`);
  const prog = stage === 0 ? ease(t / 4.2) : 1; const n = pts.length - 1;
  const seg = prog * n; const i = Math.min(n - 1, Math.floor(seg)); const f = seg - i;
  const drawn = path.slice(0, i + 1).concat([`${(+path[i].split(",")[0]) + (+path[i + 1].split(",")[0] - +path[i].split(",")[0]) * f},${(+path[i].split(",")[1]) + (+path[i + 1].split(",")[1] - +path[i].split(",")[1]) * f}`]);
  const crossed = stage === 1 && t > 0.6;
  return (<SVG>
    <text x={540} y={580} textAnchor="middle" fontSize={56} fontWeight={800} fill="#ffffffcc" fontFamily={V}>ولتاژ باتری</text>
    <line x1={X0} y1={YT} x2={X0} y2={YB} stroke="#ffffff55" strokeWidth={4} /><line x1={X0} y1={YB} x2={X1} y2={YB} stroke="#ffffff55" strokeWidth={4} />
    <line x1={X0} y1={YC} x2={X1} y2={YC} stroke={RD} strokeWidth={5} strokeDasharray="18 14" />
    <text x={X0 + 16} y={YC - 16} textAnchor="start" fontSize={44} fontWeight={800} fill={RD} fontFamily={V}>حد خاموشی</text>
    <polyline points={drawn.join(" ")} fill="none" stroke={crossed ? RD : BL} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 16px ${crossed ? RD : BL})` }} />
    {stage === 0 && <Callout px={X0 + 0.5 * (X1 - X0)} py={YT + 0.4 * (YB - YT)} tx={800} ty={800} label="کار سنگین" t0={1.6} color={OR} />}
    {crossed && <text x={540} y={1110} textAnchor="middle" fontSize={96} fontWeight={900} fill={RD} fontFamily={V}>خاموش!</text>}
  </SVG>);
};
export const VSagA: React.FC = () => <Sag stage={0} />;
export const VSagB: React.FC = () => <Sag stage={1} />;

export const VStill: React.FC = () => {
  const t = useT();
  return (<SVG>
    <g transform="translate(260,560)"><rect width={560} height={300} rx={46} fill="none" stroke="#ffffffcc" strokeWidth={10} /><rect x={566} y={90} width={34} height={120} rx={12} fill="#ffffffcc" />
      <rect x={22} y={22} width={(516 * 0.3)} height={256} rx={30} fill={BL} style={{ filter: `drop-shadow(0 0 28px ${BL}88)` }} /></g>
    <text x={540} y={960} textAnchor="middle" fontSize={84} fontWeight={900} fill="#fff" fontFamily={V} opacity={ease(t / 0.5)}>✓ شارژ هنوز هست</text>
    <g opacity={ease((t - 2) / 0.5)}><Snow x={540} y={1020} s={1.4} /><text x={540} y={1100} textAnchor="middle" fontSize={50} fontWeight={800} fill={ICE} fontFamily={V}>باتریِ سرد نمی‌تونه تحویل بده</text></g>
  </SVG>);
};

export const VPocket: React.FC = () => {
  const t = useT(); const rise = ease(t / 1.2);
  return (<SVG>
    <circle cx={540} cy={830} r={360} fill={OR} opacity={0.09} />
    <g transform={`translate(0,${(1 - rise) * -120})`}><Phone cx={540} cy={690} w={240} h={470} on={true} pct={30} /></g>
    <path d="M250 800 Q540 760 830 800 L800 1080 Q540 1140 280 1080 Z" fill="#232838" stroke="#ffffff88" strokeWidth={6} />
    <text x={540} y={1000} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff" fontFamily={V}>جیب داخلی</text>
    <text x={540} y={1110} textAnchor="middle" fontSize={64} fontWeight={900} fill={OR} fontFamily={V} opacity={ease((t - 1.6) / 0.5)}>گرم ✓</text>
    <g opacity={ease((t - 3.2) / 0.5)}><Snow x={880} y={600} s={1.4} /><line x1={840} y1={560} x2={920} y2={640} stroke={RD} strokeWidth={10} strokeLinecap="round" /><text x={880} y={720} textAnchor="middle" fontSize={44} fontWeight={800} fill={RD} fontFamily={V}>بیرون ✕</text></g>
  </SVG>);
};

export const VWait: React.FC = () => {
  const t = useT(); const C = 2 * Math.PI * 140; const k = ease(t / 4);
  return (<SVG>
    <g transform="translate(540,720)"><circle r={140} fill="none" stroke="#ffffff22" strokeWidth={22} /><circle r={140} fill="none" stroke={OR} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${C * k} ${C}`} transform="rotate(-90)" style={{ filter: `drop-shadow(0 0 18px ${OR})` }} />
      <text y={26} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff" fontFamily={V}>چند دقیقه</text></g>
    <text x={540} y={950} textAnchor="middle" fontSize={52} fontWeight={800} fill="#ffffffcc" fontFamily={V}>بذارش تو جیب گرم</text>
    <g opacity={ease((t - 4.4) / 0.4)}><rect x={290} y={1000} width={500} height={100} rx={30} fill="none" stroke={RD} strokeWidth={8} /><text x={540} y={1070} textAnchor="middle" fontSize={58} fontWeight={900} fill={RD} fontFamily={V}>سشوار ✕</text></g>
  </SVG>);
};

export const VSave: React.FC = () => {
  const t = useT(); const a = ease(t / 0.6), b = ease((t - 1.6) / 0.6);
  return (<SVG>
    <g transform={`translate(330,760) scale(${a})`}><path d="M-70 -110 H70 V120 L0 60 L-70 120 Z" fill="none" stroke={BL} strokeWidth={14} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 20px ${BL})` }} /></g>
    <text x={330} y={1000} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff" fontFamily={V} opacity={a}>ذخیره</text>
    <g transform={`translate(750,760) scale(${b})`}><path d="M-110 -10 L110 -100 L40 110 L10 20 Z" fill="none" stroke={BL} strokeWidth={14} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 20px ${BL})` }} /></g>
    <text x={750} y={1000} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff" fontFamily={V} opacity={b}>بفرست</text>
  </SVG>);
};

export const COLD: Record<string, React.FC<any>> = { phoff: VPhoff, ionsA: VIonsA, ionsB: VIonsB, resist: VResist, sagA: VSagA, sagB: VSagB, still: VStill, pocket: VPocket, wait: VWait, save: VSave };
