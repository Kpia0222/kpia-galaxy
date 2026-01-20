"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, Sparkles, Environment, KeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Noise, Vignette, Scanline, Glitch } from "@react-three/postprocessing";
import { BlendFunction, GlitchMode } from "postprocessing";

// =====================================================================
// インポート - カスタムコンポーネント & コンフィグ
// =====================================================================

// Config & Types
import { EntityData, CameraSlot } from "./types";
import { SOCIAL_LINKS, LIVE_EVENTS, PROFILE_DATA, controlsMap } from "./config/constants";
import { UNIVERSES, INITIAL_GALAXY_DATA, MICROTONAL_GALAXY_DATA, NASCENT_GALAXY_DATA, OORT_METEORS, SHARD_DATA } from "./config/universes";
import { OPTIMIZATION_FLAGS } from "./config/optimizationFlags";

// State & Contexts
import { useKpiaStore } from "../hooks/useKpiaStore";
import { RefContext } from "./contexts/RefContext";
import { TouchContext } from "./contexts/TouchContext";

// World Components
import DNACore from "./components/World/DNACore";
import NascentCore from "./components/World/NascentCore";
import NascentStar from "./components/World/NascentStar";
import DeepSpaceNebula from "./components/World/DeepSpaceNebula";
import StarObj from "./components/World/StarObj";
import FloatingMeteor from "./components/World/FloatingMeteor";
import FallingMeteor from "./components/World/FallingMeteor";
import AlienComet from "./components/World/AlienComet";
import LiquidMetalDNA from "./components/World/LiquidMetalDNA";
import QuestionShard from "./components/World/QuestionShard";
import InstancedStarRenderer from "./components/World/instanced/InstancedStarRenderer";

// UI Components
import RealityDistortionRig from "./components/UI/RealityDistortionRig";
import Crosshair from "./components/UI/Crosshair";
import MultiverseSelectorDock from "./components/UI/MultiverseSelectorDock";

// System Components
import FPVCamera from "./components/System/FPVCamera";
import MultiverseGateView from "./components/System/MultiverseGateView";
import WarpCameraTransition from "./components/System/WarpCameraTransition";

// Effects Components
import PickParticleStream from "./components/Effects/PickParticleStream";
import GravityQuake from "./components/Effects/GravityQuake";
import WarpEffect from "./components/Effects/WarpEffect";
import ImpactEffect from "./components/Effects/ImpactEffect";
import DynamicChromaticAberration from "./components/Effects/DynamicChromaticAberration";

// =====================================================================
// 3. Main Application
// =====================================================================

