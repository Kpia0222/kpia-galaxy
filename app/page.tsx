"use client";

import React, { useRef, useState, useEffect, useMemo, createContext, useContext, Suspense, useImperativeHandle, forwardRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Environment, Sparkles, KeyboardControls, useKeyboardControls, Grid, Billboard, Line, Torus, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration, Scanline, Glitch } from "@react-three/postprocessing";
import * as THREE from "three";
import { BlendFunction, GlitchMode } from "postprocessing";
import RealityDistortionRig from "./components/RealityDistortionRig";
import GalaxyNavigator from "./components/GalaxyNavigator";
import DNACore from "./components/DNACore";
import GravityQuake from "./components/GravityQuake";
import DeepSpaceNebula from "./components/DeepSpaceNebula";
import PickParticleStream from "./components/PickParticleStream";
import GalaxySelectionUI from "./components/GalaxySelectionUI";
import MicrotonalCrystalsInstanced from "./components/instanced/MicrotonalCrystalsInstanced";
import StarInstancedGroup from "./components/instanced/StarInstancedGroup";
import { OPTIMIZATION_FLAGS } from "./config/optimizationFlags";
import { groupEntitiesByGeometry } from "./utils/entityGrouping";
import FPVCamera from "./components/FPVCamera";
import Crosshair from "./components/Crosshair";

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
  ver: "26.1.50 (Reality Distortion System)",
  bio: "整理、ハック、そして逸脱。\n秩序あるノイズを構築する。",
};

type EntityType = 'star' | 'planet' | 'satellite' | 'relic' | 'meteor';

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
  parent?: string;
  centDeviation?: number; // Deviation from 12-TET in cents (-50 to +50)
  youtubeId?: string;
  category?: string;
  clicks?: number;
  erosion?: number;
  isForeign?: boolean;
  bio?: string;
  lyrics?: string;
  qualia?: string;
  universeId?: number;
}

interface UniverseData {
  id: number;
  name: string;
  pos: [number, number, number];
  color: string;
  isMicrotonal: boolean;
}

interface CameraSlot {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  label: string;
}

const SAMPLE_LYRICS = `
(Verse 1)
グリッドの上を歩く幽霊たち
12の階段じゃ空へは届かない
調律された嘘を吐き出して
ノイズの海で息継ぎをする

(Chorus)
Bypass the code, rewrite the stars
平均律の檻を溶かして
Alien frequencies in my veins
これはバグじゃない、進化の産声
`;

// Multiverse Configuration
const UNIVERSES: UniverseData[] = [
  { id: 0, name: 'ORIGINAL', pos: [0, 0, 0], color: '#ff4400', isMicrotonal: false },
  { id: 1, name: 'MICROTONAL', pos: [2000, 0, 0], color: '#ff00ff', isMicrotonal: true },
  { id: 2, name: 'LABORATORY', pos: [1000, 0, 0], color: '#00ffff', isMicrotonal: false }
];

