"use client";

import React, { useRef, useEffect } from "react";
import { clsx } from "clsx";

interface LissajousScopeProps {
  erosion: number;
  width?: number;
  height?: number;
}

export default function LissajousScope({ erosion, width = 200, height = 80 }: LissajousScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;

    const draw = () => {
      const w = width;
      const h = height;
      const centerX = w / 2;
      const centerY = h / 2;

      // Clear canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      // Lissajous parameters
      const freqX = 3;
      const freqY = 2;
      const phaseShift = time * 0.5;

      // Erosion effects
      const noiseAmount = erosion * 0.3;
      const lineWidthBase = 1.5;
      const lineWidthVariation = erosion > 0.5 ? Math.random() * 2 : 0;

      // Draw Lissajous curve
      ctx.beginPath();

      for (let t = 0; t < Math.PI * 2; t += 0.01) {
        // Calculate base position
        const x = centerX + Math.sin(freqX * t + phaseShift) * (w * 0.4);
        const y = centerY + Math.sin(freqY * t) * (h * 0.4);

        // Add glitch offset when erosion is high
        const glitchX = erosion > 0.3 ? (Math.random() - 0.5) * noiseAmount * 40 : 0;
        const glitchY = erosion > 0.3 ? (Math.random() - 0.5) * noiseAmount * 40 : 0;

        const finalX = x + glitchX;
        const finalY = y + glitchY;

        if (t === 0) {
          ctx.moveTo(finalX, finalY);
        } else {
          ctx.lineTo(finalX, finalY);
        }
      }

      ctx.closePath();

      // Color based on erosion
      let strokeColor;
      if (erosion < 0.3) {
        strokeColor = `rgba(0, 255, 255, ${0.9 - erosion})`;
      } else if (erosion < 0.7) {
        const r = Math.floor(erosion * 200);
        const g = Math.floor(255 - erosion * 100);
        strokeColor = `rgba(${r}, ${g}, 255, 0.9)`;
      } else {
        const r = Math.floor(150 + erosion * 105);
        const b = Math.floor(200 + erosion * 55);
        strokeColor = `rgba(${r}, ${Math.floor(erosion * 40)}, ${b}, 0.95)`;
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidthBase + lineWidthVariation;

      // Glow effect
      if (erosion > 0.4) {
        ctx.shadowBlur = 8 + erosion * 15;
        ctx.shadowColor = strokeColor;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Random pixel glitches at high erosion
      if (erosion > 0.7) {
        const glitchCount = Math.floor(erosion * 30);
        for (let i = 0; i < glitchCount; i++) {
          const px = Math.random() * w;
          const py = Math.random() * h;
          const size = 1 + Math.random() * 2;
          ctx.fillStyle = strokeColor;
          ctx.fillRect(px, py, size, size);
        }
      }

      time += 0.02 + erosion * 0.03;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [erosion, width, height]);

  return (
    <div className={clsx(
      "relative rounded border-2 border-zinc-800",
      "bg-black overflow-hidden",
      "shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]"
    )}>
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="block"
      />
      <div className="absolute top-1 left-1 text-[6px] text-zinc-700 font-mono pointer-events-none">
        LISSAJOUS
      </div>
    </div>
  );
}