export default function Home() {
  // Store Hooks
  const {
    erosion, setErosion,
    tendency, setTendency,
    focusId, setFocusId,
    hoveredId, setHoveredId,
    cameraPosition, setCameraPosition,
    isHudVisible, setHudVisible,
    currentMode, setMode,
    activeCamSlot, setActiveCamSlot,
    isSearchFocused, setSearchFocused: setIsSearchFocused,
    toggleHud,
    previousMode, previousFocusId
  } = useKpiaStore();

  const [isMounted, setIsMounted] = useState(false);
  const [galaxyData, setGalaxyData] = useState<EntityData[]>(INITIAL_GALAXY_DATA);
  const [microGalaxyData, setMicroGalaxyData] = useState<EntityData[]>(MICROTONAL_GALAXY_DATA);
  const [nascentGalaxyData, setNascentGalaxyData] = useState<EntityData[]>(NASCENT_GALAXY_DATA);
  const [floatingMeteors, setFloatingMeteors] = useState<EntityData[]>(OORT_METEORS);
  const [fallingMeteors, setFallingMeteors] = useState<{ meteorData: EntityData, targetId: string }[]>([]);
  const [impactEvents, setImpactEvents] = useState<{ id: string, position: THREE.Vector3, color: string }[]>([]);
  const [gravityQuakes, setGravityQuakes] = useState<{ id: string, epicenter: THREE.Vector3, maxRadius: number, strength: number }[]>([]);
  const [pickStreams, setPickStreams] = useState<{ id: string, startPos: THREE.Vector3, endPos: THREE.Vector3, color: string }[]>([]);

  const [impactId, setImpactId] = useState<string | null>(null);
  const [isDisturbed, setIsDisturbed] = useState(false);

  const [activeMobileTab, setActiveMobileTab] = useState<'explorer' | 'analysis'>('explorer');

  // Multiverse Hub state
  const [isWarping, setIsWarping] = useState(false);
  const [warpProgress, setWarpProgress] = useState(0);
  const [warpTargetUniverse, setWarpTargetUniverse] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [joystickVector, setJoystickVector] = useState(new THREE.Vector2(0, 0));

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [sortType, setSortType] = useState<'ID' | 'EROSION' | 'SIZE'>('ID');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [labInventory, setLabInventory] = useState<EntityData[]>([]);
  const [currentGalaxy, setCurrentGalaxy] = useState<number>(0);


  const [cameraSlots, setCameraSlots] = useState<CameraSlot[]>([
    { pos: new THREE.Vector3(0, 400, 800), target: new THREE.Vector3(0, 0, 0), label: "UNIVERSE 1 (ORIGINAL)" },
    { pos: new THREE.Vector3(2000, 400, 800), target: new THREE.Vector3(2000, 0, 0), label: "UNIVERSE 2 (MICROTONAL)" },
    { pos: new THREE.Vector3(1000, 300, 1300), target: new THREE.Vector3(1000, 0, 1000), label: "UNIVERSE 3 (NASCENT)" },
    { pos: new THREE.Vector3(1000, 1500, 3000), target: new THREE.Vector3(1000, 0, 500), label: "MULTIVERSE (OVERVIEW)" }
  ]);
  const [saveConfirmation, setSaveConfirmation] = useState<number | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [targetedEntityId, setTargetedEntityId] = useState<string | null>(null);

  const refMap = useRef(new Map<string, THREE.Object3D>());
  const cameraHandlerRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const targetEntity = useMemo(() => {
    const list: EntityData[] = [...SHARD_DATA, ...floatingMeteors];
    galaxyData.forEach(star => {
      list.push(star);
      star.children?.forEach(planet => { list.push(planet); planet.children?.forEach(sat => list.push(sat)); });
    });
    microGalaxyData.forEach(star => {
      list.push(star);
      star.children?.forEach(planet => { list.push(planet); planet.children?.forEach(sat => list.push(sat)); });
    });
    return list.find(d => d.id === (focusId || hoveredId));
  }, [focusId, hoveredId, galaxyData, microGalaxyData, floatingMeteors]);

  // noiseIntensity removed - now using erosion for all post-processing effects

  // =====================================================================
  // F1 HUD Toggle with Persistence & Pointer Lock Sync
  // =====================================================================
  useEffect(() => {
    const handleHUDToggle = (e: KeyboardEvent) => {
      if (e.key === 'F1' && !isSearchFocused) {
        e.preventDefault();
        toggleHud();
      }
    };
    window.addEventListener('keydown', handleHUDToggle);
    return () => window.removeEventListener('keydown', handleHUDToggle);
  }, [isSearchFocused, toggleHud]);

  // Multiverse mode toggle (M key) - Enhanced with MULTIVERSE mode
  useEffect(() => {
    const handleMultiverseToggle = (e: KeyboardEvent) => {
      if ((e.key === 'm' || e.key === 'M') && !isSearchFocused) {
        if (currentMode === 'MULTIVERSE') {
          // Exit multiverse hub, return to previous mode
          setMode(previousMode);
          setFocusId(previousFocusId);
          setActiveCamSlot(currentGalaxy);
        } else {
          // Enter multiverse hub
          setMode('MULTIVERSE');
          setFocusId(null);
          setActiveCamSlot(null);
        }
      }
    };
    window.addEventListener('keydown', handleMultiverseToggle);
    return () => window.removeEventListener('keydown', handleMultiverseToggle);
  }, [currentMode, previousMode, focusId, previousFocusId, isSearchFocused, currentGalaxy, setMode, setFocusId, setActiveCamSlot]);

  // Pointer lock state monitoring
  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement !== null);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
  }, []);

  const handleShepherdSignal = () => {
    if (floatingMeteors.length === 0) return;
    const meteorIndex = Math.floor(Math.random() * floatingMeteors.length);
    const meteor = floatingMeteors[meteorIndex];
    const targetStar = galaxyData[Math.floor(Math.random() * galaxyData.length)];
    setFloatingMeteors(prev => prev.filter((_, i) => i !== meteorIndex));
    setFallingMeteors(prev => [...prev, { meteorData: meteor, targetId: targetStar.id }]);
  };

  const handleMeteorImpact = (meteorId: string, targetId: string) => {
    const meteor = OORT_METEORS.find(m => m.id === meteorId) || { erosion: 0.5, color: '#fff' };
    const targetObj = refMap.current.get(targetId);
    if (targetObj) {
      const pos = new THREE.Vector3();
      targetObj.getWorldPosition(pos);
      setImpactEvents(prev => [...prev, { id: `impact-${Date.now()}`, position: pos, color: meteor.color }]);

      // Trigger Gravity Quake
      const quakeId = `quake-${Date.now()}`;
      const quakeStrength = meteor.erosion || 0.5;
      setGravityQuakes(prev => [...prev, {
        id: quakeId,
        epicenter: pos.clone(),
        maxRadius: 100 + quakeStrength * 200,
        strength: quakeStrength
      }]);

      // Remove quake after completion
      setTimeout(() => {
        setGravityQuakes(prev => prev.filter(q => q.id !== quakeId));
      }, 3000);
    }
    setImpactId(targetId);
    setFallingMeteors(prev => prev.filter(m => m.meteorData.id !== meteorId));
    setGalaxyData(prevGalaxy => prevGalaxy.map(star => {
      if (star.id === targetId) {
        const newPlanet: EntityData = {
          id: `${star.id}-Genesis-${Date.now().toString().slice(-4)}`,
          type: 'planet', label: `Ref_P_${Math.floor(Math.random() * 99)}`,
          color: meteor.erosion! > 0.8 ? "#ff00ff" : "#00ffff", size: 0.3, distance: 12 + Math.random() * 5,
          speed: 0.3, inclination: [(Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5], phase: 0,
          category: 'Genesis', erosion: meteor.erosion, children: []
        };
        return { ...star, children: [...(star.children || []), newPlanet], erosion: Math.min((star.erosion || 0) + 0.1, 1.0) };
      }
      return star;
    }));
    setTimeout(() => { setImpactId(null); }, 600);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) { setFocusId(null); setMode('UNIVERSE'); setActiveCamSlot(null); }
    lastTapRef.current = now;
    longPressTimerRef.current = setTimeout(() => toggleHud(), 1000);
  };
  const handleTouchEnd = () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); };

  const handleJoystickMove = (e: React.TouchEvent) => { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); const t = e.touches[0]; const dx = t.clientX - (rect.left + rect.width / 2); const dy = t.clientY - (rect.top + rect.height / 2); const dist = Math.min(rect.width / 2, Math.sqrt(dx * dx + dy * dy)); const a = Math.atan2(dy, dx); setJoystickVector(new THREE.Vector2(Math.cos(a) * dist / (rect.width / 2), -Math.sin(a) * dist / (rect.width / 2))); };

  const flattenedData = useMemo(() => {
    const list: EntityData[] = [...SHARD_DATA, ...floatingMeteors];
    galaxyData.forEach(star => {
      list.push(star);
      star.children?.forEach(planet => { list.push(planet); planet.children?.forEach(sat => list.push(sat)); });
    });
    microGalaxyData.forEach(star => {
      list.push(star);
      star.children?.forEach(planet => { list.push(planet); planet.children?.forEach(sat => list.push(sat)); });
    });
    return list;
  }, [galaxyData, microGalaxyData, floatingMeteors]);

  const processedData = useMemo(() => {
    let data = !searchQuery ? flattenedData : flattenedData.filter(d => d.label.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterCategory !== 'ALL') {
      if (filterCategory === 'METEOR') data = data.filter(d => d.type === 'meteor');
      else if (filterCategory === 'STAR') data = data.filter(d => d.type === 'star');
      else data = data.filter(d => d.category === filterCategory);
    }
    return [...data].sort((a, b) => {
      let valA: any = a.id, valB: any = b.id;
      if (sortType === 'EROSION') { valA = a.erosion || 0; valB = b.erosion || 0; }
      else if (sortType === 'SIZE') { valA = a.size; valB = b.size; }
      if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
      if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });
  }, [searchQuery, flattenedData, filterCategory, sortType, sortOrder]);

  const handleNavigate = React.useCallback((id: string) => {
    const entity = flattenedData.find(e => e.id === id);
    if (!entity) return;
    setFocusId(entity.id);
    setActiveCamSlot(null);
    if (entity.type === 'star') setMode('STAR');
    else if (entity.type === 'planet') setMode('PLANET');
    else if (entity.type === 'satellite') setMode('SATELLITE');
    else if (entity.type === 'relic') setMode('SATELLITE');
    else if (entity.type === 'meteor') setMode('SATELLITE');
    if (typeof window !== "undefined" && window.innerWidth < 768) setActiveMobileTab('analysis');
  }, [flattenedData]);

  // Handle click to select targeted entity in FPV mode
  useEffect(() => {
    const handleClick = () => {
      if (isPointerLocked && targetedEntityId) {
        handleNavigate(targetedEntityId);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isPointerLocked, targetedEntityId, handleNavigate]);

  const toggleDNAMode = React.useCallback(() => {
    if (currentMode !== 'DNA') {
      setMode('DNA');
      setFocusId(null);
      setActiveCamSlot(null);
    }
    else {
      setMode(previousMode);
      setFocusId(previousFocusId);
    }
  }, [currentMode, previousMode, previousFocusId, setMode, setFocusId, setActiveCamSlot]);

  const toggleLABMode = React.useCallback(() => {
    if (currentMode !== 'LAB') {
      setMode('LAB');
      setFocusId(null);
      setActiveCamSlot(null);
    }
    else {
      setMode(previousMode);
      setFocusId(previousFocusId);
    }
  }, [currentMode, previousMode, previousFocusId, setMode, setFocusId, setActiveCamSlot]);

  const activateSlot = React.useCallback((index: number) => {
    setFocusId(null);
    if (index === 2) setMode('LAB'); // Slot 3 is LAB
    else setMode('UNIVERSE');
    setActiveCamSlot(index);
  }, [setFocusId, setMode, setActiveCamSlot]);

  // Cinematic warp to universe
  const warpToUniverse = React.useCallback((universeId: number) => {
    setIsWarping(true);
    setWarpTargetUniverse(universeId);
    setWarpProgress(0);

    // Animate warp progress
    const startTime = Date.now();
    const duration = 2000; // 2 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      setWarpProgress(progress);

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        // Warp complete
        setIsWarping(false);
        setMode('UNIVERSE');
        setCurrentGalaxy(universeId);
        setActiveCamSlot(universeId);
        setWarpTargetUniverse(null);
      }
    };

    animate();
  }, [setMode, setFocusId, setActiveCamSlot]);

  const requestSaveSlot = (index: number) => {
    setSaveConfirmation(index);
  };

  const confirmSaveSlot = () => {
    if (saveConfirmation === null || !cameraHandlerRef.current) return;
    const { pos, target } = cameraHandlerRef.current.getCurrentView();
    setCameraSlots(prev => {
      const newSlots = [...prev];
      newSlots[saveConfirmation] = { pos, target, label: `CUSTOM ${saveConfirmation + 1}` };
      return newSlots;
    });
    setSaveConfirmation(null);
    setActiveCamSlot(saveConfirmation);
  };

  const pickEntity = (entity: EntityData) => {
    if (labInventory.find(e => e.id === entity.id)) {
      console.log('Entity already in inventory:', entity.id);
      return;
    }
    console.log('Adding to inventory:', entity.id);
    setLabInventory(prev => [...prev, entity]);

    // Create particle stream from entity to RealityDistortionRig (right side of screen)
    const targetObj = refMap.current.get(entity.id);
    if (targetObj) {
      const startPos = new THREE.Vector3();
      targetObj.getWorldPosition(startPos);

      // Approximate RDR position (right side, middle height)
      const endPos = new THREE.Vector3(
        cameraHandlerRef.current?.camera?.position.x || 0 + 50,
        cameraHandlerRef.current?.camera?.position.y || 0,
        cameraHandlerRef.current?.camera?.position.z || 0 - 20
      );

      const streamId = `pick-${Date.now()}`;
      setPickStreams(prev => [...prev, {
        id: streamId,
        startPos: startPos.clone(),
        endPos: endPos,
        color: entity.color
      }]);

      // Remove stream after animation completes
      setTimeout(() => {
        setPickStreams(prev => prev.filter(s => s.id !== streamId));
      }, 2500);
    }
  };

  const handleWarpTo = (position: [number, number, number], galaxyId: number) => {
    setCurrentGalaxy(galaxyId);
    setFocusId(null);
    setMode('UNIVERSE');
    setActiveCamSlot(null);

    // Use camera handler to move camera
    if (cameraHandlerRef.current) {
      // Create smooth transition by updating camera position
      const targetPos = new THREE.Vector3(position[0], position[1] + 400, position[2] + 800);
      // Camera will smoothly lerp to new position via ExplorationCamera
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0);
    const handleKey = (e: KeyboardEvent) => {
      // Disable keyboard shortcuts when search input is focused
      if (isSearchFocused) return;

      if (e.key === 'u' || e.key === 'U') toggleDNAMode();
      if (e.key === 'l' || e.key === 'L') toggleLABMode();
      if (e.key === '1') activateSlot(0);
      if (e.key === '2') activateSlot(1);
      if (e.key === '3') activateSlot(2);
      if (e.key === 'Escape') { setFocusId(null); setMode('UNIVERSE'); setActiveCamSlot(null); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentMode, focusId, isSearchFocused, toggleDNAMode, toggleLABMode, activateSlot, setFocusId, setMode, setActiveCamSlot]);

  if (!isMounted) return null;

  const categoryList = Array.from(new Set(INITIAL_GALAXY_DATA.map(d => d.category))).filter(Boolean) as string[];

  return (
    <KeyboardControls map={controlsMap}>
      <RefContext.Provider value={refMap}>
        <TouchContext.Provider value={{ joystick: joystickVector }}>
          <main onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="h-screen w-full bg-black overflow-hidden relative font-mono text-white select-none">

            <div className="absolute inset-0 z-0">
              <Canvas camera={{ position: [0, 60, 100], fov: 60 }}>
                <color attach="background" args={['#000000']} />

                {/* Exponential Fog - Deep space atmosphere */}
                <fogExp2 attach="fog" args={['#000508', 0.00015]} />

                <ambientLight intensity={0.5} />
                <pointLight position={[0, 0, 0]} intensity={10} color="#ffaa00" distance={500} />
                <Suspense fallback={null}><Environment path="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/" files="potsdamer_platz_1k.hdr" /></Suspense>

                {/* Deep Space Stars - Only for Nascent Universe */}
                <group position={[1000, 0, 1000]}>
                  <Stars
                    radius={500}
                    depth={100}
                    count={3000}
                    factor={6}
                    saturation={0.3}
                    fade
                    speed={0.3}
                  />
                  <DeepSpaceNebula count={2000} radius={800} erosion={erosion} isActive={currentMode !== 'MULTIVERSE'} />
                  <Sparkles count={3000} scale={[300, 100, 300]} size={4} speed={0.05} opacity={0.4} />
                </group>

                <LiquidMetalDNA onClick={toggleDNAMode} erosion={targetEntity?.erosion} />

                {/* Multiverse Gate View - Show only in MULTIVERSE mode */}
                {currentMode === 'MULTIVERSE' && (
                  <MultiverseGateView
                    universes={UNIVERSES}
                    onSelectUniverse={warpToUniverse}
                    currentUniverseId={currentGalaxy}
                    isHudVisible={isHudVisible}
                  />
                )}

                {/* Galaxies - Hide in MULTIVERSE mode */}
                {currentMode !== 'MULTIVERSE' && (
                  <>
                    {/* Galaxy 1 - Original Universe */}
                    {OPTIMIZATION_FLAGS.ENABLE_INSTANCED_STARS ? (
                      <InstancedStarRenderer
                        stars={galaxyData}
                        offset={[0, 0, 0]}
                        focusId={focusId}
                        hoveredId={hoveredId}
                        onSelect={handleNavigate}
                        onHover={setHoveredId}
                      />
                    ) : (
                      <group>{galaxyData.map(star => <StarObj key={star.id} data={star} offset={[0, 0, 0]} focusId={focusId} onSelect={handleNavigate} />)}</group>
                    )}

                    {/* Galaxy 2 (Microtonal) */}
                    <group position={[2000, 0, 0]}>
                      <DNACore position={[0, 0, 0]} erosion={erosion} isMultiverseView={activeCamSlot === 3} />
                      {OPTIMIZATION_FLAGS.ENABLE_INSTANCED_STARS ? (
                        <InstancedStarRenderer
                          stars={microGalaxyData}
                          offset={[2000, 0, 0]}
                          focusId={focusId}
                          hoveredId={hoveredId}
                          onSelect={handleNavigate}
                          onHover={setHoveredId}
                        />
                      ) : (
                        microGalaxyData.map(star => <StarObj key={star.id} data={star} offset={[0, 0, 0]} focusId={focusId} onSelect={handleNavigate} />)
                      )}
                    </group>

                    {/* Galaxy 3 (Nascent) - The Unformed Universe */}
                    <group position={[1000, 0, 1000]}>
                      <NascentCore position={[0, 0, 0]} tendency={tendency} />
                      {/* HoverContext removed -> useKpiaStore */}
                      {nascentGalaxyData.map(star => (
                        <NascentStar
                          key={star.id}
                          data={star}
                          offset={[0, 0, 0]}
                          tendency={tendency}
                          focusId={focusId}
                          onSelect={handleNavigate}
                        />
                      ))}
                    </group>

                    <group>{SHARD_DATA.map(shard => <QuestionShard key={shard.id} data={shard} onSelect={handleNavigate} />)}</group>
                    <group>{floatingMeteors.map(meteor => <FloatingMeteor key={meteor.id} data={meteor} onSelect={handleNavigate} />)}</group>
                    {fallingMeteors.map((item) => <FallingMeteor key={`falling-${item.meteorData.id}`} data={item.meteorData} targetId={item.targetId} onImpact={handleMeteorImpact} />)}
                  </>
                )}

                {impactEvents.map(evt => <ImpactEffect key={evt.id} position={evt.position} color={evt.color} />)}

                {/* Gravity Quakes */}
                {gravityQuakes.map(quake => (
                  <GravityQuake
                    key={quake.id}
                    epicenter={quake.epicenter}
                    maxRadius={quake.maxRadius}
                    strength={quake.strength}
                    onComplete={() => setGravityQuakes(prev => prev.filter(q => q.id !== quake.id))}
                  />
                ))}

                {/* PICK Particle Streams */}
                {pickStreams.map(stream => (
                  <PickParticleStream
                    key={stream.id}
                    startPos={stream.startPos}
                    endPos={stream.endPos}
                    color={stream.color}
                    onComplete={() => setPickStreams(prev => prev.filter(s => s.id !== stream.id))}
                  />
                ))}

                <AlienComet onShepherdSignal={handleShepherdSignal} />

                <FPVCamera
                  ref={cameraHandlerRef}
                  focusId={focusId}
                  mode={currentMode}
                  activeCamSlot={activeCamSlot}
                  cameraSlots={cameraSlots}
                  onManualMove={() => setActiveCamSlot(null)}
                  isSearchFocused={isSearchFocused}
                  onCameraUpdate={setCameraPosition}
                  onTargetEntity={setTargetedEntityId}
                  refMap={refMap}
                />

                {/* Warp Camera Transition - FOV animation during universe warp */}
                {isWarping && warpTargetUniverse !== null && (
                  <WarpCameraTransition
                    isWarping={isWarping}
                    targetPosition={
                      warpTargetUniverse !== null
                        ? new THREE.Vector3(...UNIVERSES[warpTargetUniverse].pos)
                        : null
                    }
                    onComplete={() => {
                      // Already handled in warpToUniverse callback
                    }}
                  />
                )}

                <EffectComposer>
                  <WarpEffect isWarping={isWarping} warpProgress={warpProgress} />
                  <Scanline opacity={erosion * 0.25} density={2.0} />
                  <Glitch
                    active={erosion > 0.7 || currentMode === 'DNA'}
                    duration={new THREE.Vector2(0.08, 0.15)}
                    strength={new THREE.Vector2(0.3, 0.4)}
                    mode={GlitchMode.SPORADIC}
                  />
                  <DynamicChromaticAberration />
                  <Noise opacity={0.1} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
                  <Vignette darkness={0.8} offset={0.2} />
                </EffectComposer>
              </Canvas>
            </div>

            {/* FPV Crosshair - Only visible when pointer is locked */}
            <Crosshair
              targetEntity={targetedEntityId}
              targetLabel={targetEntity?.label}
              isLocked={isPointerLocked}
            />

            {/* Multiverse Selector Dock - Always visible except in DNA/LAB mode */}
            {currentMode !== 'DNA' && currentMode !== 'LAB' && (
              <MultiverseSelectorDock
                universes={UNIVERSES}
                currentUniverseId={currentGalaxy}
                onSelectUniverse={warpToUniverse}
              />
            )}


            {/* HUD: Camera Memory */}
            {isHudVisible && (
              <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-4 px-6 py-3 bg-black/60 border border-cyan-500/30 backdrop-blur-md rounded-full shadow-[0_0_15px_rgba(0,255,255,0.1)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-black/80 ${isHudVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
                <div className="text-[8px] text-cyan-500 font-black tracking-widest mr-2 border-r border-cyan-900 pr-4 h-full flex items-center">CAM_MEM</div>
                {cameraSlots.map((slot, i) => (
                  <div key={i} className="relative group">
                    <button
                      onClick={() => activateSlot(i)}
                      className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold transition-all border ${activeCamSlot === i ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 'bg-gray-900/50 text-gray-400 border-gray-700 hover:border-cyan-500 hover:text-white'}`}
                    >
                      {i + 1}
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto flex flex-col items-center gap-1">
                      <div className="bg-black text-[7px] text-cyan-300 px-2 py-1 rounded whitespace-nowrap border border-cyan-900">{slot.label}</div>
                      <button onClick={(e) => { e.stopPropagation(); requestSaveSlot(i); }} className="bg-gray-800 hover:bg-red-500 text-gray-400 hover:text-white text-[8px] px-2 py-1 rounded border border-gray-600 uppercase tracking-wide">SAVE</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!focusId && currentMode !== 'DNA' && isHudVisible && (
              <div className="md:hidden absolute bottom-24 left-8 z-50 w-24 h-24 bg-white/5 border border-white/10 rounded-full backdrop-blur-md flex items-center justify-center pointer-events-auto" onTouchMove={handleJoystickMove} onTouchEnd={() => setJoystickVector(new THREE.Vector2(0, 0))}>
                <div className="w-10 h-10 bg-cyan-500/30 border border-cyan-400 rounded-full shadow-lg" style={{ transform: `translate(${joystickVector.x * 30}px, ${-joystickVector.y * 30}px)` }} />
              </div>
            )}

            {/* DNA Mode & Save Modal logic omitted for brevity, same as before */}
            {currentMode === 'DNA' && (
              <div className="absolute inset-0 z-50 flex flex-col md:flex-row justify-between items-center p-6 md:p-24 animate-fade-in pointer-events-none">
                <div className="w-full md:w-1/3 h-auto md:h-full flex flex-col justify-center bg-black/40 backdrop-blur-xl p-8 md:p-12 border-l-4 border-cyan-500 pointer-events-auto shadow-2xl">
                  <h2 className="text-4xl md:text-6xl font-black mb-4 md:mb-6 tracking-tighter text-white uppercase leading-none">{PROFILE_DATA.name}</h2>
                  <p className="text-xs md:text-sm text-gray-400 whitespace-pre-line leading-relaxed mb-6 md:mb-12 italic border-l border-gray-700 pl-4">{PROFILE_DATA.bio}</p>
                  <div className="flex flex-wrap gap-2 md:gap-4 mt-auto">
                    {SOCIAL_LINKS.map(sns => <a key={sns.name} href={sns.url} target="_blank" rel="noopener noreferrer" className="text-[9px] border border-gray-700 px-3 py-1.5 md:px-5 md:py-2 hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest font-bold">{sns.label}</a>)}
                  </div>
                </div>
                <div className="hidden md:flex w-1/3 h-full flex flex-col justify-center bg-black/40 backdrop-blur-xl p-12 border-r-4 border-cyan-500 text-right pointer-events-auto shadow-2xl">
                  <h3 className="text-2xl font-black mb-10 text-cyan-400 tracking-widest uppercase">Upcoming_Freq</h3>
                  <div className="space-y-8 mb-16 text-xs text-gray-500">
                    {LIVE_EVENTS.map(evt => <div key={evt.id} className="border-b border-gray-800 pb-3"><div className="text-white font-bold mb-1 tracking-wider">{evt.date}</div><div className="text-gray-300 font-medium">{evt.title}</div><div className="text-[10px] text-gray-600">{evt.place}</div></div>)}
                  </div>
                  <button onClick={toggleDNAMode} className="mt-auto px-12 py-4 bg-red-950/30 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all tracking-[0.3em] font-black uppercase text-xs">Reboot_System [U]</button>
                </div>
                <button onClick={toggleDNAMode} className="md:hidden mt-6 w-full py-4 bg-red-950/30 border border-red-600 text-red-500 pointer-events-auto font-black text-[10px] tracking-widest uppercase">Return to System</button>
              </div>
            )}

            {saveConfirmation !== null && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
                <div className="bg-gray-900 border border-cyan-500 p-8 text-center shadow-2xl max-w-sm">
                  <div className="text-cyan-400 font-black text-lg mb-4 tracking-widest">OVERWRITE_SLOT_DATA?</div>
                  <p className="text-xs text-gray-400 mb-8">SLOT {saveConfirmation + 1} の現在の画角データを上書きします。<br />この操作は取り消せません。</p>
                  <div className="flex gap-4 justify-center">
                    <button onClick={confirmSaveSlot} className="bg-cyan-500 text-black font-bold px-6 py-2 hover:bg-cyan-400 transition-all uppercase text-xs tracking-widest">Confirm</button>
                    <button onClick={() => setSaveConfirmation(null)} className="border border-gray-600 text-gray-400 font-bold px-6 py-2 hover:text-white transition-all uppercase text-xs tracking-widest">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* LAB UI - Only visible in LAB mode */}
            {currentMode === 'LAB' && (
              <div className="absolute inset-0 z-50 pointer-events-none">
                {/* Top Bar */}
                <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                  <div className="text-cyan-400 font-black tracking-[0.3em] text-xs border-l-4 border-cyan-500 pl-4 pointer-events-auto">
                    LABORATORY_MODE <span className="text-gray-500 text-[8px] ml-2">/// EXPERIMENTAL</span>
                  </div>
                  <button onClick={toggleLABMode} className="pointer-events-auto bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white px-6 py-2 text-[10px] font-bold border border-red-800 transition-all uppercase tracking-widest">
                    EXIT LAB [L]
                  </button>
                </div>

                {/* Bottom Inventory */}
                <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-auto">
                  <div className="text-[9px] text-gray-500 font-black tracking-widest mb-3 uppercase">Sample_Inventory ({labInventory.length})</div>
                  <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {labInventory.length === 0 ? (
                      <div className="text-gray-600 text-[10px] italic py-4">No samples collected. Go back to Universe and PICK stars.</div>
                    ) : (
                      labInventory.map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-24 h-24 bg-gray-900/50 border border-gray-700 hover:border-cyan-500 p-2 group transition-all cursor-grab">
                          <div className="w-full h-12 bg-black mb-2 flex items-center justify-center">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                          </div>
                          <div className="text-[8px] text-gray-300 truncate font-bold">{item.label}</div>
                          <div className="text-[7px] text-gray-500 truncate">{item.qualia}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Tab Switcher */}
            {isHudVisible && currentMode !== 'DNA' && currentMode !== 'LAB' && (
              <div className="md:hidden absolute top-16 left-0 w-full z-40 flex gap-2 px-4 py-2 bg-black/80 border-b border-gray-800 pointer-events-auto">
                <button
                  onClick={() => setActiveMobileTab('explorer')}
                  className={`flex-1 py-2 text-[9px] font-black tracking-widest uppercase transition-all ${activeMobileTab === 'explorer' ? 'bg-cyan-500 text-black' : 'bg-gray-900 text-gray-500 border border-gray-700'}`}
                >
                  EXPLORER
                </button>
                <button
                  onClick={() => setActiveMobileTab('analysis')}
                  className={`flex-1 py-2 text-[9px] font-black tracking-widest uppercase transition-all ${activeMobileTab === 'analysis' ? 'bg-cyan-500 text-black' : 'bg-gray-900 text-gray-500 border border-gray-700'}`}
                >
                  ANALYSIS
                </button>
              </div>
            )}

            {/* Terminal UI - Visible unless in DNA/LAB mode and hidden by toggle */}
            {isHudVisible && currentMode !== 'DNA' && currentMode !== 'LAB' && (
              <>
                <div className={`absolute z-30 pointer-events-auto flex flex-col transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:top-10 md:left-8 md:bottom-36 md:w-80 md:bg-black/80 md:border md:border-cyan-900/40 md:backdrop-blur-xl top-28 left-0 w-full bottom-32 bg-black/60 backdrop-blur-lg ${(activeMobileTab !== 'explorer' && typeof window !== "undefined" && window.innerWidth < 768) ? 'opacity-0 pointer-events-none translate-x-[-10px]' : 'opacity-100'}`}>
                  <div className="p-5 border-b border-gray-800 bg-gray-900/40 text-cyan-500 text-[10px] font-black tracking-[0.3em] uppercase hidden md:block">Archive_Explorer</div>

                  {/* ... (Filter & Sort UI) ... */}
                  <div className="p-4 border-b border-gray-800 bg-black/40 flex gap-3">
                    <div className="relative flex-1">
                      <button onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }} className="w-full flex justify-between items-center bg-gray-900/50 border-2 border-gray-700 px-6 py-5 text-[13px] text-cyan-400 font-bold hover:border-cyan-500 transition-colors uppercase tracking-wider">
                        <span>FLTR: {filterCategory}</span>
                        <span className="text-[11px]">▼</span>
                      </button>
                      {isFilterOpen && (
                        <div className="absolute top-full left-0 w-full min-w-[220px] mt-1 bg-black border-2 border-gray-700 shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                          {['ALL', 'STAR', 'METEOR', ...categoryList].map(cat => (
                            <button key={cat} onClick={() => { setFilterCategory(cat); setIsFilterOpen(false); }} className={`block w-full text-left px-6 py-4 text-[12px] font-medium border-b border-gray-800 hover:bg-cyan-900/20 hover:text-white transition-colors whitespace-nowrap ${filterCategory === cat ? 'text-cyan-400 bg-cyan-900/10 font-bold' : 'text-gray-400'}`}>{cat}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative flex-1">
                      <div className="flex gap-2 h-full">
                        <button onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }} className="flex-1 flex justify-between items-center bg-gray-900/50 border-2 border-gray-700 px-6 py-5 text-[13px] text-purple-400 font-bold hover:border-purple-500 transition-colors uppercase tracking-wider">
                          <span>SORT: {sortType}</span>
                          <span className="text-[11px]">▼</span>
                        </button>
                        <button onClick={() => setSortOrder(p => p === 'ASC' ? 'DESC' : 'ASC')} className="w-16 flex items-center justify-center bg-gray-900/50 border-2 border-gray-700 text-[14px] text-yellow-500 font-bold hover:border-yellow-500 transition-colors">{sortOrder === 'ASC' ? '↑' : '↓'}</button>
                      </div>
                      {isSortOpen && (
                        <div className="absolute top-full left-0 w-[calc(100%-4.5rem)] min-w-[180px] mt-1 bg-black border-2 border-gray-700 shadow-xl z-50">
                          {['ID', 'EROSION', 'SIZE'].map(sort => (
                            <button key={sort} onClick={() => { setSortType(sort as any); setIsSortOpen(false); }} className={`block w-full text-left px-6 py-4 text-[12px] font-medium border-b border-gray-800 hover:bg-purple-900/20 hover:text-white transition-colors whitespace-nowrap ${sortType === sort ? 'text-purple-400 bg-purple-900/10 font-bold' : 'text-gray-400'}`}>{sort}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-b border-gray-900/20"><input type="text" placeholder="QUERY_ENTITY..." className="w-full bg-black/50 border border-gray-800 p-3 text-[10px] text-cyan-400 outline-none focus:border-cyan-500 transition-all font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)} /></div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-[10px]">
                    <ul className="space-y-3">
                      {processedData.map((entity) => (
                        <li key={entity.id} className="group border-b border-gray-900/50 pb-3 last:border-0">
                          <div className="flex items-center p-1">
                            <span className={`w-2 h-2 rounded-full mr-3 ${entity.erosion! > 0.5 ? 'animate-pulse' : 'shadow-cyan'}`} style={{ backgroundColor: entity.color || '#fff' }}></span>
                            <button onClick={() => handleNavigate(entity.id)} className={`flex-1 text-left py-2 truncate transition-all duration-300 ${focusId === entity.id ? 'text-cyan-400 font-black scale-105 origin-left' : 'text-gray-400 hover:text-white'}`}>{entity.label} <span className="text-[8px] text-gray-600 ml-2">[{entity.type.substring(0, 3).toUpperCase()}]</span></button>
                            {/* PICK Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                pickEntity(entity);
                              }}
                              onPointerDown={(e) => e.stopPropagation()}
                              className="ml-2 px-2 py-1 bg-gray-800 text-[7px] text-cyan-500 hover:bg-cyan-500 hover:text-black border border-cyan-900 rounded uppercase tracking-widest transition-all"
                            >
                              PICK
                            </button>
                          </div>
                          {/* Children rendering */}
                          {!searchQuery && filterCategory !== 'METEOR' && entity.children?.map(child => (
                            <div key={child.id} className="pl-6 border-l border-gray-800/50 ml-2 mt-2 space-y-2">
                              <button onClick={() => handleNavigate(child.id)} className={`block w-full text-left py-1 text-[10px] truncate transition-all ${focusId === child.id ? 'text-yellow-400 font-bold' : 'text-gray-500'} ${child.category === 'Genesis' ? 'text-purple-400' : ''}`}>↳ {child.label}</button>
                              {child.children?.map(sat => (
                                <button key={sat.id} onClick={() => handleNavigate(sat.id)} className={`block w-full text-left py-1 pl-4 text-[9px] truncate transition-all ${focusId === sat.id ? 'text-pink-400 font-bold' : 'text-gray-600'}`}>↳↳ {sat.label}</button>
                              ))}
                            </div>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Scanner_Analysis panel removed - functionality moved to Reality Distortion Rig */}
              </>
            )}

            {!isHudVisible && currentMode !== 'DNA' && currentMode !== 'LAB' && (
              <button onClick={() => setHudVisible(true)} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-cyan-500/20 border border-cyan-500 text-cyan-400 px-8 py-3 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-md">Initialize HUD</button>
            )}

            {/* Reality Distortion Rig - Visible except in DNA/LAB mode */}
            {currentMode !== 'DNA' && currentMode !== 'LAB' && isHudVisible && (
              <RealityDistortionRig
                erosion={erosion}
                setErosion={setErosion}
                tendency={tendency}
                setTendency={setTendency}
                cameraPosition={cameraPosition}
                targetEntity={targetEntity}
                onPickEntity={() => targetEntity && pickEntity(targetEntity)}
              />
            )}

            <div className="absolute bottom-6 right-8 z-50 text-[9px] text-gray-700 tracking-[0.5em] font-black uppercase pointer-events-none opacity-50 hidden md:block">{PROFILE_DATA.ver}</div>
          </main>
        </TouchContext.Provider>
      </RefContext.Provider>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        @keyframes slide-right { from { transform: translateX(-40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slide-left { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .shadow-glow { text-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.2); }
        .shadow-cyan { box-shadow: 0 0 10px rgba(0, 255, 255, 0.3); }
        .taboo-active { filter: invert(1) hue-rotate(180deg); animation: taboo-shake 0.15s infinite; }
        @keyframes taboo-shake { 0%, 100% { transform: translate(0,0) rotate(0); } 33% { transform: translate(3px, -3px) rotate(1deg); } 66% { transform: translate(-3px, 3px) rotate(1deg); } }
      `}</style>
    </KeyboardControls>
  );
}