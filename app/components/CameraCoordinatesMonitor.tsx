"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useState } from "react";
import { Html } from "@react-three/drei";

export default function CameraCoordinatesMonitor() {
  const { camera } = useThree();
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });

  useFrame(() => {
    // Update camera coordinates every frame
    setCoords({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    });
  });

  return (
    <Html
      position={[0, 0, 0]}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        pointerEvents: 'none',
        zIndex: 40
      }}
    >
      <div className="bg-black/80 border-2 border-cyan-900/50 rounded px-4 py-3 backdrop-blur-sm shadow-xl">
        <div className="text-[8px] text-cyan-700 uppercase tracking-widest font-bold mb-1.5">
          CAMERA_POSITION
        </div>
        <div className="grid grid-cols-3 gap-3 text-[10px] font-mono">
          <div className="flex flex-col">
            <span className="text-cyan-600 text-[7px] mb-0.5">X</span>
            <span className="text-cyan-400 font-bold tabular-nums">
              {coords.x.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-cyan-600 text-[7px] mb-0.5">Y</span>
            <span className="text-cyan-400 font-bold tabular-nums">
              {coords.y.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-cyan-600 text-[7px] mb-0.5">Z</span>
            <span className="text-cyan-400 font-bold tabular-nums">
              {coords.z.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Html>
  );
}
