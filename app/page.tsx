// app/page.tsx
"use client";

import React, { useRef, useState, useEffect, useMemo, createContext, useContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Environment, Sparkles, KeyboardControls, useKeyboardControls, Grid, Billboard, Line, Float, Html, Torus } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration, Glitch, Scanline } from "@react-three/postprocessing";
import * as THREE from "three";
import { BlendFunction, GlitchMode } from "postprocessing";

// =====================================================================
// 1. データ定義
// =====================================================================

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
  ver: "25.5.9 (Ref-Integrity)",
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
}

const GALAXY_DATA: EntityData[] = Array.from({ length: 50 }, (_, i) => {
  // 1. カテゴリーの決定 (均等に割り振るためのロジック)
  const categories = ["Original", "Remix", "Bootleg", "Cover", "WIP", "???"];
  const category = categories[i % categories.length];

  const starId = `Kp.${String(i + 1).padStart(4, '0')}`;
  const starIndex = i + 1;
  const randomInc = () => [(Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4] as [number, number, number];

  // 2. 思想に基づく「距離」「色」「サイズ」の設定
  let distance = 0;
  let color = "";
  let size = 1.0;

  switch (category) {
    case "Original":
      distance = 20 + Math.random() * 15; // 中心に近い
      color = "#ff4400"; // 情熱的な赤・オレンジ
      break;
    case "Cover":
      distance = 40 + Math.random() * 15; // 中心に近い（整理されたエリア）
      color = "#ffffff"; // 他者を反射する白
      break;
    case "Remix":
      distance = 60 + Math.random() * 20; // 中間層
      color = "#00ffff"; // デジタルなシアン
      break;
    case "WIP":
      distance = 100 + Math.random() * 20; // 中間層（成長中）
      color = "#ccff00"; // 輝くライムイエロー
      size = 0.3; // 【重要】WIPは小さく設定
      break;
    case "Bootleg":
      distance = 80 + Math.random() * 25; // 遠い（逸脱エリア）
      color = "#ff00ff"; // 禁忌のマゼンタ
      break;
    case "???":
      distance = 120 + Math.random() * 30; // 最も遠い（理の外）
      color = "#111111"; // 深い紫
      break;
  }

  // 3. YouTube ID (OriginalやCoverなど実体があるものに優先的に割り振る)
  let youtubeId = (category === "Original" || category === "Remix" || category === "Cover") && i % 2 === 0
    ? "dQw4w9WgXcQ"
    : undefined;
  if (starIndex === 1) youtubeId = "eh8noQsIhjg";

  // 4. 子要素（惑星/衛星）の生成ロジック (Remixの場合は特に豪華にするなど)
  const planets: EntityData[] = [];
  if (category === "Original" || category === "Remix") {
    const planetCount = Math.floor(Math.random() * 2) + 1;
    for (let j = 0; j < planetCount; j++) {
      const planetId = `${starId}-Sub${j + 1}`;
      planets.push({
        id: planetId, type: 'planet', label: `Analysis ${j + 1}`, color: color, size: 0.35, distance: 6 + j * 2.5, speed: 0.3, inclination: randomInc(), phase: Math.random() * 6, category: category
      });
    }
  }

  return {
    id: starId,
    type: 'star',
    label: starId,
    category: category, // カテゴリーを保存
    color: color,
    size: size,
    distance: distance,
    speed: 0.01 + Math.random() * 0.03,
    inclination: randomInc(),
    phase: Math.random() * 6,
    youtubeId: youtubeId,
    children: planets,
    clicks: Math.floor(Math.random() * 500)
  };
});

const MICROTONAL_STAR: EntityData = {
  id: "Kp.MICRO", type: "star", label: "Microtonal Node", color: "#ffffff", size: 1.2, distance: 40, speed: 0.1, inclination: [Math.PI / 6, 0, Math.PI / 6], phase: 0, isMicrotonal: true, category: "Research", children: []
};
GALAXY_DATA.push(MICROTONAL_STAR);

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

function LiquidMetalDNA({ onClick }: { onClick: () => void }) {
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
        return (
          <group key={i} position={[0, y, 0]}>
            <mesh position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}><sphereGeometry args={[0.5, 8, 8]} /><meshStandardMaterial color="#222" metalness={1} roughness={0.1} /></mesh>
            <mesh position={[Math.cos(angle + Math.PI) * r, 0, Math.sin(angle + Math.PI) * r]}><sphereGeometry args={[0.5, 8, 8]} /><meshStandardMaterial color="#222" metalness={1} roughness={0.1} /></mesh>
            <mesh rotation={[0, -angle, 0]} scale={[1, 0.1, 0.1]}><boxGeometry args={[r * 2, 1, 1]} /><meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={0.5} /></mesh>
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
    if (data.isMicrotonal) {
      const angle = data.phase + t;
      groupRef.current.position.set(Math.cos(angle) * data.distance, Math.sin(t * 10) * 0.5, Math.sin(angle) * data.distance);
    } else {
      groupRef.current.rotation.y = data.phase + t * 0.5;
    }
  });

  return (
    <group rotation={[data.inclination[0], 0, data.inclination[2]]}>
      <group ref={groupRef}>
        <group position={data.isMicrotonal ? [0, 0, 0] : [data.distance, 0, 0]}>{children}</group>
      </group>
      <Torus args={[data.distance, 0.008, 8, 120]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={data.color} transparent opacity={0.12} />
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

  // 形状と光の分岐ロジック
  const getVisualsByCategory = (category: string, isFocused: boolean) => {
    switch (category) {
      case 'Original':
        return {
          geom: <dodecahedronGeometry args={[1, 0]} />,
          emissiveIntensity: isFocused ? 2.5 : 0.8
        };
      case 'Remix':
        return {
          geom: <torusKnotGeometry args={[0.5, 0.15, 64, 16]} />,
          emissiveIntensity: isFocused ? 2.0 : 0.6
        };
      case 'Bootleg':
        return {
          geom: <tetrahedronGeometry args={[1, 0]} />,
          emissiveIntensity: 3.0 // 常に少し強く発光
        };
      case 'Cover':
        return {
          geom: <icosahedronGeometry args={[1, 1]} />,
          emissiveIntensity: 0.5
        };
      case 'WIP':
        return {
          geom: <boxGeometry args={[0.4, 0.4, 0.4]} />, // 小さな立方体（骨組み）
          emissiveIntensity: 10.0 // 圧倒的な輝度
        };
      case '???':
        return {
          geom: <sphereGeometry args={[data.size * 1.5, 2, 2]} />,
          wireframe: true,
          flatShading: true,
          color: "#000000", // 真っ黒
        };
      default:
        return { geom: <sphereGeometry args={[1, 16, 16]} />, emissiveIntensity: 0.5 };
    }
  };
  return (
    <OrbitGroup data={data}>
      <CelestialBody data={data} onClick={onSelect}>
        <icosahedronGeometry args={[data.size, 1]} />
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={isFocused || isHovered ? 2 : 0.5}
          flatShading={true}
          wireframe={!data.youtubeId}
        />
      </CelestialBody>
      <Billboard position={[0, 2, 0]}>
        {!isFocused && <Text fontSize={0.8} color="white" anchorY="bottom">{data.label}</Text>}
      </Billboard>
      {data.children?.map(planet => (
        <OrbitGroup key={planet.id} data={planet}>
          <CelestialBody data={planet} onClick={onSelect}>
            <sphereGeometry args={[planet.size, 16, 16]} />
            <meshStandardMaterial color={planet.color} metalness={0.5} roughness={0.5} />
          </CelestialBody>
          {planet.children?.map(sat => (
            <OrbitGroup key={sat.id} data={sat}>
              <CelestialBody data={sat} onClick={onSelect}>
                <icosahedronGeometry args={[sat.size, 0]} />
                <meshStandardMaterial color={sat.color} wireframe />
              </CelestialBody>
            </OrbitGroup>
          ))}
        </OrbitGroup>
      ))}
    </OrbitGroup>
  );
}

// 【修正】動的星座ライン - setPointsエラーを解消し、フラット配列方式へ変更
function DynamicConstellationLine({ stars, color }: { stars: string[], color: string }) {
  const refMap = useContext(RefContext);
  const lineRef = useRef<any>(null);

  useFrame(() => {
    if (!refMap || !lineRef.current || stars.length < 2) {
      if (lineRef.current) lineRef.current.geometry.setPositions(new Float32Array(6)); // クリア
      return;
    }

    const positions = new Float32Array(stars.length * 3);
    let validCount = 0;
    const worldPos = new THREE.Vector3();

    stars.forEach((id, i) => {
      const obj = refMap.current.get(id);
      if (obj) {
        obj.getWorldPosition(worldPos);
        positions.set([worldPos.x, worldPos.y, worldPos.z], i * 3);
        validCount++;
      }
    });

    if (validCount >= 2) {
      lineRef.current.geometry.setPositions(positions);
    }
  });

  return <Line ref={lineRef} points={[[0, 0, 0], [0, 0, 0]]} color={color} lineWidth={1.5} transparent opacity={0.6} />;
}

function ExplorationCamera({ focusId, mode, isOverview }: { focusId: string | null, mode: string, isOverview: boolean }) {
  const { camera, controls } = useThree();
  const refMap = useContext(RefContext);
  const [, get] = useKeyboardControls();
  const targetVec = new THREE.Vector3();
  const cameraVec = new THREE.Vector3();
  const worldPos = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!controls) return;
    if (isOverview) {
      targetVec.set(0, 0, 0); cameraVec.set(0, 90, 130);
      (controls as any).target.lerp(targetVec, 0.05);
      state.camera.position.lerp(cameraVec, 0.05);
      return;
    }
    if (mode === 'DNA') {
      targetVec.set(0, 0, 0); cameraVec.set(0, 0, 40);
      (controls as any).target.lerp(targetVec, 0.05);
      state.camera.position.lerp(cameraVec, 0.05);
      return;
    }
    if (focusId && refMap && refMap.current.has(focusId)) {
      const targetObj = refMap.current.get(focusId);
      if (targetObj) {
        targetObj.getWorldPosition(worldPos);
        targetVec.copy(worldPos);
        cameraVec.copy(worldPos).add(new THREE.Vector3(0, 6, 10));
        (controls as any).target.lerp(targetVec, 0.1);
        state.camera.position.lerp(cameraVec, 0.08);
      }
      return;
    }
    if (mode === 'UNIVERSE' && !focusId) {
      const { forward, backward, left, right, up, down } = get();
      const speed = 40 * delta;
      const front = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); front.y = 0; front.normalize();
      const side = new THREE.Vector3().crossVectors(front, new THREE.Vector3(0, 1, 0)).normalize();
      const moveVec = new THREE.Vector3();
      if (forward) moveVec.add(front); if (backward) moveVec.sub(front); if (left) moveVec.sub(side); if (right) moveVec.add(side); if (up) moveVec.y += 1; if (down) moveVec.y -= 1;
      if (moveVec.length() > 0) {
        camera.position.add(moveVec.multiplyScalar(speed));
        (controls as any).target.add(moveVec.multiplyScalar(speed));
      }
    }
  });
  return <OrbitControls makeDefault enableZoom={true} enablePan={true} enableRotate={true} />;
}

