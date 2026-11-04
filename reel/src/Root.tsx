import React from "react";
import { Composition } from "remotion";
import { Reel, ReelProps } from "./Reel";
import { Story, StoryProps } from "./Story";

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
  </>
);
