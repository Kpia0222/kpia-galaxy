"use client";

import React, { useRef, useState, useEffect, useMemo, createContext, useContext, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Environment, Sparkles, KeyboardControls, useKeyboardControls, Grid, Billboard, Line, Torus } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration, Glitch, Scanline } from "@react-three/postprocessing";
import * as THREE from "three";
import { BlendFunction, GlitchMode } from "postprocessing";

// =====================================================================
// 1. 定数・データ定義
// =====================================================================

const QUESTIONS = [
  "もし、音響物理が最初から微分音だったら？",
  "自ら設計したエイリアンに侵食されることは、進化か？",
  "禁忌の暴走は、世界の真実が露呈した瞬間か？",
  "秩序あるノイズは、崩壊の予兆か、新しい美学か？",
  "『でかいポップ』は、平均律の呪縛を飲み込めるか？"
];

const SOCIAL_LINKS = [
  { name: "YouTube", url: "https://www.youtube.com/@popKpia", label: "Youtube" },
  { name: "X (Twitter)", url: "https://x.com/takt_min", label: "X(Twitter)" },
  { name: "SoundCloud", url: "https://soundcloud.com/user-376655816", label: "SoundCloud" },
  { name: "Instagram", url: "https://www.instagram.com/popkpia/", label: "Instagram" },
  { name: "Niconico", url: "https://www.nicovideo.jp/user/141136171", label: "NicoNico" },
  { name: "TikTok", url: "https://www.tiktok.com/@popkpia", label: "TikTok" },
  { name: "Contact", url: "mailto:Kpia0222@gmail.com", label: "Contact" },
];

const LIVE_EVENTS = [
  { id: "20250126", title: "27dot RELEASE LIVE", date: "2025.01.26", place: "函館ARARA" },
  { id: "202502xx", title: "DJ Event (Feb)", date: "2025.02.xx", place: "TBA" },
  { id: "202503xx", title: "DJ Event (Mar)", date: "2025.03.xx", place: "TBA" }
];

const PROFILE_DATA = {
  name: "Kpia",
  ver: "26.1.14 (Alien-Invasion)",
  bio: "整理、ハック、そして逸脱。\n秩序あるノイズを構築する。",
};

type EntityType = 'star' | 'planet' | 'satellite';

interface EntityData {
  id: string;
  type: EntityType;
  label: string;
  color: string;
  size: number;
  distance: number;
  speed: number;
  inclination: [number, number, number];
  phase: number;
  children?: EntityData[];
  youtubeId?: string;
  category?: string;
  clicks?: number;
  isMicrotonal?: boolean;
  erosion?: number;
  isForeign?: boolean;
}