// 宇宙生成関数
const generateGalaxy = (count: number, offset: [number, number, number], universeId: number): EntityData[] => {
  return Array.from({ length: count }, (_, i) => {
    const isMicrotonal = universeId === 1;
    const categories = isMicrotonal 
      ? ["Pure_Micro", "Xenharmonic", "Just_Intonation", "Spectral", "Noise"]
      : ["Original", "Remix", "Bootleg", "Cover", "WIP", "???"];
      
    const category = categories[i % categories.length];
    const prefix = isMicrotonal ? "Mu" : "Kp";
    const starId = `${prefix}.${String(i + 1).padStart(4, '0')}`;
    const randomInc = () => [(Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4] as [number, number, number];

    let distance = 0; let color = ""; let size = 1.0; let erosion = isMicrotonal ? 0.9 : 0; let qualia = "0.00";

    if (isMicrotonal) {
        distance = 30 + Math.random() * 150;
        color = i % 2 === 0 ? "#ff00ff" : "#8800ff"; 
        erosion = 0.8 + Math.random() * 0.2; 
        qualia = "Fluid_Harmony";
    } else {
        switch (category) {
            case "Original": distance = 30 + Math.random() * 20; color = "#ff4400"; erosion = 0.05; qualia = "Artificial_Grid"; break;
            case "Cover": distance = 50 + Math.random() * 20; color = "#ffffff"; erosion = 0.1; qualia = "Mimicry"; break;
            case "Remix": distance = 80 + Math.random() * 25; color = "#00ffff"; erosion = 0.4; qualia = "Fluctuation"; break;
            case "WIP": distance = 120 + Math.random() * 30; color = "#ccff00"; size = 0.4; erosion = 0.3; qualia = "Unborn"; break;
            case "Bootleg": distance = 100 + Math.random() * 25; color = "#ff00ff"; erosion = 0.7; qualia = "Violation"; break;
            case "???": distance = 160 + Math.random() * 40; color = "#220033"; erosion = 1.0; qualia = "The_Void"; break;
        }
    }

    const children: EntityData[] = [];

    // Calculate cent deviation for this star (microtonal universe has random offsets)
    const starCentDeviation = isMicrotonal ? (Math.random() - 0.5) * 100 : 0; // -50 to +50 cents

    // Add planets to both Original and Microtonal universes
    if (isMicrotonal) {
      // Microtonal stars get 1-2 planets
      const planetCount = Math.random() > 0.5 ? 2 : 1;
      for (let p = 0; p < planetCount; p++) {
        const planetId = `${starId}-P${p + 1}`;
        const planetCentDeviation = starCentDeviation + (Math.random() - 0.5) * 30; // Inherit + variation

        const planet: EntityData = {
          id: planetId,
          type: 'planet',
          label: `Harmonic_${p + 1}`,
          color: i % 3 === 0 ? "#ff00ff" : i % 3 === 1 ? "#00ffff" : "#ffff00",
          size: 0.25 + Math.random() * 0.15,
          distance: 6 + p * 4 + Math.random() * 2,
          speed: 0.4 + Math.random() * 0.3,
          inclination: randomInc(),
          phase: Math.random() * 6,
          category: "Harmonic",
          erosion: 0.6 + Math.random() * 0.3,
          universeId,
          parent: starId,
          centDeviation: planetCentDeviation,
          children: []
        };

        // Add satellites to planets occasionally
        if (Math.random() > 0.6) {
          const satelliteId = `${planetId}-S1`;
          const satelliteCentDeviation = planetCentDeviation + (Math.random() - 0.5) * 15; // Further variation

          planet.children = [{
            id: satelliteId,
            type: 'satellite',
            label: `Overtone_${p + 1}.1`,
            color: planet.color,
            size: 0.1,
            distance: 2,
            speed: 0.8,
            inclination: randomInc(),
            phase: Math.random() * 6,
            category: "Overtone",
            erosion: 0.5,
            universeId,
            parent: planetId,
            centDeviation: satelliteCentDeviation
          }];
        }

        children.push(planet);
      }
    } else if (category === "Original" || category === "Remix") {
      // Original universe logic - add planets
      const planetId = `${starId}-P1`;
      const planet: EntityData = {
        id: planetId,
        type: 'planet',
        label: `Analysis_1`,
        color: color,
        size: 0.2,
        distance: 5,
        speed: 0.5,
        inclination: randomInc(),
        phase: Math.random() * 6,
        category,
        erosion: erosion * 0.5,
        universeId,
        parent: starId,
        centDeviation: 0, // Original universe is perfectly tuned to 12-TET
        children: []
      };

      // Add satellite to planet occasionally
      if (Math.random() > 0.7) {
        planet.children = [{
          id: `${planetId}-S1`,
          type: 'satellite',
          label: `Sub_Analysis_1.1`,
          color: color,
          size: 0.08,
          distance: 1.5,
          speed: 1.0,
          inclination: randomInc(),
          phase: Math.random() * 6,
          category: "Sub_Analysis",
          erosion: erosion * 0.3,
          universeId,
          parent: planetId,
          centDeviation: 0
        }];
      }

      children.push(planet);
    }

    return {
        id: starId, type: 'star', label: starId, category, color, size, distance,
        speed: 0.01 + Math.random() * 0.03, inclination: randomInc(), phase: Math.random() * 6,
        youtubeId: (!isMicrotonal && i % 4 === 0) ? "eh8noQsIhjg" : undefined,
        children, clicks: 0, erosion, isForeign: false,
        lyrics: (!isMicrotonal) ? SAMPLE_LYRICS : undefined,
        qualia, universeId,
        centDeviation: starCentDeviation
    };
  });
};

const INITIAL_GALAXY_DATA = generateGalaxy(40, [0, 0, 0], 0);
const MICROTONAL_GALAXY_DATA = generateGalaxy(40, [2000, 0, 0], 1); 

const OORT_METEORS: EntityData[] = Array.from({ length: 200 }, (_, i) => ({
  id: `Mt.${String(i + 1).padStart(3, '0')}`,
  type: 'meteor', label: `Ref_Signal_${i+1}`, category: 'Reference',
  color: "#aaaaaa", size: 0.3 + Math.random() * 0.4, 
  distance: 150 + Math.random() * 300,
  speed: 0.005 + Math.random() * 0.045, 
  inclination: [(Math.random() - 0.5) * Math.PI, 0, (Math.random() - 0.5) * Math.PI],
  phase: Math.random() * Math.PI * 2,
  erosion: Math.random(), 
  bio: "External Thought Pattern",
  lyrics: "Raw data fragment from external source...",
  qualia: "Unknown_Signal",
  universeId: 0
}));

const SHARD_DATA: EntityData[] = QUESTIONS.map((q, i) => ({
  id: `Shard-${i}`, type: 'relic', label: `Fragment_${i}`, category: 'Relic',
  color: "#ffffff", size: 0.8, distance: 200 + Math.random() * 50, speed: 0.05,
  inclination: [Math.random() * Math.PI, 0, Math.random() * Math.PI], phase: Math.random() * Math.PI,
  bio: q, erosion: 0.8, qualia: "Philosophical_Debris",
  universeId: 0
}));

const RefContext = createContext<React.MutableRefObject<Map<string, THREE.Object3D>> | null>(null);
const HoverContext = createContext<{ hoveredId: string | null, setHoveredId: (id: string | null) => void } | null>(null);
const TouchContext = createContext<{ joystick: THREE.Vector2 } | null>(null);
const CameraPositionContext = createContext<{ x: number, y: number, z: number }>({ x: 0, y: 0, z: 0 });

const controlsMap = [
  { name: 'forward', keys: ['w', 'W'] },
  { name: 'backward', keys: ['s', 'S'] },
  { name: 'left', keys: ['a', 'A'] },
  { name: 'right', keys: ['d', 'D'] },
  { name: 'up', keys: ['Space'] },
  { name: 'down', keys: ['Shift'] },
  { name: 'slot1', keys: ['1'] },
  { name: 'slot2', keys: ['2'] },
  { name: 'slot3', keys: ['3'] },
  { name: 'multiverse', keys: ['m', 'M'] },
  { name: 'toggleHUD', keys: ['F1'] },
];

// =====================================================================
// 2. 3D Components
// =====================================================================

function MicrotonalCrystals({ amount, color }: { amount: number, color: string }) {
  // Use instanced version if optimization flag is enabled
  if (OPTIMIZATION_FLAGS.ENABLE_INSTANCED_CRYSTALS) {
    return (
      <>
        <MicrotonalCrystalsInstanced amount={amount} color={color} baseScale={1.5} speed={2.0} />
        {amount > 0.8 && (
          <mesh>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
            <Sparkles count={20} scale={3} size={4} speed={0.4} opacity={0.5} color="#00ffff" />
            <Sparkles count={20} scale={3.5} size={4} speed={-0.4} opacity={0.5} color="#ff00ff" />
          </mesh>
        )}
      </>
    );
  }

  // Original implementation (fallback)
  const count = Math.floor(amount * 16);
  const crystals = useMemo(() => Array.from({ length: count }).map(() => ({
    pos: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5].map(v => v * 1.8) as [number, number, number],
    rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
    baseScale: 0.15 + Math.random() * 0.3,
    speed: 2 + Math.random() * 5
  })), [count]);

  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.children.forEach((child, i) => {
      const cData = crystals[i];
      if (!cData) return;
      const pulse = amount >= 0.95
        ? Math.sin(t * cData.speed * 2) * 0.5 + 1.2
        : Math.sin(t * cData.speed) * 0.2 + 1.0;
      child.scale.setScalar(cData.baseScale * pulse);
      child.rotation.x += 0.01; child.rotation.y += 0.02;
    });
  });

  return (
    <group ref={ref}>
      {crystals.map((c, i) => (
        <mesh key={`crystal-${i}`} position={c.pos} rotation={c.rot}>
          <coneGeometry args={[0.2, 1, 4]} />
          <meshStandardMaterial color={color} emissive={amount >= 0.95 ? "#ff00ff" : color} emissiveIntensity={amount >= 0.95 ? 5 : 2} transparent opacity={0.8} wireframe={amount >= 0.95} />
        </mesh>
      ))}
      {amount > 0.8 && (
        <mesh>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
          <Sparkles count={20} scale={3} size={4} speed={0.4} opacity={0.5} color="#00ffff" />
          <Sparkles count={20} scale={3.5} size={4} speed={-0.4} opacity={0.5} color="#ff00ff" />
        </mesh>
      )}
    </group>
  );
}

