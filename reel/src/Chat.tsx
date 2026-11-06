// "Chat" reel: clean editorial page + chat-UI mockup that shows a bad prompt vs a built-up good prompt (before/after).
import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as vazir } from "@remotion/google-fonts/Vazirmatn";
import { loadFont as lalezar } from "@remotion/google-fonts/Lalezar";
import { Page, Reveal, ease, useT, Captions, Arrow, RED, TipLine } from "./Tips";
const V = vazir("normal", { weights: ["300", "800", "900"], subsets: ["arabic", "latin"] }).fontFamily;
const L = lalezar("normal", { subsets: ["arabic", "latin"] }).fontFamily;

export type ChatProps = {
  seconds: number; lines: TipLine[]; hot: string[];
  titles: { start: number; end: number; lead?: string; big: string; end_cta?: boolean }[];
  bad: { user: string; bot: string; userAt: number; botAt: number; until: number };
  segs: { at: number; text: string; color: string; tag: string }[];
  buildFrom: number; good: { at: number; text: string }; badTag: string; goodTag: string;
};

const Typed: React.FC<{ text: string; from: number; to: number }> = ({ text, from, to }) => {
  const { t } = useT();
  const n = Math.floor(ease(t, from, to) * text.length);
  return <>{text.slice(0, n)}</>;
};
const bubble = (user: boolean): React.CSSProperties => ({
  alignSelf: user ? "flex-end" : "flex-start", maxWidth: "92%", direction: "rtl", fontFamily: V, fontWeight: 800, fontSize: 44, lineHeight: 1.6,
  padding: "22px 34px", borderRadius: 38, background: user ? "#111" : "#f0f0f2", color: user ? "#fff" : "#111",
  borderBottomRightRadius: user ? 10 : 38, borderBottomLeftRadius: user ? 38 : 10, whiteSpace: "pre-wrap",
});
const Tag: React.FC<{ text: string; color: string; at: number }> = ({ text, color, at }) => {
  const { t } = useT(); const p = ease(t, at, at + 0.35);
  return <div style={{ opacity: p, transform: `scale(${0.8 + 0.2 * p})`, alignSelf: "flex-start", fontFamily: V, fontWeight: 900, fontSize: 36, color: "#fff", background: color, padding: "2px 26px", borderRadius: 99, direction: "rtl" }}>{text}</div>;
};

const Title: React.FC<{ s: ChatProps["titles"][0] }> = ({ s }) => {
  const { t } = useT();
  const op = Math.min(ease(t, s.start, s.start + 0.3), 1 - ease(t, s.end - 0.05, s.end + 0.25));
  if (op <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      {s.lead && <Reveal text={s.lead} at={s.start + 0.05} style={{ position: "absolute", top: 190, left: 60, right: 60, fontFamily: V, fontWeight: 300, fontSize: 58, color: "#444" }} />}
      <Reveal ghost text={s.big} at={s.start + 0.2} style={{ position: "absolute", top: 262, left: 40, right: 40, fontFamily: L, fontSize: 128, lineHeight: 1.1, color: "#111" }} />
      {s.end_cta && <Arrow at={s.start + 1.2} x={430} y={560} />}
      {s.end_cta && <Reveal text="@techrooz_fa" at={s.start + 1.6} style={{ position: "absolute", top: 1300, left: 0, right: 0, fontFamily: V, fontWeight: 900, fontSize: 64, color: RED, direction: "ltr" }} />}
    </AbsoluteFill>
  );
};

export const Chat: React.FC<ChatProps> = (p) => {
  const { t } = useT();
  const inBad = t < p.bad.until + 0.3;
  const badOp = 1 - ease(t, p.bad.until, p.bad.until + 0.3);
  const buildOp = ease(t, p.buildFrom, p.buildFrom + 0.35);
  const goodOn = t >= p.good.at;
  const last = p.segs[p.segs.length - 1];
  const showCard = t < last.at + 99; // always
  return (
    <AbsoluteFill style={{ direction: "ltr" }}>
      <Page />
      <div style={{ position: "absolute", top: 70, right: 60, fontFamily: V, fontWeight: 900, fontSize: 40, color: "#111", direction: "ltr" }}>@techrooz_fa</div>
      <div style={{ position: "absolute", top: 70, left: 60, fontFamily: L, fontSize: 52, color: RED }}>تک‌روز</div>
      {p.titles.map((s, i) => <Title key={i} s={s} />)}
      {showCard && t > 0.2 && t < p.titles[p.titles.length - 1].start + 0.1 && (
        <div style={{ position: "absolute", left: 50, right: 50, top: 600, height: 960, background: "#fff", borderRadius: 52, boxShadow: "0 30px 80px rgba(0,0,0,.18)", border: "3px solid #e7e7e7",
          padding: "30px 34px", display: "flex", flexDirection: "column", gap: 20, overflow: "hidden", opacity: ease(t, 0.15, 0.6) }}>
          <div style={{ direction: "rtl", fontFamily: V, fontWeight: 800, fontSize: 32, color: "#999", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 16, height: 16, borderRadius: 99, background: "#22c55e", display: "inline-block" }} />گفتگوی نمونه
          </div>
          {inBad && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22, opacity: badOp }}>
              <div style={{ ...bubble(true), opacity: ease(t, p.bad.userAt, p.bad.userAt + 0.3) }}><Typed text={p.bad.user} from={p.bad.userAt} to={p.bad.userAt + 0.9} /></div>
              {t > p.bad.botAt && <div style={bubble(false)}><Typed text={p.bad.bot} from={p.bad.botAt} to={p.bad.botAt + 1.6} /></div>}
              {t > p.bad.botAt + 1.4 && <Tag text={p.badTag} color={RED} at={p.bad.botAt + 1.4} />}
            </div>
          )}
          {t >= p.buildFrom && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, opacity: buildOp }}>
              <div style={{ ...bubble(true), fontSize: goodOn ? 34 : 42, lineHeight: 1.55, padding: "20px 30px", transition: "none" }}>
                {p.segs.map((sg, i) => {
                  const q = ease(t, sg.at, sg.at + 0.35);
                  return q > 0 ? <span key={i} style={{ opacity: q, background: sg.color, borderRadius: 16, padding: "0 12px", margin: "0 4px", display: "inline", boxDecorationBreak: "clone" as any, WebkitBoxDecorationBreak: "clone" as any }}>{sg.text}</span> : null;
                })}
              </div>
              <div style={{ display: "flex", gap: 14, direction: "rtl", flexWrap: "wrap" }}>
                {p.segs.map((sg, i) => t >= sg.at ? <Tag key={i} text={sg.tag} color={sg.color} at={sg.at} /> : null)}
              </div>
              {goodOn && (
                <>
                  <div style={bubble(false)}><Typed text={p.good.text} from={p.good.at} to={p.good.at + 2.0} /></div>
                  <Tag text={p.goodTag} color="#16A34A" at={p.good.at + 1.8} />
                </>
              )}
            </div>
          )}
        </div>
      )}
      <Captions lines={p.lines} hot={p.hot} />
      <div style={{ position: "absolute", top: 0, right: 0, height: 8, background: RED, width: `${(t / p.seconds) * 100}%` }} />
    </AbsoluteFill>
  );
};
