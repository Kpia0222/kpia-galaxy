"use client";

import React, { useRef, useEffect } from "react";

interface Universe {
  id: number;
  name: string;
  type: "Canon" | "Xen" | "Lab" | "Unformed";
  erosion: number;
  tendency: number;
  color: string;
  starCount: number;
}

interface MultiverseSelectorDockProps {
  universes: Universe[];
  currentUniverseId: number | null;
  onSelectUniverse: (id: number) => void;
}

export default function MultiverseSelectorDock({
  universes,
  currentUniverseId,
  onSelectUniverse,
}: MultiverseSelectorDockProps) {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/60 border border-cyan-800 rounded-lg p-2 backdrop-blur-md flex gap-2">
        {universes.map((universe) => (
          <UniverseThumbnail
            key={universe.id}
            universe={universe}
            isCurrent={currentUniverseId === universe.id}
            onClick={() => onSelectUniverse(universe.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface UniverseThumbnailProps {
  universe: Universe;
  isCurrent: boolean;
  onClick: () => void;
}

function UniverseThumbnail({ universe, isCurrent, onClick }: UniverseThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw miniature galaxy visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    ctx.fillStyle = universe.color;
    for (let i = 0; i < universe.starCount / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 30;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const size = Math.random() * 2 + 1;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Add glow
      ctx.shadowBlur = 5;
      ctx.shadowColor = universe.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw central glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20);
    gradient.addColorStop(0, universe.color + "80");
    gradient.addColorStop(1, universe.color + "00");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw erosion/tendency indicators
    const erosionHeight = height * universe.erosion;
    ctx.fillStyle = "#ff4400";
    ctx.fillRect(0, height - erosionHeight, 2, erosionHeight);

    const tendencyHeight = height * universe.tendency;
    ctx.fillStyle = "#bc00ff";
    ctx.fillRect(width - 2, height - tendencyHeight, 2, tendencyHeight);
  }, [universe]);

  return (
    <button
      onClick={onClick}
      className={`relative group transition-all ${
        isCurrent
          ? "border-2 border-cyan-400 shadow-lg shadow-cyan-400/50"
          : "border border-cyan-800 hover:border-cyan-600"
      }`}
    >
      <canvas
        ref={canvasRef}
        width={80}
        height={80}
        className="block"
      />

      {/* Universe name overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-black/80 px-1 py-0.5 text-[8px] font-mono text-center transition-opacity ${
          isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{ color: universe.color }}
      >
        {universe.name}
      </div>

      {/* Current indicator */}
      {isCurrent && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: universe.color }}
        />
      )}

      {/* Status indicators */}
      <div className="absolute top-1 left-1 text-[8px] font-mono text-white/50">
        <div>E:{Math.floor(universe.erosion * 100)}</div>
        <div>T:{Math.floor(universe.tendency * 100)}</div>
      </div>
    </button>
  );
}