function GravitationalDistortion({ position }: { position: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);
  const [visible, setVisible] = useState(true);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;

    // Get world position of this effect
    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);

    // Calculate distance to camera
    const distance = camera.position.distanceTo(worldPos);

    // Only show effect when camera is within 50 units
    setVisible(distance < 50);
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[2, 6, 32]} />
        <meshBasicMaterial
          color="#000"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.SubtractiveBlending}
          premultipliedAlpha={true}
        />
      </mesh>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[2, 2.2, 32]} />
        <meshBasicMaterial color="#fff" transparent opacity={0.2} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function ImpactEffect({ position, color }: { position: THREE.Vector3, color: string }) {
  const [finished, setFinished] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || finished) return;
    const scale = groupRef.current.scale.x + 0.5;
    groupRef.current.scale.setScalar(scale);
    groupRef.current.children.forEach((child: any) => { if (child.material) child.material.opacity -= 0.02; });
    if (groupRef.current.children[0] && (groupRef.current.children[0] as any).material.opacity <= 0) { setFinished(true); }
  });

  if (finished) return null;

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[Math.PI/2, 0, 0]}><ringGeometry args={[0.5, 1, 32]} /><meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
      <mesh rotation={[Math.PI/2, 0, 0]}><ringGeometry args={[0.2, 0.8, 32]} /><meshBasicMaterial color="white" transparent opacity={0.8} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
      <pointLight color={color} intensity={20} distance={50} decay={2} />
      <Sparkles count={30} scale={4} size={10} speed={2} color={color} />
    </group>
  );
}

function QuestionShard({ data, onSelect }: { data: EntityData, onSelect: (id: string) => void }) {
  const ref = useRef<THREE.Group>(null);
  const hoverCtx = useContext(HoverContext);
  const isHovered = hoverCtx?.hoveredId === data.id;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * data.speed + data.phase;
    ref.current.position.set(Math.cos(t) * data.distance, Math.sin(t * 0.5) * 50, Math.sin(t) * data.distance);
    ref.current.rotation.x += 0.01; ref.current.rotation.y += 0.015;
  });

  return (
    <group ref={ref}>
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(data.id); }} onPointerOver={() => { hoverCtx?.setHoveredId(data.id); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { hoverCtx?.setHoveredId(null); document.body.style.cursor = 'auto'; }}>
        <tetrahedronGeometry args={[data.size, 0]} />
        <meshPhysicalMaterial color="#fff" metalness={0.2} roughness={0} transmission={0.9} thickness={2} ior={1.5} emissive={isHovered ? "#00ffff" : "#fff"} emissiveIntensity={isHovered ? 2 : 0.5} />
      </mesh>
      <Billboard position={[0, 2, 0]}>
        <Suspense fallback={null}><Text fontSize={0.5} color="#00ffff" fillOpacity={isHovered ? 1 : 0} textAlign="center">[ UNRESOLVED_LOG ]</Text></Suspense>
      </Billboard>
    </group>
  );
}

function AlienComet({ onShepherdSignal }: { onShepherdSignal: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const lastSignalTime = useRef(0);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.15;
    const x = Math.cos(t) * 80;
    const z = Math.sin(t) * 380;
    const y = Math.sin(t * 2) * 30;
    ref.current.position.set(x, y, z);
    ref.current.rotation.y += 0.1;
    if (Math.abs(z) > 350 && clock.getElapsedTime() - lastSignalTime.current > 5) {
      onShepherdSignal();
      lastSignalTime.current = clock.getElapsedTime();
    }
  });

  return (
    <group ref={ref}>
      <mesh><octahedronGeometry args={[3.0, 0]} /><meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={10} wireframe /></mesh>
      <Sparkles count={50} scale={12} size={6} speed={0.4} opacity={0.5} color="#00ffff" />
      <pointLight color="#00ffff" intensity={8} distance={60} />
      <Billboard position={[0, 5, 0]}><Suspense fallback={null}><Text fontSize={1.0} color="#00ffff" fillOpacity={0.8}>[ ALIEN_SHEPHERD ]</Text></Suspense></Billboard>
    </group>
  );
}

