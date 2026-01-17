"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface Galaxy {
  id: number;
  name: string;
  position: [number, number, number];
  color: string;
  icon: string;
}

const GALAXIES: Galaxy[] = [
  { id: 0, name: "ORIGINAL", position: [0, 0, 0], color: "#ff4400", icon: "●" },
  { id: 1, name: "MICROTONAL", position: [2000, 0, 0], color: "#ff00ff", icon: "◆" },
  { id: 2, name: "LABORATORY", position: [1000, 0, 0], color: "#00ffff", icon: "■" }
];

interface GalaxyNavigatorProps {
  currentPosition: [number, number, number];
  onWarpTo: (position: [number, number, number], galaxyId: number) => void;
  activeGalaxy: number;
}

export default function GalaxyNavigator({ currentPosition, onWarpTo, activeGalaxy }: GalaxyNavigatorProps) {
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
        <div className="text-[7px] text-zinc-600 font-black tracking-[0.3em] uppercase border-r border-zinc-800 pr-4">
          GALAXY_SELECT
        </div>

        {/* Galaxy Buttons */}
        <div className="flex items-center gap-2">
          {GALAXIES.map((galaxy) => {
            const isActive = activeGalaxy === galaxy.id;

            return (
              <motion.button
                key={galaxy.id}
                onClick={() => onWarpTo(galaxy.position, galaxy.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                  "relative group flex flex-col items-center justify-center",
                  "w-12 h-12 rounded-lg",
                  "transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-b from-zinc-700 to-zinc-800 border-2"
                    : "bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 hover:border-zinc-600",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.6)]"
                )}
                style={{
                  borderColor: isActive ? galaxy.color : undefined
                }}
              >
                {/* Icon */}
                <span
                  className={clsx(
                    "text-lg font-black transition-all",
                    isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                  )}
                  style={{ color: galaxy.color }}
                >
                  {galaxy.icon}
                </span>

                {/* Status LED */}
                {isActive && (
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: galaxy.color,
                      boxShadow: `0 0 6px ${galaxy.color}`
                    }}
                  />
                )}

                {/* Tooltip */}
                <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className={clsx(
                    "px-3 py-1.5 rounded",
                    "bg-black border border-zinc-800",
                    "text-[7px] font-black tracking-widest uppercase whitespace-nowrap",
                    "shadow-xl"
                  )}
                  style={{ color: galaxy.color }}>
                    {galaxy.name}
                    <div className="text-[6px] text-zinc-600 font-mono normal-case tracking-normal mt-0.5">
                      [{galaxy.position.join(', ')}]
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
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
