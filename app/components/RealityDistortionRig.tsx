"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import RealityScope from "./RealityScope";
import LissajousScope from "./LissajousScope";

interface RealityDistortionRigProps {
  erosion: number;
  setErosion: (value: number) => void;
  cameraPosition?: { x: number, y: number, z: number };
  targetEntity?: {
    id: string;
    label: string;
    type: string;
    category?: string;
    erosion?: number;
    centDeviation?: number;
    qualia?: string;
    bio?: string;
    youtubeId?: string;
    lyrics?: string;
  } | null;
  onPickEntity?: () => void;
}

export default function RealityDistortionRig({
  erosion,
  setErosion,
  cameraPosition,
  targetEntity,
  onPickEntity
}: RealityDistortionRigProps) {
  const [isInjecting, setIsInjecting] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const previousErosionRef = useRef<number>(erosion);

  const handleNormalize = () => {
    setErosion(0);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);
  };

  const handleInjectDown = () => {
    previousErosionRef.current = erosion;
    setIsInjecting(true);
    setErosion(0.8 + Math.random() * 0.2);
  };

  const handleInjectUp = () => {
    setIsInjecting(false);
    setErosion(previousErosionRef.current);
  };

  const handleFaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErosion(parseFloat(e.target.value));
  };

  const ledColor = erosion < 0.3 ? "bg-cyan-500" : erosion < 0.7 ? "bg-purple-500" : "bg-red-500";
  const ledPulse = erosion > 0.7 ? "animate-pulse" : "";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        "fixed right-0 top-0 bottom-0 z-50",
        "w-full md:w-[420px] lg:w-[480px] xl:w-[540px]",
        "min-w-[360px] max-w-[600px]",
        "flex flex-col",
        "bg-gradient-to-br from-zinc-900 via-zinc-950 to-black",
        "border-l-4 border-zinc-800",
        "shadow-[-8px_0_64px_rgba(0,0,0,0.9)]",
        "overflow-hidden"
      )}
    >
      {/* Flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-cyan-500 pointer-events-none z-50 mix-blend-screen"
          />
        )}
      </AnimatePresence>

      {/* ========================================
          HEADER SECTION - Target Entity Info Priority
          ======================================== */}
      <div className="shrink-0 border-b-2 border-zinc-800 bg-gradient-to-b from-zinc-800/50 to-transparent">
        {/* Status Bar */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <motion.div
              animate={erosion > 0.9 ? {
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
              } : {}}
              transition={{ duration: 0.3, repeat: erosion > 0.9 ? Infinity : 0 }}
              className={clsx(
                "w-2.5 h-2.5 rounded-full",
                ledColor,
                ledPulse,
                "shadow-[0_0_12px_currentColor]",
                "border border-zinc-700"
              )}
            />
            <span className="text-[8px] text-zinc-500 font-black tracking-[0.35em] uppercase">
              REALITY_DISTORTION_RIG
            </span>
          </div>
          <div className="text-[7px] text-zinc-700 font-mono tabular-nums">
            E:{(erosion * 100).toFixed(1)}%
          </div>
        </div>

        {/* Target Entity Display */}
        <AnimatePresence mode="wait">
          {targetEntity ? (
            <motion.div
              key={targetEntity.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4"
            >
              {/* Entity Name - Military OS Typography */}
              <div className="mb-2">
                <div className="text-[6px] text-zinc-600 uppercase tracking-[0.3em] mb-1">
                  LOCKED_TARGET
                </div>
                <div className="text-lg font-black text-white tracking-tight leading-none">
                  {targetEntity.label}
                </div>
              </div>

              {/* ID, Type, and Cent Deviation Grid */}
              <div className="grid grid-cols-3 gap-2 text-[7px] font-mono">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <div className="text-zinc-600 uppercase tracking-wider mb-0.5">ID</div>
                  <div className="text-cyan-500 truncate">{targetEntity.id}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <div className="text-zinc-600 uppercase tracking-wider mb-0.5">TYPE</div>
                  <div className="text-purple-500 uppercase">{targetEntity.type}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <div className="text-zinc-600 uppercase tracking-wider mb-0.5">CENT</div>
                  <div className={clsx(
                    "font-bold tabular-nums",
                    targetEntity.centDeviation === undefined || targetEntity.centDeviation === 0
                      ? "text-cyan-500"
                      : Math.abs(targetEntity.centDeviation) < 25
                        ? "text-yellow-500"
                        : "text-red-500"
                  )}>
                    {targetEntity.centDeviation !== undefined
                      ? `${targetEntity.centDeviation >= 0 ? '+' : ''}${targetEntity.centDeviation.toFixed(1)}`
                      : '0.0'}
                  </div>
                </div>
              </div>

              {/* Qualia */}
              {targetEntity.qualia && (
                <div className="mt-2 p-2 bg-zinc-900/50 border border-zinc-800 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <div className="text-[6px] text-zinc-600 uppercase tracking-wider mb-1">QUALIA</div>
                  <div className="text-[8px] text-zinc-400 leading-relaxed">
                    {targetEntity.qualia}
                  </div>
                </div>
              )}

              {/* PICK Button */}
              {onPickEntity && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onPickEntity}
                  className={clsx(
                    "w-full mt-3 px-4 py-2 rounded",
                    "bg-gradient-to-b from-zinc-700 to-zinc-800",
                    "border-2 border-zinc-700",
                    "text-[8px] font-black tracking-[0.3em] uppercase",
                    "text-cyan-400",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_8px_rgba(0,0,0,0.8)]",
                    "hover:border-cyan-600 hover:text-cyan-300",
                    "active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]",
                    "transition-all duration-150"
                  )}
                >
                  ◆ PICK
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 text-center"
            >
              <div className="text-[7px] text-zinc-700 uppercase tracking-[0.3em]">
                NO_TARGET_LOCKED
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================
          DASHBOARD STACK - Rackmount Style Layout
          ======================================== */}
      <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto overflow-x-hidden custom-scrollbar max-h-full">

        {/* ============================================
            RACK ROW 1: Camera Position Monitor
            ============================================ */}
        <div className="bg-black/60 border-2 border-zinc-800 rounded p-3">
          <div className="text-[7px] text-zinc-600 font-black tracking-[0.3em] uppercase mb-2">
            CAMERA_COORDINATES
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
              <div className="text-[7px] text-cyan-700 uppercase tracking-wider mb-1">X_AXIS</div>
              <div className="text-[13px] font-mono font-bold text-cyan-400 tabular-nums">
                {cameraPosition ? cameraPosition.x.toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
              <div className="text-[7px] text-purple-700 uppercase tracking-wider mb-1">Y_AXIS</div>
              <div className="text-[13px] font-mono font-bold text-purple-400 tabular-nums">
                {cameraPosition ? cameraPosition.y.toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
              <div className="text-[7px] text-yellow-700 uppercase tracking-wider mb-1">Z_AXIS</div>
              <div className="text-[13px] font-mono font-bold text-yellow-400 tabular-nums">
                {cameraPosition ? cameraPosition.z.toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================
            RACK ROW 2: Erosion Fader + 4D Spectrum (Horizontal)
            ============================================ */}
        <div className="flex gap-3 h-[280px]">
          {/* Master Erosion Fader - Vertical Module */}
          <div className="w-24 shrink-0 flex flex-col bg-black/60 border-2 border-zinc-800 rounded p-2">
            <div className="text-[7px] text-zinc-600 font-black tracking-[0.3em] uppercase mb-2 text-center">
              MASTER
            </div>

            <motion.div
              animate={erosion > 0.5 ? {
                x: [0, -0.5, 0.5, -0.5, 0],
                y: [0, 0.5, -0.5, 0.5, 0]
              } : {}}
              transition={{ duration: 0.15, repeat: erosion > 0.5 ? Infinity : 0, repeatDelay: 0.4 }}
              className="relative h-48 w-full"
            >
              {/* Fader track */}
              <div className={clsx(
                "absolute inset-0 rounded-lg",
                "bg-zinc-950",
                "shadow-[inset_0_3px_10px_rgba(0,0,0,0.95),inset_0_-1px_3px_rgba(255,255,255,0.02)]",
                "border-2 border-zinc-800",
                erosion > 0.9 && "border-red-900 bg-red-950/20"
              )}>
                {/* Fill indicator */}
                <div
                  className={clsx(
                    "absolute bottom-0 left-0 right-0 rounded-b-lg transition-all duration-150",
                    erosion < 0.3 ? "bg-gradient-to-t from-cyan-900/40 via-cyan-700/20 to-cyan-500/10" :
                    erosion < 0.7 ? "bg-gradient-to-t from-purple-900/50 via-purple-700/30 to-purple-500/20" :
                    "bg-gradient-to-t from-red-900/70 via-red-700/50 to-red-500/40",
                    erosion > 0.9 && "animate-pulse"
                  )}
                  style={{ height: `${erosion * 100}%` }}
                />

                {/* Scale markings */}
                {[0.25, 0.5, 0.75, 1.0].map((mark) => (
                  <div
                    key={mark}
                    className="absolute left-0 right-0 h-[1px] bg-zinc-800"
                    style={{ bottom: `${mark * 100}%` }}
                  />
                ))}
              </div>

              {/* Slider thumb */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={erosion}
                onChange={handleFaderChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                style={{ writingMode: 'bt-lr' as React.CSSProperties['writingMode'], WebkitAppearance: 'slider-vertical' as any }}
              />

              {/* Visual thumb */}
              <div
                className={clsx(
                  "absolute left-1/2 -translate-x-1/2 w-[90%] h-8 pointer-events-none",
                  "bg-gradient-to-b from-zinc-700 via-zinc-600 to-zinc-700",
                  "border-2 border-zinc-500",
                  "rounded shadow-[0_4px_12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.5)]",
                  "transition-all duration-150"
                )}
                style={{ bottom: `calc(${erosion * 100}% - 16px)` }}
              >
                {/* Grip texture */}
                <div className="absolute inset-2 flex flex-col gap-1 justify-center">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[1px] bg-zinc-800" />
                  ))}
                </div>

                {/* Corner bolts */}
                {[[2, 2], [2, 'auto'], ['auto', 2], ['auto', 'auto']].map((pos, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-zinc-800 rounded-full border border-zinc-700"
                    style={{ top: pos[0], bottom: pos[1], left: pos[0], right: pos[1] }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Value display */}
            <div className="flex justify-between w-full text-[6px] text-zinc-700 font-mono tabular-nums mt-2">
              <span>1.0</span>
              <span>0.0</span>
            </div>
          </div>

          {/* 4D Reality Scope - Spectrum Analyzer (Flex-grow to fill remaining space) */}
          <div className="flex-1 flex flex-col bg-black/60 border-2 border-zinc-800 rounded p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[7px] text-zinc-600 font-black tracking-[0.3em] uppercase">
                REALITY_SCOPE_4D
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[6px] text-zinc-700 font-mono">FFT:64</span>
                <span className="text-[6px] text-zinc-700 font-mono">
                  T:{(erosion * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className={clsx(
              "flex-1 rounded border-4 border-zinc-800",
              "bg-black",
              "shadow-[inset_0_4px_20px_rgba(0,0,0,0.95)]",
              "overflow-hidden relative"
            )}>
              <Canvas
                camera={{ position: [0, 1.5, 2], fov: 50 }}
                gl={{ antialias: true, alpha: true }}
              >
                <color attach="background" args={['#000000']} />
                <ambientLight intensity={0.2} />
                <RealityScope erosion={erosion} />
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  minPolarAngle={Math.PI / 4}
                  maxPolarAngle={Math.PI / 2}
                  autoRotate={erosion > 0.5}
                  autoRotateSpeed={erosion * 2}
                />
              </Canvas>
            </div>
          </div>
        </div>

        {/* ============================================
            RACK ROW 3: Lissajous Scope - Full Width
            ============================================ */}
        <div className="bg-black/60 border-2 border-zinc-800 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[7px] text-zinc-600 font-black tracking-[0.3em] uppercase">
              LISSAJOUS_SCOPE
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[6px] text-zinc-700 font-mono">3:2</span>
              <div
                className={clsx(
                  "w-1.5 h-1.5 rounded-full",
                  erosion < 0.3 ? "bg-cyan-500" : erosion < 0.7 ? "bg-purple-500" : "bg-red-500"
                )}
                style={{
                  boxShadow: erosion < 0.3
                    ? "0 0 4px #00ffff"
                    : erosion < 0.7
                      ? "0 0 4px #ff00ff"
                      : "0 0 4px #ff0000"
                }}
              />
            </div>
          </div>
          <div className="flex justify-center items-center">
            <LissajousScope erosion={erosion} width={400} height={300} />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNormalize}
            className={clsx(
              "px-4 py-3 rounded",
              "bg-gradient-to-b from-zinc-700 to-zinc-800",
              "border-2 border-zinc-700",
              "text-[8px] font-black tracking-[0.3em] uppercase",
              "text-cyan-400",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_8px_rgba(0,0,0,0.8)]",
              "hover:border-cyan-600 hover:text-cyan-300",
              "active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]",
              "transition-all duration-150"
            )}
          >
            ◆ NORMALIZE
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            onMouseDown={handleInjectDown}
            onMouseUp={handleInjectUp}
            onMouseLeave={handleInjectUp}
            onTouchStart={handleInjectDown}
            onTouchEnd={handleInjectUp}
            className={clsx(
              "px-4 py-3 rounded",
              "bg-gradient-to-b from-zinc-700 to-zinc-800",
              "border-2",
              isInjecting ? "border-red-600" : "border-zinc-700",
              "text-[8px] font-black tracking-[0.3em] uppercase",
              isInjecting ? "text-red-400" : "text-red-500",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_8px_rgba(0,0,0,0.8)]",
              "hover:border-red-600 hover:text-red-400",
              "active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]",
              "transition-all duration-150"
            )}
          >
            {isInjecting ? "■ INJECTING" : "▶ INJECT"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