// =====================================================================
// 3. Main Application
// =====================================================================

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
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

  const handleNavigate = (id: string) => {
    const entity = flattenedData.find(e => e.id === id);
    if (!entity) return;
    if (entity.category === '???') {
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 800);
    }
    setIsOverview(false);
    setFocusId(entity.id);
    if (entity.type === 'star') setCurrentMode('STAR');
    if (entity.type === 'planet') setCurrentMode('PLANET');
    if (entity.type === 'satellite') setCurrentMode('SATELLITE');
  };

  const handleBack = () => {
    if (currentMode === 'DNA') { setCurrentMode('UNIVERSE'); return; }
    if (currentMode === 'SATELLITE' || currentMode === 'PLANET') {
      const parent = flattenedData.find(d => d.children?.some(s => s.id === focusId));
      if (parent) handleNavigate(parent.id);
    } else if (currentMode === 'STAR') {
      setFocusId(null); setCurrentMode('UNIVERSE');
    }
  };

  const toggleDNAMode = () => {
    // グリッチをONにする
    setIsTransitioning(true);

    if (currentMode !== 'DNA') {
      setPrevMode(currentMode as any);
      setPrevFocusId(focusId);
      setCurrentMode('DNA');
      setFocusId(null);
    } else {
      setCurrentMode(prevMode);
      setFocusId(prevFocusId);
    }

    // 500ms（0.5秒）後にグリッチをオフにする
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  useEffect(() => {
    setIsMounted(true);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') setShowTerminal(prev => !prev);
      if (e.key === 'u' || e.key === 'U') toggleDNAMode();
      if (e.key === 'b' || e.key === 'B') { setIsOverview(prev => !prev); setFocusId(null); setCurrentMode('UNIVERSE'); }
      if (e.key === 'Escape') handleBack();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentMode, focusId, isOverview]);

  const targetEntity = useMemo(() => flattenedData.find(d => d.id === (focusId || hoveredId)), [focusId, hoveredId]);

  if (!isMounted) return null;

  return (
    <KeyboardControls map={controlsMap}>
      <RefContext.Provider value={refMap}>
        <HoverContext.Provider value={{ hoveredId, setHoveredId }}>
          <main className={`
          h-screen w-full bg-black overflow-hidden relative font-mono text-white select-none
          ${(isTransitioning && targetEntity?.category === '???') ? 'taboo-active' : ''}
         `}>
            <div className="absolute inset-0 z-0">
              <Canvas camera={{ position: [0, 60, 100], fov: 60 }}>
                <color attach="background" args={['#010101']} />
                <ambientLight intensity={0.2} />
                <pointLight position={[0, 0, 0]} intensity={2.5} color="#ffaa00" distance={150} />
                <Environment preset="city" />
                <Sparkles count={4000} scale={200} size={2} speed={0.1} opacity={0.4} />
                <Grid position={[0, -50, 0]} args={[500, 500]} cellSize={10} cellThickness={0.5} cellColor="#111" sectionSize={50} sectionThickness={1} sectionColor="#222" fadeDistance={300} />

                <LiquidMetalDNA onClick={() => { setCurrentMode('DNA'); setFocusId(null); setIsOverview(false); }} />

                <group>
                  {GALAXY_DATA.map(star => <StarObj key={star.id} data={star} focusId={focusId} onSelect={(e) => handleNavigate(e.id)} />)}
                </group>

                <DynamicConstellationLine stars={setlist} color="#ffffff" />

                <ExplorationCamera focusId={focusId} mode={currentMode} isOverview={isOverview} />

                <EffectComposer>
                  {/* 強めの発光 */}

                  {/* 走査線：システムモニター感を演出 */}
                  <Scanline opacity={0.3} density={10.2} />

                  {/* 色収差：レンズの端で色が滲むような効果（デジタルな歪み） */}
                  <ChromaticAberration
                    blendFunction={BlendFunction.NORMAL}
                    offset={new THREE.Vector2(0.003, 0.0015)}
                  />

                  {/* 秩序あるノイズ：opacityを少し上げ、質感を出す */}
                  <Noise opacity={0.12} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />

                  {/* 控えめなグリッチ：たまに走るノイズ */}
                  <Glitch
                    active={isTransitioning} // 切り替え中だけ強制発動
                    delay={new THREE.Vector2(0, 0)} // 遅延なし
                    duration={new THREE.Vector2(0.1, 0.3)} // グリッチの長さ
                    strength={new THREE.Vector2(0.1, 0.3)} // 普段より強めのノイズ
                    mode={GlitchMode.SPORADIC} // 不規則に火花が散るようなモード
                  />

                  <Vignette darkness={1.1} offset={0.1} />
                </EffectComposer>
              </Canvas>
            </div>

            {/* UI: DNA MODE */}
            {currentMode === 'DNA' && (
              <div className="absolute inset-0 z-50 flex justify-between items-center pointer-events-none p-10 md:p-24 animate-fade-in">
                <div className="w-full md:w-1/3 h-full flex flex-col justify-center bg-black/60 backdrop-blur-xl p-10 border-l-4 border-cyan-500 pointer-events-auto">
                  <h2 className="text-5xl font-bold mb-6 tracking-tighter text-white uppercase">{PROFILE_DATA.name}</h2>
                  <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed mb-8">{PROFILE_DATA.bio}</p>
                  <div className="flex flex-wrap gap-4 mt-auto">
                    {SOCIAL_LINKS.map(sns => <a key={sns.name} href={sns.url} target="_blank" rel="noopener noreferrer" className="text-xs border border-gray-600 px-4 py-1.5 hover:bg-cyan-500 hover:text-black transition-all uppercase">{sns.label}</a>)}
                  </div>
                </div>
                <div className="hidden md:flex w-1/3 h-full flex flex-col justify-center bg-black/60 backdrop-blur-xl p-10 border-r-4 border-cyan-500 text-right pointer-events-auto">
                  <h3 className="text-2xl font-bold mb-8 text-cyan-400">UPCOMING</h3>
                  <div className="space-y-6 mb-12 text-xs text-gray-400">
                    {LIVE_EVENTS.map(evt => <div key={evt.id} className="border-b border-gray-800 pb-2"><div className="text-white font-bold mb-1">{evt.date}</div><div>{evt.title}</div><div>{evt.place}</div></div>)}
                  </div>
                  <button
                    onClick={toggleDNAMode} // handleBack から toggleDNAMode に変更
                    className="mt-auto px-10 py-3 bg-red-900/40 border border-red-500 text-white hover:bg-red-800 transition tracking-[0.2em] font-bold"
                  >
                    RETURN TO SYSTEM [U]
                  </button>
                </div>
              </div>
            )}

            {/* UI: COCKPIT / TERMINAL */}
            {showTerminal && currentMode !== 'DNA' && (
              <>
                <div className="absolute top-10 left-6 bottom-32 w-80 bg-black/80 border border-cyan-900/30 backdrop-blur-md flex flex-col pointer-events-auto animate-slide-right z-30">
                  <div className="p-4 border-b border-gray-800 bg-gray-900/50 text-cyan-400 text-xs font-bold tracking-widest">[ ARCHIVE EXPLORER ]</div>
                  <div className="p-3 border-b border-gray-800"><input type="text" placeholder="SEARCH SYSTEM..." className="w-full bg-black border border-gray-700 p-2 text-xs text-cyan-400 outline-none focus:border-cyan-500 transition" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                  <div className="flex-1 overflow-y-auto p-3 custom-scrollbar text-[10px]">
                    <ul className="space-y-2">
                      {searchResults.map((entity) => (
                        <li key={entity.id}>
                          <div className="flex items-center group">
                            <span className="text-gray-600 mr-2">{entity.type === 'star' ? '★' : '●'}</span>
                            <button onClick={() => handleNavigate(entity.id)} className={`flex-1 text-left py-1 truncate hover:text-cyan-400 transition ${focusId === entity.id ? 'text-cyan-400 font-bold border-l border-cyan-500 pl-2' : 'text-gray-300'}`}>{entity.label}</button>
                            {entity.type === 'star' && <button onClick={() => setSetlist(prev => [...prev, entity.id])} className="px-2 text-gray-500 hover:text-white border border-gray-800 opacity-0 group-hover:opacity-100 transition">+</button>}
                          </div>
                          {!searchQuery && entity.children?.map(child => (
                            <div key={child.id} className="pl-4 border-l border-gray-800 ml-1 mt-1">
                              <button onClick={() => handleNavigate(child.id)} className={`block w-full text-left py-0.5 text-gray-500 hover:text-cyan-300 truncate ${focusId === child.id ? 'text-cyan-300' : ''}`}>- {child.label}</button>
                              {child.children?.map(sat => (
                                <button key={sat.id} onClick={() => handleNavigate(sat.id)} className={`block w-full text-left py-0.5 pl-3 text-[9px] hover:text-pink-400 truncate ${focusId === sat.id ? 'text-pink-400' : 'text-gray-600'}`}>· {sat.label}</button>
                              ))}
                            </div>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="absolute top-10 right-6 bottom-32 w-80 bg-black/80 border border-cyan-900/30 backdrop-blur-md flex flex-col pointer-events-auto animate-slide-left z-30 overflow-y-auto custom-scrollbar text-[10px]">
                  <div className="p-4 border-b border-gray-800 bg-gray-900/50 text-cyan-400 text-xs font-bold tracking-widest">[ SCANNER ANALYSIS ]</div>
                  {targetEntity ? (
                    <div className="p-6 space-y-6 animate-fade-in">
                      <h2 className="text-2xl font-bold border-b border-gray-800 pb-2 text-white">{targetEntity.label}</h2>
                      <div className="grid grid-cols-2 gap-4 text-gray-400">
                        <div className="space-y-1"><span className="opacity-50 block uppercase">Classification</span><span className="text-white uppercase">{targetEntity.type}</span></div>
                        <div className="space-y-1"><span className="opacity-50 block uppercase">Category</span><span className="text-white">{targetEntity.category || "---"}</span></div>
                        <div className="space-y-1"><span className="opacity-50 block uppercase">Accesses</span><span className="text-white">{targetEntity.clicks || "0"}</span></div>
                      </div>
                      {targetEntity.youtubeId && <div className="aspect-video bg-black border border-gray-700 mt-6 overflow-hidden rounded shadow-xl"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${targetEntity.youtubeId}`} frameBorder="0" allowFullScreen /></div>}
                    </div>
                  ) : <div className="flex-1 flex items-center justify-center text-xs text-gray-700 text-center uppercase tracking-widest">Awaiting target...<br />Select archive node</div>}
                </div>

                <div className="absolute bottom-6 left-0 w-full flex justify-center items-end pointer-events-auto z-30 animate-slide-up">
                  <div className="bg-black/90 border border-cyan-900/50 px-12 py-4 flex gap-8 items-center backdrop-blur-xl rounded-full shadow-2xl">
                    <button onClick={() => setShowTerminal(false)} className="text-[10px] tracking-widest text-cyan-500 hover:text-white transition">HUD: OFF [T]</button>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <button onClick={handleBack} className="text-xs font-bold tracking-widest text-white hover:text-cyan-400 transition">BACK [ESC]</button>
                    <div className="h-4 w-px bg-gray-800"></div>
                    <button onClick={() => setSetlist([])} className="text-[10px] text-red-500 hover:text-red-300 transition">CLEAR LINE</button>
                  </div>
                </div>
              </>
            )}

            {!showTerminal && currentMode !== 'DNA' && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-auto">
                <button onClick={() => setShowTerminal(true)} className="px-10 py-2.5 bg-black/80 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all text-[10px] tracking-[0.3em] rounded-full font-bold shadow-lg shadow-cyan-500/20">[ Initialize HUD ]</button>
              </div>
            )}
            <div className="absolute bottom-4 right-6 z-50 text-[9px] text-gray-700 pointer-events-none font-mono tracking-widest uppercase">{PROFILE_DATA.ver}</div>
          </main>
        </HoverContext.Provider>
      </RefContext.Provider>
      <style jsx global>{`
       .custom-scrollbar::-webkit-scrollbar {width: 3px; }
       .custom-scrollbar::-webkit-scrollbar-track {background: transparent; }
       .custom-scrollbar::-webkit-scrollbar-thumb {background: #333; border-radius: 10px; }
       @keyframes slide-right {from {transform: translateX(-30px); opacity: 0; } to {transform: translateX(0); opacity: 1; } }
       @keyframes slide-left {from {transform: translateX(30px); opacity: 0; } to {transform: translateX(0); opacity: 1; } }
       @keyframes slide-up {from {transform: translateY(30px); opacity: 0; } to {transform: translateY(0); opacity: 1; } }
       @keyframes fade-in {from {opacity: 0; } to {opacity: 1; } }

       /* ノイズアニメーション */
       @keyframes noise-anim {
         0 % { transform: translate(0, 0) }
         10% {transform: translate(-5%,-5%) }
         20% {transform: translate(-10%,5%) }
         30% {transform: translate(5%,-10%) }
         40% {transform: translate(-5%,15%) }
         50% {transform: translate(-10%,5%) }
         60% {transform: translate(15%,0) }
         70% {transform: translate(0,10%) }
         80% {transform: translate(-15%,0) }
         90% {transform: translate(10%,5%) }
         100% {transform: translate(5%,0) }
        }

       /* 画面全体に薄くノイズの粒子を被せる */
       main::after {
         content: "";
         position: absolute;
         top: -100%;
         left: -100%;
         width: 300%;
         height: 300%;
         background-image: url("https://grainy-gradients.vercel.app/noise.svg");
         opacity: 0.04;
         pointer-events: none;
         z-index: 100;
         animation: noise-anim 2s steps(10) infinite;
        }

       /* style jsx global の中に追加 */
       
       @keyframes screen-shake {
         0% { transform: translafte(0,0) }
         25% { transform: translate(2px, -2px) }
         50% { transform: translate(-2px, 2px) }
         75% { transform: translate(2px, 2px) }
         100% { transform: translate(0,0) }
       }

         .shake {
           animation: screen-shake 0.2s infinite;
         }

      /* 禁忌モード：全体の色を反転させ、ノイズを走らせる */
      .taboo-active {
       filter: invert(1) hue-rotate(180deg);
       animation: taboo-shake 0.1s infinite;
      }

       @keyframes taboo-shake {
         0% { transform: translate(2px, 2px) rotate(0deg); }
         25% { transform: translate(-2px, -2px) rotate(1deg); }
         50% { transform: translate(3px, 0px) rotate(-1deg); }
         75% { transform: translate(-3px, 1px) rotate(0deg); }
         100% { transform: translate(2px, -1px) rotate(1deg); }
       }

     `}</style>
    </KeyboardControls >
  );
}