const GALAXY_DATA: EntityData[] = Array.from({ length: 50 }, (_, i) => {
  const categories = ["Original", "Remix", "Bootleg", "Cover", "WIP", "???"];
  const category = categories[i % categories.length];
  const starId = `Kp.${String(i + 1).padStart(4, '0')}`;
  const randomInc = () => [(Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4] as [number, number, number];

  let distance = 0; let color = ""; let size = 1.0; let erosion = 0;

  switch (category) {
    case "Original": distance = 25 + Math.random() * 15; color = "#ff4400"; break;
    case "Cover": distance = 45 + Math.random() * 15; color = "#ffffff"; break;
    case "Remix": distance = 70 + Math.random() * 20; color = "#00ffff"; break;
    case "WIP": distance = 110 + Math.random() * 20; color = "#ccff00"; size = 0.4; erosion = 0.3; break;
    case "Bootleg": distance = 90 + Math.random() * 25; color = "#ff00ff"; erosion = 0.6; break;
    case "???": distance = 140 + Math.random() * 30; color = "#220033"; erosion = 1.0; break;
  }

  const children: EntityData[] = [];
  if (category === "Original" || category === "Remix" || category === "WIP") {
    const childCount = category === "WIP" ? 3 : 1;
    for (let j = 0; j < childCount; j++) {
      children.push({
        id: `${starId}-c${j}`,
        type: category === "WIP" ? 'satellite' : 'planet',
        label: category === "WIP" ? `ver.0.${j}` : `Analysis ${j + 1}`,
        color: color, size: 0.2, distance: 5 + j * 3, speed: 0.5,
        inclination: randomInc(), phase: Math.random() * 6, category: category, erosion: erosion * 0.5
      });
    }
  }

  return {
    id: starId, type: 'star', label: starId, category, color, size, distance,
    speed: 0.01 + Math.random() * 0.03, inclination: randomInc(), phase: Math.random() * 6,
    youtubeId: (category === "Original" || category === "Remix") && i % 4 === 0 ? "eh8noQsIhjg" : undefined,
    children, clicks: Math.floor(Math.random() * 500), erosion,
    isForeign: Math.random() > 0.85
  };
});

const RefContext = createContext<React.MutableRefObject<Map<string, THREE.Object3D>> | null>(null);
const HoverContext = createContext<{ hoveredId: string | null, setHoveredId: (id: string | null) => void } | null>(null);

const controlsMap = [
  { name: 'forward', keys: ['w', 'W'] }, { name: 'backward', keys: ['s', 'S'] },
  { name: 'left', keys: ['a', 'A'] }, { name: 'right', keys: ['d', 'D'] },
  { name: 'up', keys: ['Space'] }, { name: 'down', keys: ['Shift'] },
];

// =====================================================================
// 2. 3D Components
// =====================================================================

function SpeculativeVoid() {
  const points = useMemo(() => {
    return Array.from({ length: 40 }).map(() => ({
      pos: [(Math.random() - 0.5) * 500, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 500],
      text: QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]
    }));
  }, []);

  return (
    <group>
      {points.map((p, i) => (
        <Billboard key={`question-${i}`} position={p.pos as any}>
          <Suspense fallback={null}>
            <Text fontSize={1.5} color="#666" fillOpacity={0.15} maxWidth={25} textAlign="center">
              {p.text}
            </Text>
          </Suspense>
        </Billboard>
      ))}
    </group>
  );
}

