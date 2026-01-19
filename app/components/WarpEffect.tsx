"use client";

import React, { useEffect, useState } from "react";
import { ChromaticAberration, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

interface WarpEffectProps {
  isWarping: boolean;
  warpProgress: number; // 0.0 to 1.0
}

export default function WarpEffect({ isWarping, warpProgress }: WarpEffectProps) {
  if (!isWarping) return null;

  // Calculate effect intensity based on warp progress
  // Peak at middle (0.5), fade at start and end
  const intensity = Math.sin(warpProgress * Math.PI);

  return (
    <>
      <ChromaticAberration
        offset={new THREE.Vector2(intensity * 0.05, intensity * 0.05)}
        blendFunction={BlendFunction.NORMAL}
      />
      <Bloom
        intensity={intensity * 2.0}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </>
  );
}
