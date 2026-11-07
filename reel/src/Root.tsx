import React from "react";
import { Composition } from "remotion";
import { Reel, ReelProps } from "./Reel";
import { Story, StoryProps } from "./Story";
import { Clip, ClipProps } from "./Clip";
import { Chat, ChatProps } from "./Chat";
import { Collage, CollageProps } from "./Collage";
import { Lesson, LessonProps } from "./Lesson";
import { Cinema, CinemaProps } from "./Cinema";
import { Mob, MobProps } from "./Mob";
import { Explain, ExplainProps } from "./Explain";
import { Cine, CineProps } from "./Cine";
import { RenderReel, RProps } from "./RenderReel";
import { Tips, TipsProps } from "./Tips";
import { Editorial, EditorialProps } from "./Editorial";

const FPS = 30;
export const Root: React.FC = () => (
  <>
  <Composition
    id="Reel"
    component={Reel}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={30 * FPS}
    defaultProps={{ scenes: [{ text: "تک‌روز", start: 0, dur: 3 }], photos: [], cat: "news", seconds: 6 } as ReelProps}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as ReelProps).seconds * FPS) })}
  />
  <Composition
    id="Story"
    component={Story}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={60 * FPS}
    defaultProps={{ scenes: [], seconds: 10 } as StoryProps}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as StoryProps).seconds * FPS) })}
  />
  <Composition
    id="Clip"
    component={Clip}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={60 * FPS}
    defaultProps={{ shots: [], lines: [], pops: [], hook: "", title: "", credit: "", seconds: 10 } as ClipProps}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as ClipProps).seconds * FPS) })}
  />
  <Composition
    id="Collage"
    component={Collage}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={60 * FPS}
    defaultProps={{ seconds: 10, lines: [], hot: [], scenes: [] } as CollageProps}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as CollageProps).seconds * FPS) })}
  />
  <Composition id="Cine" component={Cine} fps={FPS} width={1080} height={1920} durationInFrames={60 * FPS} defaultProps={{ seconds: 10, scenes: [] } as CineProps} calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as CineProps).seconds * FPS) })} />
  <Composition id="RenderReel" component={RenderReel} fps={FPS} width={1080} height={1920} durationInFrames={60 * FPS} defaultProps={{ seconds: 10, scenes: [], subs: [] } as RProps} calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as RProps).seconds * FPS) })} />
  <Composition id="Explain" component={Explain} fps={FPS} width={1080} height={1920} durationInFrames={60 * FPS} defaultProps={{ seconds: 10, scenes: [] } as ExplainProps} calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as ExplainProps).seconds * FPS) })} />
  <Composition id="Mob" component={Mob} fps={FPS} width={1080} height={1920} durationInFrames={60 * FPS} defaultProps={{ seconds: 10, scenes: [] } as MobProps} calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as MobProps).seconds * FPS) })} />
  <Composition id="Lesson" component={Lesson} fps={FPS} width={1080} height={1920} durationInFrames={60 * FPS} defaultProps={{ seconds: 10, scenes: [] } as LessonProps} calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as LessonProps).seconds * FPS) })} />
  <Composition
    id="Cinema"
    component={Cinema}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={60 * FPS}
    defaultProps={{ seconds: 10, scenes: [] } as CinemaProps}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as CinemaProps).seconds * FPS) })}
  />
  <Composition
    id="Chat"
    component={Chat}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={60 * FPS}
    defaultProps={{ seconds: 10, lines: [], hot: [], titles: [], bad: { user: "", bot: "", userAt: 0, botAt: 1, until: 2 }, segs: [{ at: 1, text: "", color: "#000", tag: "" }], buildFrom: 2, good: { at: 5, text: "" }, badTag: "", goodTag: "" } as ChatProps}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as ChatProps).seconds * FPS) })}
  />
  <Composition
    id="Tips"
    component={Tips}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={60 * FPS}
    defaultProps={{ scenes: [], lines: [], seconds: 10, hot: [] } as TipsProps}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as TipsProps).seconds * FPS) })}
  />
  <Composition
    id="Editorial"
    component={Editorial}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={60 * FPS}
    defaultProps={{ scenes: [], lines: [], seconds: 10, hot: [] } as EditorialProps}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props as EditorialProps).seconds * FPS) })}
  />
  </>
);