function MicrotonalCrystals({ amount, color }: { amount: number, color: string }) {
  const crystals = useMemo(() => {
    return Array.from({ length: Math.floor(amount * 12) }).map(() => ({
      pos: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5].map(v => v * 1.5) as [number, number, number],
      rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
      scale: 0.15 + Math.random() * 0.3
    }));
  }, [amount]);

  return (
    <group>
      {crystals.map((c, i) => (
        <mesh key={`crystal-${i}`} position={c.pos} rotation={c.rot} scale={c.scale}>
          <coneGeometry args={[0.2, 1, 4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function LiquidMetalDNA({ onClick, erosion = 0.2 }: { onClick: () => void, erosion?: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      group.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.5;
    }
  });
  return (
    <group ref={group} onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
      {Array.from({ length: 35 }).map((_, i) => {
        const t = i / 35; const y = (t - 0.5) * 35; const angle = t * Math.PI * 8; const r = 3.5;
        const baseColor = i % 5 === 0 && erosion > 0.1 ? "#ff00ff" : "#333";
        return (
          <group key={`dna-segment-${i}`} position={[0, y, 0]}>
            <mesh position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshStandardMaterial color={baseColor} metalness={1} roughness={0.1} emissive={baseColor} emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[Math.cos(angle + Math.PI) * r, 0, Math.sin(angle + Math.PI) * r]}>
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshStandardMaterial color={baseColor} metalness={1} roughness={0.1} emissive={baseColor} emissiveIntensity={0.2} />
            </mesh>
            <mesh rotation={[0, -angle, 0]} scale={[1, 0.1, 0.1]}>
              <boxGeometry args={[r * 2, 1, 1]} />
              <meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={0.8} />
            </mesh>
          </group>
        )
      })}
    </group>
  );
}

function OrbitGroup({ data, children }: { data: EntityData, children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() * data.speed;
    groupRef.current.rotation.y = data.phase + t * 0.5;
  });

  return (
    <group rotation={[data.inclination[0], 0, data.inclination[2]]}>
      <group ref={groupRef}>
        <group position={[data.distance, 0, 0]}>{children}</group>
      </group>
      <Torus args={[data.distance, 0.01, 8, 120]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={data.color} transparent opacity={0.15} />
      </Torus>
    </group>
  );
}

function CelestialBody({ data, children, onClick }: any) {
  const ref = useRef<THREE.Group>(null);
  const refMap = useContext(RefContext);
  const hoverCtx = useContext(HoverContext);
  useEffect(() => {
    if (ref.current && refMap) refMap.current.set(data.id, ref.current);
    return () => { if (refMap) refMap.current.delete(data.id); };
  }, [data.id, refMap]);
  return (
    <group ref={ref}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick(data); }} onPointerOver={(e) => { e.stopPropagation(); hoverCtx?.setHoveredId(data.id); document.body.style.cursor = 'pointer'; }} onPointerOut={(e) => { e.stopPropagation(); hoverCtx?.setHoveredId(null); document.body.style.cursor = 'auto'; }}>
        {children}
      </mesh>
    </group>
  );
}

function StarObj({ data, focusId, onSelect }: { data: EntityData, focusId: string | null, onSelect: (e: EntityData) => void }) {
  const hoverCtx = useContext(HoverContext);
  const isHovered = hoverCtx?.hoveredId === data.id;
  const isFocused = focusId === data.id;

  const visuals = useMemo(() => {
    if (data.isForeign) return { geom: <octahedronGeometry args={[data.size, 0]} />, wireframe: false };
    switch (data.category) {
      case 'Original': return { geom: <dodecahedronGeometry args={[data.size, 0]} />, wireframe: false };
      case 'Remix': return { geom: <torusKnotGeometry args={[data.size * 0.6, 0.15, 64, 16]} />, wireframe: false };
      case 'Bootleg': return { geom: <tetrahedronGeometry args={[data.size, 0]} />, wireframe: false };
      case 'WIP': return { geom: <boxGeometry args={[data.size, data.size, data.size]} />, wireframe: true };
      case '???': return { geom: <sphereGeometry args={[data.size * 1.5, 3, 3]} />, wireframe: true };
      default: return { geom: <icosahedronGeometry args={[data.size, 1]} />, wireframe: false };
    }
  }, [data]);

  return (
    <OrbitGroup data={data}>
      <CelestialBody data={data} onClick={onSelect}>
        {visuals.geom}
        <meshStandardMaterial
          color={data.isForeign ? "#555" : data.color}
          emissive={data.color}
          emissiveIntensity={isFocused || isHovered ? 4 : 0.8}
          flatShading={true}
          wireframe={visuals.wireframe}
        />
        {data.erosion! > 0 && <MicrotonalCrystals amount={data.erosion!} color={data.color} />}
      </CelestialBody>

      <Billboard position={[0, 2.5, 0]}>
        {!isFocused && data.label && (
          <Suspense fallback={null}>
            <Text fontSize={0.7} color="white" fillOpacity={isHovered ? 1 : 0.6}>
              {String(data.label)}
            </Text>
          </Suspense>
        )}
      </Billboard>

      {data.children?.map(child => (
        <OrbitGroup key={child.id} data={child}>
          <CelestialBody data={child} onClick={onSelect}>
            <sphereGeometry args={[child.size, 12, 12]} />
            <meshStandardMaterial color={child.color} emissive={child.color} emissiveIntensity={1} />
            {child.erosion! > 0 && <MicrotonalCrystals amount={child.erosion!} color={child.color} />}
          </CelestialBody>
        </OrbitGroup>
      ))}
    </OrbitGroup>
  );
}

function AlienComet({ data, onDisturb }: { data: any, onDisturb: (active: boolean) => void }) {
  const ref = useRef<THREE.Group>(null);
  const [orbitA] = useState(160 + Math.random() * 40);
  const [orbitB] = useState(30 + Math.random() * 20);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * data.speed;
    const x = Math.cos(t) * orbitA;
    const z = Math.sin(t) * orbitB;
    ref.current.position.set(x, 0, z);
    const distToCenter = ref.current.position.length();
    onDisturb(distToCenter < 30);
    ref.current.rotation.y += 0.05;
    ref.current.rotation.z += 0.02;
  });

  return (
    <group ref={ref}>
      <mesh>
        <octahedronGeometry args={[2.5, 0]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={10} wireframe />
      </mesh>
      <pointLight color="#00ffff" intensity={8} distance={40} />
      <Billboard position={[0, 4, 0]}>
        <Suspense fallback={null}>
          <Text fontSize={0.8} color="#00ffff" fillOpacity={0.6}>[ ALIEN_TRUTH_DETECTED ]</Text>
        </Suspense>
      </Billboard>
    </group>
  );
}

