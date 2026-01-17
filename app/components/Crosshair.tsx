"use client";

import React from "react";

interface CrosshairProps {
  targetEntity?: string | null;
  targetLabel?: string;
  isLocked: boolean;
}

export default function Crosshair({ targetEntity, targetLabel, isLocked }: CrosshairProps) {
  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Crosshair reticle */}
      <div className="relative">
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div
            className={`w-2 h-2 rounded-full ${
              targetEntity ? "bg-cyan-400 shadow-lg shadow-cyan-400/50" : "bg-white/50"
            }`}
          />
        </div>

        {/* Horizontal line */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div
            className={`h-0.5 ${
              targetEntity ? "bg-cyan-400 w-8" : "bg-white/30 w-6"
            } transition-all`}
          />
        </div>

        {/* Vertical line */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90">
          <div
            className={`h-0.5 ${
              targetEntity ? "bg-cyan-400 w-8" : "bg-white/30 w-6"
            } transition-all`}
          />
        </div>

        {/* Corner brackets (when targeting entity) */}
        {targetEntity && (
          <>
            {/* Top-left */}
            <div className="absolute -top-4 -left-4">
              <div className="w-3 h-0.5 bg-cyan-400" />
              <div className="w-0.5 h-3 bg-cyan-400" />
            </div>

            {/* Top-right */}
            <div className="absolute -top-4 -right-4">
              <div className="w-3 h-0.5 bg-cyan-400 ml-auto" />
              <div className="w-0.5 h-3 bg-cyan-400 ml-auto" />
            </div>

            {/* Bottom-left */}
            <div className="absolute -bottom-4 -left-4">
              <div className="w-0.5 h-3 bg-cyan-400" />
              <div className="w-3 h-0.5 bg-cyan-400" />
            </div>

            {/* Bottom-right */}
            <div className="absolute -bottom-4 -right-4">
              <div className="w-0.5 h-3 bg-cyan-400 ml-auto" />
              <div className="w-3 h-0.5 bg-cyan-400 ml-auto" />
            </div>
          </>
        )}
      </div>

      {/* Target label */}
      {targetEntity && targetLabel && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 mt-8">
          <div className="bg-cyan-900/80 border border-cyan-400 px-3 py-1 rounded backdrop-blur-sm">
            <div className="text-cyan-400 text-xs font-mono uppercase tracking-wider">
              {targetLabel}
            </div>
            <div className="text-cyan-200 text-[10px] font-mono mt-0.5">
              [CLICK TO SELECT]
            </div>
          </div>
        </div>
      )}

      {/* Pointer lock hint */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/60 border border-white/20 px-4 py-2 rounded backdrop-blur-sm">
          <div className="text-white/70 text-xs font-mono">
            <span className="text-white font-bold">ESC</span> to unlock cursor
          </div>
        </div>
      </div>
    </div>
  );
}
