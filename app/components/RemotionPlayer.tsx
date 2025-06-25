"use client";

import { Player } from "@remotion/player";
import { MyComposition } from "../../remotion/Composition";

export default function RemotionPlayer() {
  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Remotion Video Player
      </h2>
      <Player
        component={MyComposition}
        inputProps={{
          title: "Hello from Next.js + Remotion!",
        }}
        durationInFrames={90}
        compositionWidth={1920}
        compositionHeight={1080}
        fps={30}
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: "16/9",
        }}
        controls
      />
    </div>
  );
}