function InputMeteor({ targetId, onImpact }: { targetId: string, onImpact: (id: string) => void }) {
  const ref = useRef<THREE.Group>(null);
  const refMap = useContext(RefContext);
  const [active, setActive] = useState(true);
  const [startPos] = useState(new THREE.Vector3(250, 120, 250));
  const targetPos = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!active || !ref.current || !refMap?.current.has(targetId)) return;
    const targetObj = refMap.current.get(targetId);
    targetObj!.getWorldPosition(targetPos);
    ref.current.position.lerp(targetPos, delta * 1.5);
    if (ref.current.position.distanceTo(targetPos) < 3) {
      setActive(false);
      onImpact(targetId);
    }
  });

  if (!active) return null;

  return (
    <group ref={ref} position={startPos}>
      <Sparkles count={40} scale={3} size={4} color="#ffaa00" />
      <mesh>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={8} />
      </mesh>
    </group>
  );
}

function DynamicConstellationLine({ stars, color }: { stars: string[], color: string }) {
  const refMap = useContext(RefContext);
  const lineRef = useRef<any>(null);

  useFrame(() => {
    if (!refMap || !lineRef.current || stars.length < 2) {
      if (lineRef.current) lineRef.current.geometry.setPositions(new Float32Array(6));
      return;
    }
    const positions = new Float32Array(stars.length * 3);
    const worldPos = new THREE.Vector3();
    let validCount = 0;
    stars.forEach((id, i) => {
      const obj = refMap.current.get(id);
      if (obj) {
        obj.getWorldPosition(worldPos);
        positions.set([worldPos.x, worldPos.y, worldPos.z], i * 3);
        validCount++;
      }
    });
    if (validCount >= 2) lineRef.current.geometry.setPositions(positions);
  });

  return <Line ref={lineRef} points={[[0, 0, 0], [0, 0, 0]]} color={color} lineWidth={1.5} transparent opacity={0.6} />;
}

function ExplorationCamera({ focusId, mode, isOverview }: { focusId: string | null, mode: string, isOverview: boolean }) {
  const { camera, controls } = useThree();
  const refMap = useContext(RefContext);
  const [, get] = useKeyboardControls();
  const worldPos = useRef(new THREE.Vector3());
  const targetVec = useRef(new THREE.Vector3());
  const cameraVec = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!controls) return;
    if (isOverview) {
      targetVec.current.set(0, 0, 0); cameraVec.current.set(0, 100, 150);
    } else if (mode === 'DNA') {
      targetVec.current.set(0, 0, 0); cameraVec.current.set(0, 0, 45);
    } else if (focusId && refMap?.current.has(focusId)) {
      const targetObj = refMap.current.get(focusId);
      targetObj!.getWorldPosition(worldPos.current);
      targetVec.current.copy(worldPos.current);
      cameraVec.current.copy(worldPos.current).add(new THREE.Vector3(0, 8, 12));
    } else {
      const { forward, backward, left, right, up, down } = get();
      const speed = 60 * delta;
      const front = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); front.y = 0; front.normalize();
      const side = new THREE.Vector3().crossVectors(front, new THREE.Vector3(0, 1, 0)).normalize();
      const moveVec = new THREE.Vector3();
      if (forward) moveVec.add(front); if (backward) moveVec.sub(front);
      if (left) moveVec.sub(side); if (right) moveVec.add(side);
      if (up) moveVec.y += 1; if (down) moveVec.y -= 1;
      camera.position.add(moveVec.multiplyScalar(speed));
      (controls as any).target.add(moveVec.multiplyScalar(speed));
      return;
    }
    (controls as any).target.lerp(targetVec.current, 0.1);
    state.camera.position.lerp(cameraVec.current, 0.08);
  });
  return <OrbitControls makeDefault enableDamping dampingFactor={0.05} />;
}

