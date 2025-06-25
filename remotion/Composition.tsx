import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

interface MyCompositionProps {
  title: string;
}

export const MyComposition: React.FC<MyCompositionProps> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame, [0, 30], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1e40af",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          fontSize: 80,
          fontWeight: "bold",
          color: "white",
          textAlign: "center",
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};
