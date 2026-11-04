import React from "react";
import { Composition } from "remotion";
import { Reel, ReelProps } from "./Reel";
import { Story, StoryProps } from "./Story";
import { Clip, ClipProps } from "./Clip";
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