// =====================================================================
// 3. Main Application
// =====================================================================

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isDisturbed, setIsDisturbed] = useState(false);
  const [impactId, setImpactId] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(true);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [setlist, setSetlist] = useState<string[]>([]);
  const [currentMode, setCurrentMode] = useState<'UNIVERSE' | 'STAR' | 'PLANET' | 'SATELLITE' | 'DNA'>('DNA');
  const [prevMode, setPrevMode] = useState<'UNIVERSE' | 'STAR' | 'PLANET' | 'SATELLITE'>('UNIVERSE');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevFocusId, setPrevFocusId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOverview, setIsOverview] = useState(false);
  const refMap = useRef(new Map<string, THREE.Object3D>());

  const handleMeteorImpact = (id: string) => {
    setImpactId(id);
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
      setImpactId(null);
    }, 600);
  };

  const flattenedData = useMemo(() => {
    const list: EntityData[] = [];
    GALAXY_DATA.forEach(star => {
      list.push(star);
      star.children?.forEach(planet => { list.push(planet); planet.children?.forEach(sat => list.push(sat)); });
    });
    return list;
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery) return GALAXY_DATA;
    return flattenedData.filter(d => d.label.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, flattenedData]);

  const targetEntity = useMemo(() => flattenedData.find(d => d.id === (focusId || hoveredId)), [focusId, hoveredId]);

  const handleNavigate = (id: string) => {
    const entity = flattenedData.find(e => e.id === id);
    if (!entity) return;
    if (entity.category === '???') {
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 800);
    }
    setIsOverview(false); setFocusId(entity.id);
    if (entity.type === 'star') setCurrentMode('STAR');
    if (entity.type === 'planet') setCurrentMode('PLANET');
    if (entity.type === 'satellite') setCurrentMode('SATELLITE');
  };

  const toggleDNAMode = () => {
    setIsTransitioning(true);
    if (currentMode !== 'DNA') {
      setPrevMode(currentMode as any); setPrevFocusId(focusId);
      setCurrentMode('DNA'); setFocusId(null);
    } else {
      setCurrentMode(prevMode); setFocusId(prevFocusId);
    }
    setTimeout(() => setIsTransitioning(false), 500);
  };

  useEffect(() => {
    setIsMounted(true);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') setShowTerminal(p => !p);
      if (e.key === 'u' || e.key === 'U') toggleDNAMode();
      if (e.key === 'b' || e.key === 'B') { setIsOverview(p => !p); setFocusId(null); setCurrentMode('UNIVERSE'); }
      if (e.key === 'Escape') { setFocusId(null); setCurrentMode('UNIVERSE'); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentMode, focusId, isOverview]);

  if (!isMounted) return null;

  return (
    <KeyboardControls map={controlsMap}>
      <RefContext.Provider value={refMap}>
        <HoverContext.Provider value={{ hoveredId, setHoveredId }}>
          <main className={`h-screen w-full bg-black overflow-hidden relative font-mono text-white select-none ${(isTransitioning && targetEntity?.category === '???') ? 'taboo-active' : ''}`}>

            <div className="absolute inset-0 z-0">
              <Canvas camera={{ position: [0, 60, 100], fov: 60 }}>
                <color attach="background" args={['#000']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[0, 0, 0]} intensity={10} color="#ffaa00" distance={200} />
                <Environment preset="city" />

                <SpeculativeVoid />
                <Sparkles count={3000} scale={200} size={2} speed={0.05} opacity={0.3} />
                <Grid position={[0, -50, 0]} args={[500, 500]} cellColor="#111" sectionColor="#222" fadeDistance={300} />

                <AlienComet data={{ speed: 0.15 }} onDisturb={setIsDisturbed} />
                <InputMeteor targetId="Kp.0005" onImpact={handleMeteorImpact} />

                <LiquidMetalDNA onClick={toggleDNAMode} erosion={targetEntity?.erosion} />

                <group>
                  {GALAXY_DATA.map(star => (
                    <StarObj key={star.id} data={star} focusId={focusId} onSelect={(e) => handleNavigate(e.id)} />
                  ))}
                </group>

                <DynamicConstellationLine stars={setlist} color="#ffffff" />
                <ExplorationCamera focusId={focusId} mode={currentMode} isOverview={isOverview} />

                <EffectComposer>
                  <Bloom intensity={1.5} luminanceThreshold={0.2} />
                  <Scanline opacity={0.2} />
                  <ChromaticAberration offset={impactId ? new THREE.Vector2(0.04, 0.04) : new THREE.Vector2(0.002, 0.001)} />
                  <Noise opacity={0.1} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
                  <Glitch active={isTransitioning || isDisturbed} duration={new THREE.Vector2(0.1, 0.4)} strength={isDisturbed ? new THREE.Vector2(0.4, 0.7) : new THREE.Vector2(0.2, 0.4)} mode={GlitchMode.SPORADIC} />
                  <Vignette darkness={0.8} offset={0.2} />
                </EffectComposer>
              </Canvas>
            </div>

            {isDisturbed && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 text-center">
                <div className="text-cyan-400 font-black text-2xl tracking-[1.5em] animate-pulse opacity-40 uppercase">
                  Alien_Truth_Approaching
                </div>
                <div className="text-xs text-cyan-700 tracking-widest mt-4">SYSTEM_RESONANCE_DETECTED</div>
              </div>
            )}

            {currentMode === 'DNA' && (
              <div className="absolute inset-0 z-50 flex justify-between items-center p-12 md:p-24 animate-fade-in pointer-events-none">
                <div className="w-full md:w-1/3 h-full flex flex-col justify-center bg-black/40 backdrop-blur-xl p-12 border-l-4 border-cyan-500 pointer-events-auto">
                  <h2 className="text-6xl font-black mb-6 tracking-tighter text-white uppercase">{PROFILE_DATA.name}</h2>
                  <p className="text-sm text-gray-400 whitespace-pre-line leading-relaxed mb-12 italic">{PROFILE_DATA.bio}</p>
                  <div className="flex flex-wrap gap-4 mt-auto">
                    {SOCIAL_LINKS.map(sns => <a key={sns.name} href={sns.url} target="_blank" rel="noopener noreferrer" className="text-[10px] border border-gray-700 px-5 py-2 hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest">{sns.label}</a>)}
                  </div>
                </div>
                <div className="hidden md:flex w-1/3 h-full flex flex-col justify-center bg-black/40 backdrop-blur-xl p-12 border-r-4 border-cyan-500 text-right pointer-events-auto">
                  <h3 className="text-2xl font-black mb-10 text-cyan-400 tracking-widest">UPCOMING_FREQ</h3>
                  <div className="space-y-8 mb-16 text-xs text-gray-500">
                    {LIVE_EVENTS.map(evt => <div key={evt.id} className="border-b border-gray-800 pb-3"><div className="text-white font-bold mb-1">{evt.date}</div><div>{evt.title}</div><div>{evt.place}</div></div>)}
                  </div>
                  <button onClick={toggleDNAMode} className="mt-auto px-12 py-4 bg-red-950/30 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition tracking-[0.3em] font-black uppercase text-xs">REBOOT_SYSTEM [U]</button>
                </div>
              </div>
            )}

            {showTerminal && currentMode !== 'DNA' && (
              <>
                <div className="absolute top-10 left-8 bottom-36 w-80 bg-black/80 border border-cyan-900/40 backdrop-blur-xl flex flex-col animate-slide-right z-30 pointer-events-auto">
                  <div className="p-5 border-b border-gray-800 bg-gray-900/40 text-cyan-500 text-[10px] font-black tracking-[0.3em] uppercase">Archive_Explorer</div>
                  <div className="p-4"><input type="text" placeholder="QUERY_ENTITY..." className="w-full bg-black/50 border border-gray-800 p-3 text-[10px] text-cyan-400 outline-none focus:border-cyan-500 transition" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-[10px]">
                    <ul className="space-y-3">
                      {searchResults.map((entity) => (
                        <li key={entity.id} className="group">
                          <div className="flex items-center">
                            <span className={`w-1.5 h-1.5 rounded-full mr-3 ${entity.erosion! > 0.5 ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`}></span>
                            <button onClick={() => handleNavigate(entity.id)} className={`flex-1 text-left py-1 truncate transition ${focusId === entity.id ? 'text-cyan-400 font-black scale-105 origin-left' : 'text-gray-400 hover:text-white'}`}>{entity.label}</button>
                            {entity.type === 'star' && <button onClick={() => setSetlist(p => [...p, entity.id])} className="px-2 text-gray-600 hover:text-cyan-400 border border-gray-800 opacity-0 group-hover:opacity-100 transition">+</button>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="absolute top-10 right-8 bottom-36 w-80 bg-black/80 border border-cyan-900/40 backdrop-blur-xl flex flex-col animate-slide-left z-30 pointer-events-auto">
                  <div className="p-5 border-b border-gray-800 bg-gray-900/40 text-cyan-500 text-[10px] font-black tracking-[0.3em] uppercase">Scanner_Analysis</div>
                  {targetEntity ? (
                    <div className="p-8 space-y-8 animate-fade-in overflow-y-auto custom-scrollbar">
                      <h2 className="text-3xl font-black text-white tracking-tighter leading-none border-b border-gray-800 pb-4">{targetEntity.label}</h2>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1"><span className="text-[8px] text-gray-600 block uppercase font-black">Category</span><span className="text-[10px] text-white font-bold">{targetEntity.category || "---"}</span></div>
                        <div className="space-y-1"><span className="text-[8px] text-gray-600 block uppercase font-black">Erosion_Lv</span><span className={`text-[10px] font-black ${targetEntity.erosion! > 0.5 ? 'text-red-500' : 'text-cyan-400'}`}>{(targetEntity.erosion! * 100).toFixed(1)}%</span></div>
                        <div className="space-y-1"><span className="text-[8px] text-gray-600 block uppercase font-black">Signal_Type</span><span className="text-[10px] text-white">{targetEntity.isForeign ? "ALIEN" : "ORGANIC"}</span></div>
                        <div className="space-y-1"><span className="text-[8px] text-gray-600 block uppercase font-black">Access_Log</span><span className="text-[10px] text-white">{targetEntity.clicks}</span></div>
                      </div>
                      <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${(targetEntity.erosion || 0) * 100}%` }}></div>
                      </div>
                      {targetEntity.youtubeId && <div className="aspect-video bg-black border border-gray-800 mt-6 shadow-2xl"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${targetEntity.youtubeId}`} frameBorder="0" allowFullScreen /></div>}
                    </div>
                  ) : <div className="flex-1 flex items-center justify-center text-[10px] text-gray-700 tracking-[0.4em] text-center p-12">AWAITING_SIGNAL...<br />SELECT_NODE_IN_UNIVERSE</div>}
                </div>

                <div className="absolute bottom-8 left-0 w-full flex justify-center z-30 pointer-events-none">
                  <div className="bg-black/90 border border-cyan-900/30 px-10 py-5 flex gap-10 items-center backdrop-blur-2xl rounded-full shadow-2xl pointer-events-auto">
                    <button onClick={() => setShowTerminal(false)} className="text-[9px] font-black tracking-widest text-cyan-600 hover:text-white transition uppercase">HUD_OFF [T]</button>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <button onClick={() => { setFocusId(null); setCurrentMode('UNIVERSE'); }} className="text-[10px] font-black tracking-[0.2em] text-white hover:text-cyan-400 transition uppercase">Unfocus [ESC]</button>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <button onClick={() => setSetlist([])} className="text-[9px] font-black text-red-600 hover:text-red-400 transition uppercase">Clear_Line</button>
                  </div>
                </div>
              </>
            )}

            <div className="absolute bottom-6 right-8 z-50 text-[9px] text-gray-700 tracking-[0.5em] font-black uppercase pointer-events-none">{PROFILE_DATA.ver}</div>
          </main>
        </HoverContext.Provider>
      </RefContext.Provider>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; }
        @keyframes slide-right { from { transform: translateX(-40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slide-left { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        
        main::after {
          content: ""; position: absolute; top: -100%; left: -100%; width: 300%; height: 300%;
          background-image: url("https://grainy-gradients.vercel.app/noise.svg");
          opacity: 0.05; pointer-events: none; z-index: 100;
          animation: noise-anim 1s steps(4) infinite;
        }
        @keyframes noise-anim {
          0% { transform: translate(0,0) }
          50% { transform: translate(-5%, 5%) }
          100% { transform: translate(5%, -5%) }
        }
        .taboo-active { filter: invert(1) hue-rotate(180deg); animation: taboo-shake 0.15s infinite; }
        @keyframes taboo-shake {
          0%, 100% { transform: translate(0,0) rotate(0); }
          33% { transform: translate(3px, -3px) rotate(1deg); }
          66% { transform: translate(-3px, 3px) rotate(-1deg); }
        }
      `}</style>
    </KeyboardControls>
  );
}