function FallingMeteor({ data, targetId, onImpact }: { data: EntityData, targetId: string, onImpact: (meteorId: string, targetId: string) => void }) {
  const ref = useRef<THREE.Group>(null);
  const refMap = useContext(RefContext);
  const [active, setActive] = useState(true);
  const [startPos] = useState(() => {
    const angle = Math.random() * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * 250, 150, Math.sin(angle) * 250);
  });

  useFrame((state, delta) => {
    if (!active || !ref.current || !refMap?.current.has(targetId)) return;
    const targetPos = new THREE.Vector3(); 
    refMap.current.get(targetId)!.getWorldPosition(targetPos);
    const dist = ref.current.position.distanceTo(targetPos);
    const speed = 1.0 + (250 - dist) * 0.05;
    ref.current.position.lerp(targetPos, delta * speed * 0.01);
    ref.current.rotation.x += 0.1; ref.current.rotation.y += 0.1;
    if (dist < 4) { setActive(false); onImpact(data.id, targetId); }
  });

  if (!active) return null;

  return (
    <group ref={ref} position={startPos}>
      <Sparkles count={40} scale={4} size={5} color={data.erosion! > 0.8 ? "#ff00ff" : "#ffaa00"} />
      <mesh>
        <dodecahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color={data.erosion! > 0.8 ? "#ff00ff" : "#ffaa00"} emissive={data.erosion! > 0.8 ? "#ff00ff" : "#ffaa00"} emissiveIntensity={2} />
      </mesh>
      <Billboard position={[0, 2, 0]}><Text fontSize={0.6} color="white" fillOpacity={0.7}>{data.label}</Text></Billboard>
    </group>
  );
}

