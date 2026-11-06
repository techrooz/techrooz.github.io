// Local Vazirmatn Black (public/v900.woff2): the google-fonts "arabic" subset rendered Persian ye/nun dots wrongly (found 2026-11-06). Always use this.
import { continueRender, delayRender, staticFile } from "remotion";
const h = delayRender("font VZ");
const f = new FontFace("VZ", `url(${staticFile("v900.woff2")})`, { weight: "100 900" });
f.load().then(() => { document.fonts.add(f); continueRender(h); }).catch(() => continueRender(h));
export const V = "VZ, Vazirmatn, sans-serif";
