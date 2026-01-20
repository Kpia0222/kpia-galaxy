"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface GalaxyNavigatorProps {
  currentPosition: [number, number, number];
}

export default function GalaxyNavigator({ currentPosition }: GalaxyNavigatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
    >
      <div className={clsx(
        "flex items-center gap-2 px-6 py-3",
        "bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950",
        "border-2 border-zinc-800",
        "rounded-full",
        "shadow-[inset_2px_2px_4px_rgba(255,255,255,0.03),inset_-2px_-2px_4px_rgba(0,0,0,0.8),0_8px_32px_rgba(0,0,0,0.95)]",
        "backdrop-blur-xl"
      )}>
        {/* Label */}
        <div className="text-[7px] text-zinc-600 font-black tracking-[0.3em] uppercase pr-4">
          COORDINATES
        </div>

        {/* Current Position Display */}
        <div className="border-l border-zinc-800 pl-4 ml-2">
          <div className="text-[6px] text-zinc-700 font-mono tabular-nums">
            <span className="text-zinc-600">POS:</span> [
            <span className="text-cyan-500">{currentPosition?.[0]?.toFixed(0) ?? '0'}</span>,
            <span className="text-cyan-500">{currentPosition?.[1]?.toFixed(0) ?? '0'}</span>,
            <span className="text-cyan-500">{currentPosition?.[2]?.toFixed(0) ?? '0'}</span>
            ]
          </div>
        </div>
      </div>
    </motion.div>
  );
}