function LiquidMetalDNA({ onClick, erosion = 0.2 }: { onClick: () => void, erosion?: number }) {
  const group = useRef<THREE.Group>(null);

  // Heat gradient shader material
  const heatGradientMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uErosion: { value: erosion },
        uBaseColor: { value: new THREE.Color('#ff4400') },
        uHeatColor: { value: new THREE.Color('#ff8800') }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          vPosition = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uErosion;
        uniform vec3 uBaseColor;
        uniform vec3 uHeatColor;

        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          // Linear gradient from bottom (base) to top (hot orange)
          float gradient = (vPosition.y + 17.5) / 35.0; // Normalize Y from -17.5 to 17.5 → 0 to 1
          vec3 color = mix(uBaseColor, uHeatColor, gradient);

          // Add emission intensity
          float emissive = 0.8 + sin(uTime * 2.0) * 0.2;

          gl_FragColor = vec4(color * emissive, 1.0);
        }
      `
    });
  }, []);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      group.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.5;
    }
    // Update shader time uniform
    heatGradientMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    heatGradientMaterial.uniforms.uErosion.value = erosion;
  });

  return (
    <group ref={group} onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
      {Array.from({ length: 35 }).map((_, i) => {
        const t = i / 35; const y = (t - 0.5) * 35; const angle = t * Math.PI * 8; const r = 3.5;
        const baseColor = i % 5 === 0 && erosion > 0.1 ? "#ff00ff" : "#333";
        return (
          <group key={`dna-segment-${i}`} position={[0, y, 0]}>
            <mesh position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}><sphereGeometry args={[0.5, 8, 8]} /><meshStandardMaterial color={baseColor} metalness={1} roughness={0.1} emissive={baseColor} emissiveIntensity={0.2} /></mesh>
            <mesh position={[Math.cos(angle + Math.PI) * r, 0, Math.sin(angle + Math.PI) * r]}><sphereGeometry args={[0.5, 8, 8]} /><meshStandardMaterial color={baseColor} metalness={1} roughness={0.1} emissive={baseColor} emissiveIntensity={0.2} /></mesh>
            {/* Rungs with heat gradient shader */}
            <mesh rotation={[0, -angle, 0]} scale={[1, 0.1, 0.1]}>
              <boxGeometry args={[r * 2, 1, 1]} />
              <primitive object={heatGradientMaterial} attach="material" />
            </mesh>
          </group>
        )
      })}
    </group>
  );
}

function OrbitGroup({ data, offset, children }: { data: EntityData, offset: [number, number, number], children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() * data.speed;
    groupRef.current.rotation.y = data.phase + t * 0.5;
  });
  return (
    <group position={offset}>
      <group rotation={[data.inclination[0], 0, data.inclination[2]]}>
        <group ref={groupRef}><group position={[data.distance, 0, 0]}>{children}</group></group>
        {/* Orbit visualization - increased opacity and added emissive for better visibility */}
        <Torus args={[data.distance, 0.01, 8, 120]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial
            color={data.color}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </Torus>
      </group>
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
      <mesh onClick={(e) => { e.stopPropagation(); onClick(data.id); }} onPointerOver={(e) => { e.stopPropagation(); hoverCtx?.setHoveredId(data.id); document.body.style.cursor = 'pointer'; }} onPointerOut={(e) => { e.stopPropagation(); hoverCtx?.setHoveredId(null); document.body.style.cursor = 'auto'; }}>{children}</mesh>
    </group>
  );
}

function StarObj({ data, offset, focusId, onSelect }: { data: EntityData, offset: [number, number, number], focusId: string | null, onSelect: (id: string) => void }) {
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
      // Microtonal Categories
      case 'Pure_Micro': return { geom: <icosahedronGeometry args={[data.size, 2]} />, wireframe: true };
      case 'Xenharmonic': return { geom: <torusGeometry args={[data.size * 0.8, 0.2, 16, 100]} />, wireframe: false };
      case 'Just_Intonation': return { geom: <coneGeometry args={[data.size, data.size * 2, 4]} />, wireframe: true };
      case 'Spectral': return { geom: <octahedronGeometry args={[data.size * 1.2, 0]} />, wireframe: false };
      case 'Noise': return { geom: <dodecahedronGeometry args={[data.size, 0]} />, wireframe: true };
      default: return { geom: <icosahedronGeometry args={[data.size, 1]} />, wireframe: false };
    }
  }, [data]);

  return (
    <OrbitGroup data={data} offset={offset}>
      <CelestialBody data={data} onClick={onSelect}>
        {visuals.geom}
        <meshStandardMaterial color={data.isForeign ? "#555" : data.color} emissive={data.color} emissiveIntensity={isFocused || isHovered ? 4 : 0.8} flatShading={true} wireframe={visuals.wireframe} />
        {data.erosion! > 0 && <MicrotonalCrystals amount={data.erosion!} color={data.color} />}
        {data.erosion! > 0.8 && <GravitationalDistortion position={new THREE.Vector3(0,0,0)} />}
      </CelestialBody>
      <Billboard position={[0, 2.5, 0]}>
        {!isFocused && data.label && <Suspense fallback={null}><Text fontSize={0.7} color="white" fillOpacity={isHovered ? 1 : 0.6}>{String(data.label)}</Text></Suspense>}
      </Billboard>
      {data.children?.map(planet => (
        <OrbitGroup key={planet.id} data={planet} offset={[0,0,0]}>
          <CelestialBody data={planet} onClick={onSelect}>
            <sphereGeometry args={[planet.size, 12, 12]} />
            <meshStandardMaterial color={planet.color} emissive={planet.color} emissiveIntensity={1} />
            {planet.erosion! > 0 && <MicrotonalCrystals amount={planet.erosion!} color={planet.color} />}
          </CelestialBody>
          {planet.children?.map(sat => (
            <OrbitGroup key={sat.id} data={sat} offset={[0,0,0]}>
              <CelestialBody data={sat} onClick={onSelect}>
                <sphereGeometry args={[sat.size, 8, 8]} />
                <meshStandardMaterial color={sat.color} emissive={sat.color} emissiveIntensity={2} />
              </CelestialBody>
            </OrbitGroup>
          ))}
        </OrbitGroup>
      ))}
    </OrbitGroup>
  );
}

// Instanced star renderer - groups stars by geometry type for optimal performance
function InstancedStarRenderer({
  stars,
  offset,
  focusId,
  hoveredId,
  onSelect,
  onHover
}: {
  stars: EntityData[],
  offset: [number, number, number],
  focusId: string | null,
  hoveredId: string | null,
  onSelect: (id: string) => void,
  onHover: (id: string | null) => void
}) {
  // Group stars by geometry type
  const groupedStars = useMemo(() => groupEntitiesByGeometry(stars), [stars]);

  if (OPTIMIZATION_FLAGS.DEBUG_PERFORMANCE) {
    console.log(`[InstancedStarRenderer] Grouped ${stars.length} stars into ${Object.keys(groupedStars).length} geometry types`);
  }

  return (
    <>
      {Object.entries(groupedStars).map(([geometryType, entities]) => (
        <StarInstancedGroup
          key={`${geometryType}-${offset.join('-')}`}
          entities={entities}
          geometryType={geometryType}
          offset={offset}
          focusId={focusId}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </>
  );
}

function FloatingMeteor({ data, onSelect }: { data: EntityData, onSelect: (id: string) => void }) {
  const ref = useRef<THREE.Group>(null);
  const refMap = useContext(RefContext);
  const hoverCtx = useContext(HoverContext);
  const isHovered = hoverCtx?.hoveredId === data.id;

  useEffect(() => {
    if (ref.current && refMap) refMap.current.set(data.id, ref.current);
    return () => { if (refMap) refMap.current.delete(data.id); };
  }, [data.id, refMap]);

  useFrame(({ clock }) => {
    if(!ref.current) return;
    const t = clock.getElapsedTime() * data.speed + data.phase;
    ref.current.position.set(Math.cos(t) * data.distance, Math.sin(t * 0.3) * 50, Math.sin(t) * data.distance);
    ref.current.rotation.y += 0.005;
  });

  return (
    <group ref={ref}>
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(data.id); }} onPointerOver={() => { hoverCtx?.setHoveredId(data.id); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { hoverCtx?.setHoveredId(null); document.body.style.cursor = 'auto'; }}>
        <dodecahedronGeometry args={[data.size, 0]} />
        <meshBasicMaterial color={data.erosion! > 0.8 ? "#aaaaff" : "#555"} wireframe transparent opacity={isHovered ? 1.0 : 0.5} />
      </mesh>
      {isHovered && <Billboard position={[0, 1.5, 0]}><Text fontSize={0.5} color="white">{data.id}</Text></Billboard>}
    </group>
  );
}

// カメラ制御コンポーネント
const ExplorationCamera = forwardRef(({ focusId, mode, activeCamSlot, cameraSlots, onManualMove, isSearchFocused, onCameraUpdate }: { focusId: string | null, mode: string, activeCamSlot: number | null, cameraSlots: CameraSlot[], onManualMove: () => void, isSearchFocused?: boolean, onCameraUpdate?: (pos: { x: number, y: number, z: number }) => void }, ref) => {
  const { camera, controls } = useThree();
  const refMap = useContext(RefContext);
  const touchCtx = useContext(TouchContext);
  const [, get] = useKeyboardControls();
  const worldPos = useRef(new THREE.Vector3());

  const targetVec = useRef(new THREE.Vector3(0, 0, 0));
  const cameraVec = useRef(new THREE.Vector3(0, 400, 800));

  useEffect(() => {
    if (activeCamSlot !== null && cameraSlots[activeCamSlot]) {
      const slot = cameraSlots[activeCamSlot];
      camera.position.copy(slot.pos);
      if (controls) (controls as any).target.copy(slot.target);
      targetVec.current.copy(slot.target);
      cameraVec.current.copy(slot.pos);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    getCurrentView: () => ({
      pos: camera.position.clone(),
      target: (controls as any).target.clone()
    })
  }));

  useFrame((state, delta) => {
    const orbit = controls as any;
    if (!orbit) return;

    // Disable keyboard controls when search input is focused
    const { forward, backward, left, right, up, down } = isSearchFocused ? { forward: false, backward: false, left: false, right: false, up: false, down: false } : get();
    const joyX = touchCtx?.joystick.x || 0; const joyY = touchCtx?.joystick.y || 0;
    const isMoving = forward || backward || left || right || up || down || Math.abs(joyX) > 0.1 || Math.abs(joyY) > 0.1;

    if (isMoving) {
      onManualMove();
      orbit.enabled = false;
      const speed = 200 * delta; // Speed increased for inter-universe travel
      
      const front = new THREE.Vector3();
      camera.getWorldDirection(front);
      front.y = 0; front.normalize();
      const side = new THREE.Vector3();
      side.crossVectors(front, new THREE.Vector3(0, 1, 0)).normalize();

      const move = new THREE.Vector3();
      if (forward) move.add(front); if (backward) move.sub(front);
      if (left) move.sub(side); if (right) move.add(side);
      if (up) move.y += 1; if (down) move.y -= 1;
      if (Math.abs(joyX) > 0.1 || Math.abs(joyY) > 0.1) move.add(front.clone().multiplyScalar(joyY)).add(side.clone().multiplyScalar(joyX));
      
      const displacement = move.multiplyScalar(speed);
      camera.position.add(displacement);
      orbit.target.add(displacement);
      
      targetVec.current.copy(orbit.target);
      cameraVec.current.copy(camera.position);
      return;
    } else {
      orbit.enabled = true;
      if (!focusId && activeCamSlot === null && mode !== 'DNA') {
        targetVec.current.copy(orbit.target);
        cameraVec.current.copy(camera.position);
        return; 
      }
    }

    if (mode === 'DNA') {
      targetVec.current.set(0, 0, 0); 
      cameraVec.current.set(0, 0, 45);
    } 
    else if (mode === 'LAB') {
      // Lab Universe (Center)
      targetVec.current.set(1000, 0, 0); 
      cameraVec.current.set(1000, 100, 300); 
    }
    else if (activeCamSlot !== null && cameraSlots[activeCamSlot]) {
      const slot = cameraSlots[activeCamSlot];
      targetVec.current.copy(slot.target);
      cameraVec.current.copy(slot.pos);
    }
    else if (focusId && refMap?.current.has(focusId)) {
      refMap.current.get(focusId)!.getWorldPosition(worldPos.current);
      targetVec.current.copy(worldPos.current);
      let dist = mode === 'PLANET' ? 6 : mode === 'SATELLITE' ? 4 : 12;
      cameraVec.current.copy(worldPos.current).add(new THREE.Vector3(0, dist * 0.6, dist));
    } 

    orbit.target.lerp(targetVec.current, 0.1);
    state.camera.position.lerp(cameraVec.current, 0.08);

    // Update camera position for RealityDistortionRig display
    if (onCameraUpdate) {
      onCameraUpdate({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      });
    }
  });

  return (
    <OrbitControls
      makeDefault
      enableDamping
      rotateSpeed={0.5}
      minDistance={2}
      maxDistance={2000}
    />
  );
});
ExplorationCamera.displayName = "ExplorationCamera";

// =====================================================================
// 3. Main Application
// =====================================================================

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [galaxyData, setGalaxyData] = useState<EntityData[]>(INITIAL_GALAXY_DATA);
  const [microGalaxyData, setMicroGalaxyData] = useState<EntityData[]>(MICROTONAL_GALAXY_DATA);
  const [floatingMeteors, setFloatingMeteors] = useState<EntityData[]>(OORT_METEORS);
  const [fallingMeteors, setFallingMeteors] = useState<{ meteorData: EntityData, targetId: string }[]>([]);
  const [impactEvents, setImpactEvents] = useState<{ id: string, position: THREE.Vector3, color: string }[]>([]);
  const [gravityQuakes, setGravityQuakes] = useState<{ id: string, epicenter: THREE.Vector3, maxRadius: number, strength: number }[]>([]);
  const [pickStreams, setPickStreams] = useState<{ id: string, startPos: THREE.Vector3, endPos: THREE.Vector3, color: string }[]>([]);

  const [isDisturbed, setIsDisturbed] = useState(false);
  const [impactId, setImpactId] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'explorer' | 'analysis'>('explorer');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [setlist, setSetlist] = useState<string[]>([]);
  
  const [currentMode, setCurrentMode] = useState<'UNIVERSE' | 'STAR' | 'PLANET' | 'SATELLITE' | 'DNA' | 'LAB'>('DNA');
  const [prevMode, setPrevMode] = useState<'UNIVERSE' | 'STAR' | 'PLANET' | 'SATELLITE'>('UNIVERSE');
  const [prevFocusId, setPrevFocusId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [joystickVector, setJoystickVector] = useState(new THREE.Vector2(0, 0));
  
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [sortType, setSortType] = useState<'ID' | 'EROSION' | 'SIZE'>('ID');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [labInventory, setLabInventory] = useState<EntityData[]>([]);
  const [globalErosion, setGlobalErosion] = useState<number>(0.0);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 400, z: 800 });
  const [currentGalaxy, setCurrentGalaxy] = useState<number>(0);

  const [cameraSlots, setCameraSlots] = useState<CameraSlot[]>([
    { pos: new THREE.Vector3(0, 400, 800), target: new THREE.Vector3(0, 0, 0), label: "UNIVERSE 1 (ORIGINAL)" },
    { pos: new THREE.Vector3(2000, 400, 800), target: new THREE.Vector3(2000, 0, 0), label: "UNIVERSE 2 (MICROTONAL)" },
    { pos: new THREE.Vector3(1000, 300, 300), target: new THREE.Vector3(1000, 0, 0), label: "UNIVERSE 3 (LAB)" },
    { pos: new THREE.Vector3(1000, 1500, 3000), target: new THREE.Vector3(1000, 0, 0), label: "MULTIVERSE (OVERVIEW)" }
  ]);
  const [activeCamSlot, setActiveCamSlot] = useState<number | null>(0);
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

  // noiseIntensity removed - now using globalErosion for all post-processing effects

  // F1 HUD Toggle with Persistence
  useEffect(() => {
    const handleHUDToggle = (e: KeyboardEvent) => {
      if (e.key === 'F1' && !isSearchFocused) {
        e.preventDefault();
        setShowTerminal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleHUDToggle);
    return () => window.removeEventListener('keydown', handleHUDToggle);
  }, [isSearchFocused]);

  // Multiverse mode toggle (M key)
  useEffect(() => {
    const handleMultiverseToggle = (e: KeyboardEvent) => {
      if ((e.key === 'm' || e.key === 'M') && !isSearchFocused) {
        if (activeCamSlot === 3) {
          // If already in multiverse view, return to previous slot
          setActiveCamSlot(0);
        } else {
          // Switch to multiverse view (slot 3)
          setActiveCamSlot(3);
        }
      }
    };
    window.addEventListener('keydown', handleMultiverseToggle);
    return () => window.removeEventListener('keydown', handleMultiverseToggle);
  }, [activeCamSlot, isSearchFocused]);

  // Pointer lock state monitoring
  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement !== null);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
  }, []);

  // Handle click to select targeted entity in FPV mode
  useEffect(() => {
    const handleClick = () => {
      if (isPointerLocked && targetedEntityId) {
        handleNavigate(targetedEntityId);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [isPointerLocked, targetedEntityId]);

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
          type: 'planet', label: `Ref_P_${Math.floor(Math.random()*99)}`,
          color: meteor.erosion! > 0.8 ? "#ff00ff" : "#00ffff", size: 0.3, distance: 12 + Math.random() * 5,
          speed: 0.3, inclination: [(Math.random()-0.5)*0.5, 0, (Math.random()-0.5)*0.5], phase: 0,
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
    if (now - lastTapRef.current < 300) { setFocusId(null); setCurrentMode('UNIVERSE'); setActiveCamSlot(null); }
    lastTapRef.current = now;
    longPressTimerRef.current = setTimeout(() => setShowTerminal(p => !p), 1000);
  };
  const handleTouchEnd = () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); };

  const handleJoystickMove = (e: React.TouchEvent) => { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); const t = e.touches[0]; const dx = t.clientX - (rect.left + rect.width/2); const dy = t.clientY - (rect.top + rect.height/2); const dist = Math.min(rect.width/2, Math.sqrt(dx*dx+dy*dy)); const a = Math.atan2(dy, dx); setJoystickVector(new THREE.Vector2(Math.cos(a)*dist/(rect.width/2), -Math.sin(a)*dist/(rect.width/2))); };
  
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

  const handleNavigate = (id: string) => {
    const entity = flattenedData.find(e => e.id === id);
    if (!entity) return;
    setFocusId(entity.id);
    setActiveCamSlot(null); 
    if (entity.type === 'star') setCurrentMode('STAR');
    else if (entity.type === 'planet') setCurrentMode('PLANET');
    else if (entity.type === 'satellite') setCurrentMode('SATELLITE');
    else if (entity.type === 'relic') setCurrentMode('SATELLITE');
    else if (entity.type === 'meteor') setCurrentMode('SATELLITE'); 
    if (typeof window !== "undefined" && window.innerWidth < 768) setActiveMobileTab('analysis');
  };

  const toggleDNAMode = () => {
    if (currentMode !== 'DNA') { setPrevMode(currentMode as any); setPrevFocusId(focusId); setCurrentMode('DNA'); setFocusId(null); setActiveCamSlot(null); }
    else { setCurrentMode(prevMode); setFocusId(prevFocusId); }
  };

  const toggleLABMode = () => {
    if (currentMode !== 'LAB') { 
      setPrevMode(currentMode as any); 
      setPrevFocusId(focusId); 
      setCurrentMode('LAB'); 
      setFocusId(null); 
      setActiveCamSlot(null); 
    }
    else { 
      setCurrentMode(prevMode as any); 
      setFocusId(prevFocusId); 
    }
  };

  const activateSlot = (index: number) => {
    setFocusId(null);
    if (index === 2) setCurrentMode('LAB'); // Slot 3 is LAB
    else setCurrentMode('UNIVERSE');
    setActiveCamSlot(index);
  };

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
    setCurrentMode('UNIVERSE');
    setActiveCamSlot(null);

    // Use camera handler to move camera
    if (cameraHandlerRef.current) {
      // Create smooth transition by updating camera position
      const targetPos = new THREE.Vector3(position[0], position[1] + 400, position[2] + 800);
      const targetLook = new THREE.Vector3(position[0], position[1], position[2]);
      // Camera will smoothly lerp to new position via ExplorationCamera
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const handleKey = (e: KeyboardEvent) => {
      // Disable keyboard shortcuts when search input is focused
      if (isSearchFocused) return;

      if (e.key === 't' || e.key === 'T') setShowTerminal(p => !p);
      if (e.key === 'u' || e.key === 'U') toggleDNAMode();
      if (e.key === 'l' || e.key === 'L') toggleLABMode();
      if (e.key === '1') activateSlot(0);
      if (e.key === '2') activateSlot(1);
      if (e.key === '3') activateSlot(2);
      if (e.key === 'Escape') { setFocusId(null); setCurrentMode('UNIVERSE'); setActiveCamSlot(null); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentMode, focusId, isSearchFocused]);

  if (!isMounted) return null;

  const categoryList = Array.from(new Set(INITIAL_GALAXY_DATA.map(d => d.category))).filter(Boolean) as string[];

  return (
    <KeyboardControls map={controlsMap}>
      <RefContext.Provider value={refMap}>
        <HoverContext.Provider value={{ hoveredId, setHoveredId }}>
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

                  {/* Deep Space Stars with erosion-based temperature */}
                  <Stars
                    radius={1500}
                    depth={200}
                    count={8000}
                    factor={6}
                    saturation={0.3}
                    fade
                    speed={0.3}
                  />

                  {/* Procedural Nebula */}
                  <DeepSpaceNebula count={5000} radius={2000} erosion={globalErosion} />

                  <Sparkles count={10000} scale={[800, 200, 800]} size={4} speed={0.05} opacity={0.4} />
                  
                  {/* Universe 1 Grid (Original) */}
                  <Grid position={[0, -50, 0]} args={[1000, 1000]} cellColor="#111" sectionColor="#222" fadeDistance={800} />
                  
                  {/* Universe 2 Grid (Microtonal) */}
                  <Grid position={[2000, -50, 0]} args={[1000, 1000]} cellColor="#330033" sectionColor="#660066" fadeDistance={800} />

                  {/* Universe 3 Grid (Lab) */}
                  <Grid position={[1000, -50, 0]} args={[500, 500]} cellColor="#00ffff" sectionColor="#008888" fadeDistance={300} />

                  <LiquidMetalDNA onClick={toggleDNAMode} erosion={targetEntity?.erosion} />

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
                    <group>{galaxyData.map(star => <StarObj key={star.id} data={star} offset={[0,0,0]} focusId={focusId} onSelect={handleNavigate} />)}</group>
                  )}

                  {/* Galaxy 2 (Microtonal) */}
                  <group position={[2000, 0, 0]}>
                    <DNACore position={[0, 0, 0]} erosion={globalErosion} isMultiverseView={activeCamSlot === 3} />
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
                      microGalaxyData.map(star => <StarObj key={star.id} data={star} offset={[0,0,0]} focusId={focusId} onSelect={handleNavigate} />)
                    )}
                  </group>

                  <group>{SHARD_DATA.map(shard => <QuestionShard key={shard.id} data={shard} onSelect={handleNavigate} />)}</group>
                  <group>{floatingMeteors.map(meteor => <FloatingMeteor key={meteor.id} data={meteor} onSelect={handleNavigate} />)}</group>
                  {fallingMeteors.map((item) => <FallingMeteor key={`falling-${item.meteorData.id}`} data={item.meteorData} targetId={item.targetId} onImpact={handleMeteorImpact} />)}
                  
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

                  <EffectComposer>
                    {/* Bloom: プロ仕様のため一時停止（誤魔化しを消す） */}
                    {/* <Bloom intensity={0.3} luminanceThreshold={0.2} /> */}

                    {/* Scanline: erosionに直結、シャープな質感 */}
                    <Scanline opacity={globalErosion * 0.25} density={2.0} />

                    {/* Glitch: erosion高時に有効化、強度を3倍に増強 */}
                    <Glitch
                      active={globalErosion > 0.7 || currentMode === 'DNA'}
                      duration={new THREE.Vector2(0.08, 0.15)}
                      strength={new THREE.Vector2(0.3, 0.4)}
                      mode={GlitchMode.SPORADIC}
                    />

                    {/* ChromaticAberration: erosionに強く反応（感度2倍） */}
                    <ChromaticAberration offset={new THREE.Vector2(globalErosion * 0.016, globalErosion * 0.016)} />

                    {/* Noise & Vignette: 変更なし */}
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

              {/* Galaxy Navigator - Visible in UNIVERSE mode */}
              {showTerminal && currentMode === 'UNIVERSE' && (
                <GalaxyNavigator
                  currentPosition={[cameraPosition.x, cameraPosition.y, cameraPosition.z]}
                  onWarpTo={handleWarpTo}
                  activeGalaxy={currentGalaxy}
                />
              )}

              {/* HUD: Camera Memory */}
              {showTerminal && (
                <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex items-center gap-4 px-6 py-3 bg-black/60 border border-cyan-500/30 backdrop-blur-md rounded-full shadow-[0_0_15px_rgba(0,255,255,0.1)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-black/80 ${showTerminal ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
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

              {!focusId && currentMode !== 'DNA' && showTerminal && (
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
                    <p className="text-xs text-gray-400 mb-8">SLOT {saveConfirmation + 1} の現在の画角データを上書きします。<br/>この操作は取り消せません。</p>
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
              {showTerminal && currentMode !== 'DNA' && currentMode !== 'LAB' && (
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
              {showTerminal && currentMode !== 'DNA' && currentMode !== 'LAB' && (
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
                              <button onClick={() => handleNavigate(entity.id)} className={`flex-1 text-left py-2 truncate transition-all duration-300 ${focusId === entity.id ? 'text-cyan-400 font-black scale-105 origin-left' : 'text-gray-400 hover:text-white'}`}>{entity.label} <span className="text-[8px] text-gray-600 ml-2">[{entity.type.substring(0,3).toUpperCase()}]</span></button>
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

              {!showTerminal && currentMode !== 'DNA' && currentMode !== 'LAB' && (
                <button onClick={() => setShowTerminal(true)} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-cyan-500/20 border border-cyan-500 text-cyan-400 px-8 py-3 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-md">Initialize HUD</button>
              )}

              {/* Reality Distortion Rig - Visible except in DNA/LAB mode */}
              {currentMode !== 'DNA' && currentMode !== 'LAB' && showTerminal && (
                <RealityDistortionRig
                  erosion={globalErosion}
                  setErosion={setGlobalErosion}
                  cameraPosition={cameraPosition}
                  targetEntity={targetEntity}
                  onPickEntity={() => targetEntity && pickEntity(targetEntity)}
                />
              )}

              <div className="absolute bottom-6 right-8 z-50 text-[9px] text-gray-700 tracking-[0.5em] font-black uppercase pointer-events-none opacity-50 hidden md:block">{PROFILE_DATA.ver}</div>
            </main>
          </TouchContext.Provider>
        </HoverContext.Provider>
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