// app/page.tsx
"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls, MeshDistortMaterial, Line, Text, Environment, Sparkles, KeyboardControls, useKeyboardControls, QuadraticBezierLine, Grid, Ring
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// =====================================================================
// 1. データ定義 (Updated Content)
// =====================================================================

const PROFILE_DATA = {
  name: "KPIA_SYSTEM",
  ver: "22.1.0",
  bio: "整理、ハック、そして逸脱。\n秩序あるノイズを構築する。",
  links: [
    { label: "YouTube", url: "https://www.youtube.com/@popKpia" },
    { label: "X (Twitter)", url: "https://x.com/takt_min" },
    { label: "SoundCloud", url: "https://soundcloud.com/user-376655816" },
    { label: "Instagram", url: "https://www.instagram.com/popkpia/" },
    { label: "Niconico", url: "https://www.nicovideo.jp/user/141136171" },
    { label: "TikTok", url: "https://www.tiktok.com/@popkpia" },
    { label: "Contact", url: "mailto:Kpia0222@gmail.com" },
  ]
};

const LIVE_INFO_DATA = [
  { date: "2025.01.26", title: "27dot RELEASE LIVE", location: "函館ARARA", type: "LIVE", detail: "OPEN 17:30 / START 18:00\nADV ¥2,000 / DOOR ¥2,500" },
  { date: "2025.02.xx", title: "DJ Event (Feb)", location: "TBA", type: "DJ", detail: "Info Coming Soon" },
  { date: "2025.03.xx", title: "DJ Event (Mar)", location: "TBA", type: "DJ", detail: "Info Coming Soon" },
];

const RELEASE_DATA = [
  { date: "2025.01.26", category: "ALBUM", text: "New Album '27dot' Release" },
  { date: "TBA", category: "INFO", text: "Teaser PV & Key Visual Coming Soon" },
];

type StarType = 'original' | 'cover' | 'article' | 'draft';

interface StarData {
  id: string;
  type: StarType;
  initialRadius: number;
  initialAngle: number;
  initialY: number;
  orbitSpeed: number;
  baseColor: string;
  isDevourer?: boolean;
  lastPlayed: number;
  youtubeId?: string;
}

const getStarPosition = (star: StarData, time: number): THREE.Vector3 => {
  if (star.isDevourer) {
    return new THREE.Vector3(
      Math.cos(time * star.orbitSpeed * 2) * star.initialRadius,
      Math.sin(time * star.orbitSpeed * 3) * 15 + star.initialY, 
      Math.sin(time * star.orbitSpeed * 2) * (star.initialRadius * 0.3)
    );
  } else {
    const angle = star.initialAngle + time * star.orbitSpeed;
    const floatOffset = Math.sin(time + star.initialAngle * 3) * 0.5;
    return new THREE.Vector3(
      Math.cos(angle) * star.initialRadius,
      star.initialY + floatOffset,
      Math.sin(angle) * star.initialRadius
    );
  }
};

const generateGalaxy = (): StarData[] => {
  const stars: StarData[] = [];
  const scale = 2.5; 
  for (let i = 0; i < 50; i++) {
    const r = (12 + Math.random() * 10) * scale; 
    const theta = Math.random() * Math.PI * 2;
    const isKp001 = i === 0;
    stars.push({
      id: `Kp.${String(i + 1).padStart(3, '0')}`,
      type: 'original',
      initialRadius: r,
      initialAngle: theta,
      initialY: (Math.random() - 0.5) * 30,
      baseColor: "#ff4400",
      orbitSpeed: 0.05 + Math.random() * 0.05,
      lastPlayed: Date.now(),
      isDevourer: i === 3,
      youtubeId: isKp001 ? "eh8noQsIhjg" : undefined // Sample ID
    });
  }
  for (let i = 0; i < 20; i++) {
    const r = (25 + Math.random() * 8) * scale;
    const theta = Math.random() * Math.PI * 2;
    stars.push({
      id: `Cover.${String(i + 1).padStart(2, '0')}`,
      type: 'cover',
      initialRadius: r,
      initialAngle: theta,
      initialY: (Math.random() - 0.5) * 40,
      baseColor: "#aa00ff", orbitSpeed: 0.02 + Math.random() * 0.02, lastPlayed: Date.now()
    });
  }
  for (let i = 0; i < 30; i++) {
    const r = (35 + Math.random() * 10) * scale;
    const theta = Math.random() * Math.PI * 2;
    stars.push({
      id: `Log.${String(i + 1).padStart(2, '0')}`,
      type: 'article',
      initialRadius: r,
      initialAngle: theta,
      initialY: (Math.random() - 0.5) * 50,
      baseColor: "#00ff88", orbitSpeed: 0.01, lastPlayed: Date.now()
    });
  }
  for (let i = 0; i < 150; i++) {
    const r = (50 + Math.random() * 40) * scale;
    const theta = Math.random() * Math.PI * 2;
    stars.push({
      id: `Draft.${String(i + 1).padStart(3, '0')}`,
      type: 'draft',
      initialRadius: r,
      initialAngle: theta,
      initialY: (Math.random() - 0.5) * 100,
      baseColor: "#00ffff", orbitSpeed: 0.002 + Math.random() * 0.005, lastPlayed: Date.now()
    });
  }
  return stars;
};

const initialStarData = generateGalaxy();

const controlsMap = [
  { name: 'forward', keys: ['w', 'W'] },
  { name: 'backward', keys: ['s', 'S'] },
  { name: 'left', keys: ['a', 'A'] },
  { name: 'right', keys: ['d', 'D'] },
  { name: 'up', keys: ['Space'] },
  { name: 'down', keys: ['Shift'] },
];

// =====================================================================
// 2. 音響システム & YouTube Player
// =====================================================================

let globalAnalyser: any = null;
let globalTone: any = null;
let globalMic: any = null;

function useKpiaSound() {
  const synth = useRef<any>(null); 
  const [isMicActive, setIsMicActive] = useState(false);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("tone").then((Tone) => {
        globalTone = Tone;
        globalAnalyser = new Tone.Analyser("fft", 256);
        globalAnalyser.smoothing = 0.85;
        const mainFilter = new Tone.Filter(1000, "lowpass").connect(globalAnalyser).toDestination();
        synth.current = new Tone.PolySynth(Tone.Synth).connect(mainFilter);
      });
    }
  }, []);

  const initAudio = async () => { if (globalTone) await globalTone.start(); };

  const toggleMic = async () => {
      if (!globalTone) return;
      await globalTone.start();
      if (isMicActive) {
          if (globalMic) { globalMic.close(); globalMic.disconnect(); globalMic = null; }
          setIsMicActive(false); alert("DNA Sensor OFF");
      } else {
          try {
              globalMic = new globalTone.UserMedia(); await globalMic.open(); globalMic.connect(globalAnalyser); setIsMicActive(true); alert("DNA Sensor ON");
          } catch (e) { alert("Microphone access denied."); }
      }
  };

  const playNote = (id: string) => {
    if (!globalTone || !synth.current) return;
    const notes = ["C3", "D3", "E3", "F3", "G3", "A3", "B3"];
    let hash = 0; for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    synth.current.triggerAttackRelease(notes[hash % notes.length], "8n");
  };

  return { playNote, initAudio, toggleMic, isMicActive };
}

declare global { interface Window { onYouTubeIframeAPIReady: () => void; YT: any; } }

function YouTubePlayer({ videoId }: { videoId: string }) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<NodeJS.Timeout | null>(null);

  const showFeedback = (msg: string) => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      setFeedback(msg);
      feedbackTimer.current = setTimeout(() => setFeedback(null), 1500);
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0]; firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
    const initPlayer = () => {
        if (playerRef.current) return;
        playerRef.current = new window.YT.Player(containerRef.current, {
            videoId: videoId,
            playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, fs: 0, iv_load_policy: 3, disablekb: 1 },
            events: {
                onReady: (event: any) => { setDuration(event.target.getDuration()); setIsPlaying(true); },
                onStateChange: (event: any) => { setIsPlaying(event.data === window.YT.PlayerState.PLAYING); }
            }
        });
    };
    if (window.YT && window.YT.Player) initPlayer(); else window.onYouTubeIframeAPIReady = initPlayer;
    return () => { if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; } };
  }, [videoId]);

  useEffect(() => {
    const interval = setInterval(() => { if (playerRef.current && playerRef.current.getCurrentTime) setCurrentTime(playerRef.current.getCurrentTime()); }, 200);
    const handleKey = (e: KeyboardEvent) => {
        if (!playerRef.current) return;
        if (e.code === "Space") {
            const state = playerRef.current.getPlayerState();
            if (state === 1) { playerRef.current.pauseVideo(); showFeedback("⏸ PAUSE"); } else { playerRef.current.playVideo(); showFeedback("▶ PLAY"); }
            e.preventDefault();
        }
        if (e.code === "ArrowRight") { playerRef.current.seekTo(playerRef.current.getCurrentTime() + 5, true); showFeedback("⏩ +5s"); e.preventDefault(); }
        if (e.code === "ArrowLeft") { playerRef.current.seekTo(playerRef.current.getCurrentTime() - 5, true); showFeedback("⏪ -5s"); e.preventDefault(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => { clearInterval(interval); window.removeEventListener("keydown", handleKey); };
  }, []);

  const formatTime = (t: number) => { const m = Math.floor(t / 60); const s = Math.floor(t % 60); return `${m}:${s.toString().padStart(2, '0')}`; };
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!playerRef.current || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = duration * percentage;
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
  };

  return (
      <div className="w-full h-full relative group overflow-hidden rounded-sm border border-cyan-900/50 bg-black">
          <div ref={containerRef} className="w-full h-full absolute inset-0 pointer-events-none" />
          {feedback && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-ping-short"><div className="bg-black/70 border border-cyan-500 px-4 py-2 text-cyan-400 font-bold font-mono text-xl tracking-widest shadow-lg shadow-cyan-500/20">{feedback}</div></div>}
          <div className="absolute inset-0 flex flex-col justify-end p-0 pointer-events-none z-10">
              <div className="bg-black/80 w-full p-2 pointer-events-auto backdrop-blur-sm border-t border-gray-800">
                  <div className="w-full h-4 mb-1 cursor-pointer flex items-center group/seek" onClick={handleSeek}>
                      <div className="w-full h-1 bg-gray-700 relative rounded-full overflow-hidden group-hover/seek:h-2 transition-all">
                          <div className="absolute top-0 left-0 h-full bg-cyan-500 shadow-[0_0_8px_#00ffff]" style={{ width: `${progress}%` }} />
                      </div>
                  </div>
                  <div className="flex justify-between items-center font-mono text-cyan-400 text-[10px] tracking-wider">
                      <div className="flex gap-3 items-center">
                          <button onClick={() => { if(isPlaying) playerRef.current.pauseVideo(); else playerRef.current.playVideo(); }} className="hover:text-white cursor-pointer">{isPlaying ? "⏸" : "▶"}</button>
                          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                      </div>
                      <div className="flex gap-2 text-gray-500 text-[9px]"><span>[← -5s]</span><span>[SPC]</span><span>[+5s →]</span></div>
                  </div>
              </div>
          </div>
      </div>
  );
}

// =====================================================================
// 3. ビジュアルコンポーネント & カメラ制御
// =====================================================================

function GiantOrganicRNA({ isFeeding }: { isFeeding: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const COUNT = 120; 
  const baseStructure = useMemo(() => {
    const temp = [];
    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT;
      const angle = t * Math.PI * 24; 
      const y = (t - 0.5) * 400;
      const radius = 8 + Math.sin(t * Math.PI * 8) * 3; 
      const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
      const pos = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const baseTip = new THREE.Vector3(Math.cos(angle) * (radius * 0.4), y, Math.sin(angle) * (radius * 0.4));
      pos.x += (Math.random() - 0.5) * 3; pos.z += (Math.random() - 0.5) * 3;
      temp.push({ pos, baseTip, dir, id: i });
    }
    return temp;
  }, []);

  const lineRefs = useRef<any[]>([]);
  const cellRefs = useRef<any[]>([]);
  const baseOrange = useMemo(() => new THREE.Color("#ff4400"), []);
  const hotOrange = useMemo(() => new THREE.Color("#ffaa00"), []);

  useFrame((state) => {
    let freqData: Float32Array | null = null;
    if (globalAnalyser) freqData = globalAnalyser.getValue();
    if (groupRef.current) groupRef.current.rotation.y += isFeeding ? 0.02 : 0.002;
    if (freqData) {
        baseStructure.forEach((item, i) => {
            const dataIndex = Math.floor((i / COUNT) * 64);
            const db = freqData![dataIndex];
            const volume = Math.max(0, (db + 100) / 100);
            const intensity = volume * volume * 25.0; 
            const offset = item.dir.clone().multiplyScalar(intensity);
            const newPos = item.pos.clone().add(offset);
            const line = lineRefs.current[i]; if (line) line.setPoints(newPos, item.baseTip);
            const cell = cellRefs.current[i];
            if (cell) {
                cell.position.copy(newPos);
                cell.material.color.copy(baseOrange);
                cell.material.emissive.lerpColors(baseOrange, hotOrange, volume);
                cell.material.emissiveIntensity = 0.1 + volume * 0.7; 
                cell.scale.setScalar(4.5 + volume * 2);
            }
        });
    }
  });

  return (
    <group ref={groupRef}>
      {baseStructure.map((item, i) => (
        <group key={i}>
           <ReactiveLine ref={(el:any) => (lineRefs.current[i] = el)} start={item.pos} end={item.baseTip} isFeeding={isFeeding} />
           <mesh ref={(el) => (cellRefs.current[i] = el)} position={item.pos} scale={4.5}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={0.1} metalness={0.8} roughness={0.2} />
           </mesh>
        </group>
      ))}
    </group>
  );
}

const ReactiveLine = React.forwardRef(({ start, end, isFeeding }: any, ref: any) => {
    const geometryRef = useRef<THREE.BufferGeometry>(null);
    React.useImperativeHandle(ref, () => ({
        setPoints: (newStart: THREE.Vector3, newEnd: THREE.Vector3) => {
            if (geometryRef.current) geometryRef.current.setFromPoints([newStart, newEnd]);
        }
    }));
    return <line><bufferGeometry ref={geometryRef} /><lineBasicMaterial color={isFeeding ? "#ffaa00" : "#882200"} linewidth={2} transparent opacity={0.8} /></line>;
});
ReactiveLine.displayName = "ReactiveLine";

function OrbitPath({ radius, y }: { radius: number, y: number }) {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <Ring args={[radius - 0.05, radius + 0.05, 128]}><meshBasicMaterial color="#333" transparent opacity={0.15} side={THREE.DoubleSide} /></Ring>
    </group>
  )
}

function DynamicFlowLine({ startStar, endStar }: { startStar: StarData, endStar: StarData }) {
  const lineRef = useRef<any>(null);
  useFrame((state) => {
    if (lineRef.current && lineRef.current.geometry) {
      const time = state.clock.getElapsedTime();
      const start = getStarPosition(startStar, time);
      const end = getStarPosition(endStar, time);
      if (startStar.isDevourer || endStar.isDevourer) lineRef.current.visible = Math.random() > 0.1;
      lineRef.current.geometry.setPositions([start.x, start.y, start.z, end.x, end.y, end.z]);
      if (lineRef.current.material) lineRef.current.material.dashOffset -= 0.01;
    }
  });
  return <Line ref={lineRef} points={[[0,0,0], [0,0,0]]} color="#ff4400" lineWidth={1} dashed dashScale={2} dashSize={0.5} gapSize={0.2} transparent opacity={0.4} />;
}

function CameraManager({ mode, targetStar, controlsRef }: { mode: 'FREE' | 'OVERVIEW' | 'LANDING', targetStar: StarData | null, controlsRef: any }) {
  const { camera } = useThree();
  
  useEffect(() => {
    if (!controlsRef.current) return;
    if (mode === 'OVERVIEW') { 
        // Overviewモード: 位置は高くするが、操作は奪わない (OrbitControlsは維持)
        // resetはせず、位置だけスムーズに移動させる
        camera.position.set(0, 150, 200);
        controlsRef.current.target.set(0, 0, 0); 
    } else if (mode === 'FREE') { 
        // Freeモードに戻っても、特に位置をリセットする必要はない
        controlsRef.current.target.set(0, 0, 0); 
    }
  }, [mode, camera, controlsRef]);

  useFrame((state) => {
    if (mode === 'LANDING' && targetStar && controlsRef.current) {
        controlsRef.current.target.lerp(getStarPosition(targetStar, state.clock.getElapsedTime()), 0.1);
    }
  });
  return null;
}

function SpectatorControls({ active }: { active: boolean }) {
  const [, get] = useKeyboardControls();
  const { camera } = useThree();
  useFrame(() => {
    // Overviewモードでも自由に動けるようにするなら active 条件を変更しても良い
    if (!active) return;
    const { forward, backward, left, right, up, down } = get();
    const speed = 0.8;
    const front = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); front.y = 0; front.normalize();
    const side = new THREE.Vector3().crossVectors(front, new THREE.Vector3(0, 1, 0)).normalize();
    if (forward) camera.position.add(front.multiplyScalar(speed));
    if (backward) camera.position.add(front.multiplyScalar(-speed));
    if (right) camera.position.add(side.multiplyScalar(speed));
    if (left) camera.position.add(side.multiplyScalar(-speed));
    if (up) camera.position.y += speed;
    if (down) camera.position.y -= speed;
  });
  return null;
}

function Star({ data, clicks, setRef, onSelect, onHover, onLeave }: any) {
    const isDraft = data.type === 'draft';
    const heat = Math.min(clicks, 10);
    const baseColorObj = new THREE.Color(data.baseColor);
    const whiteColor = new THREE.Color("#ffffff");
    const cyanColor = new THREE.Color("#aaffff");
    const displayColor = useMemo(() => {
        if (data.isDevourer) return new THREE.Color("#ff00ff");
        if (heat <= 5) return baseColorObj.clone().lerp(whiteColor, heat / 5);
        else return whiteColor.clone().lerp(cyanColor, (heat - 5) / 5);
    }, [clicks, data.baseColor]);
    const displayColorHex = "#" + displayColor.getHexString();
    const growScale = 1 + Math.log(clicks + 1) * 0.8;
    const finalScale = (isDraft ? 1.0 : (data.isDevourer ? 2.5 : 1.2)) * growScale;
    const isActive = clicks > 0 || data.isDevourer;
    const emissiveColor = isActive ? displayColorHex : "#000000";
    const emissiveIntensity = isActive ? (data.isDevourer ? 3 : 1.0 + (heat / 10) * 4.0) : 0;

    return (
        <group ref={setRef}>
            <mesh onClick={(e) => { e.stopPropagation(); onSelect(data.id, data.type); }} onPointerOver={(e) => { e.stopPropagation(); onHover(data); }} onPointerOut={(e) => { e.stopPropagation(); onLeave(); }} scale={finalScale}>
                {isDraft ? <icosahedronGeometry args={[0.08, 0]} /> : (data.type === 'article' ? <boxGeometry args={[0.2, 0.2, 0.2]} /> : <sphereGeometry args={[0.12, 32, 32]} />)}
                <meshStandardMaterial color={displayColorHex} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} metalness={0.9} roughness={0.2} wireframe={isDraft || data.isDevourer} />
            </mesh>
            {isActive && !isDraft && !data.isDevourer && <Sparkles count={3} scale={finalScale * 1.5} size={2} color={displayColorHex} opacity={0.5} />}
            {isActive && !isDraft && <Text position={[0, 0.6 * finalScale, 0]} fontSize={0.15 * finalScale} color="white">{data.id}</Text>}
        </group>
    );
}

function GalaxySystem({ stars, starStats, onSelect, onHover, onLeave }: any) {
  const starRefs = useRef<(THREE.Group | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    starRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const data = stars[i];
      if (data.isDevourer) {
        if (Math.random() < 0.01) ref.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 100);
        ref.position.x += (Math.random() - 0.5) * 1.5; ref.position.y += (Math.random() - 0.5) * 1.5; ref.position.z += (Math.random() - 0.5) * 1.5;
        ref.rotation.x += 0.2; ref.rotation.y += 0.2;
      } else {
        const pos = getStarPosition(data, t); ref.position.copy(pos); ref.rotation.y += 0.01;
      }
    });
  });
  return (
    <group>
      {stars.map((data: StarData, i: number) => (
        <group key={data.id}>
          {!data.isDevourer && data.type !== 'draft' && <OrbitPath radius={data.initialRadius} y={data.initialY} />}
          <Star data={data} clicks={starStats[data.id] || 0} setRef={(el: THREE.Group) => (starRefs.current[i] = el)} onSelect={onSelect} onHover={onHover} onLeave={onLeave} />
        </group>
      ))}
    </group>
  );
}

// =====================================================================
// 5. メインコンポーネント (UI)
// =====================================================================

export default function Home() {
  const { playNote, initAudio, toggleMic, isMicActive } = useKpiaSound();
  const [hasEntered, setHasEntered] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalIndex, setTerminalIndex] = useState(0);
  const [stars] = useState<StarData[]>(initialStarData);
  const [history, setHistory] = useState<string[]>([]);
  const [starStats, setStarStats] = useState<{[key:string]:number}>({});
  const [isFeeding, setIsFeeding] = useState(false);
  
  // Setlist State
  const [setlist, setSetlist] = useState<string[]>([]);
  
  const [cameraMode, setCameraMode] = useState<'FREE' | 'OVERVIEW' | 'LANDING'>('FREE');
  const [selectedStar, setSelectedStar] = useState<StarData | null>(null);
  const [popupStar, setPopupStar] = useState<StarData | null>(null);
  const popupTimer = useRef<NodeJS.Timeout | null>(null);
  const controlsRef = useRef<any>(null); 
  
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'INFO' | 'DATA' | 'CMD'>('INFO');

  useEffect(() => {
      if (typeof window !== "undefined") {
          const checkMobile = () => setIsMobile(window.innerWidth < 768);
          checkMobile();
          window.addEventListener('resize', checkMobile);
          return () => window.removeEventListener('resize', checkMobile);
      }
  }, []);

  // Initialize Setlist from LocalStorage
  useEffect(() => {
      const saved = localStorage.getItem("kpia_setlist");
      if (saved) setSetlist(JSON.parse(saved));
  }, [hasEntered]);

  const handleHover = (star: StarData) => { if (popupTimer.current) clearTimeout(popupTimer.current); setPopupStar(star); };
  const handleLeave = () => { popupTimer.current = setTimeout(() => { setPopupStar(null); }, 3000); };
  const handleSelect = (id: string, type: StarType) => {
    playNote(id); setIsFeeding(true); setTimeout(() => setIsFeeding(false), 200);
    const target = stars.find(s => s.id === id) || null; setSelectedStar(target); setPopupStar(target);
    const idx = stars.findIndex(s => s.id === id); if (idx !== -1) setTerminalIndex(idx);
    if (type !== 'draft') { setStarStats(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 })); }
    setHistory(prev => [...prev, id]);
  };

  // Setlist Functions
  const addToSetlist = (id: string) => {
      if (!setlist.includes(id)) {
          const newSet = [...setlist, id];
          setSetlist(newSet);
          // Auto save
          localStorage.setItem("kpia_setlist", JSON.stringify(newSet));
      }
  };
  const saveSetlist = () => {
      localStorage.setItem("kpia_setlist", JSON.stringify(setlist));
      alert("Setlist Saved to DNA.");
  };
  const clearSetlist = () => {
      if(confirm("Clear current setlist?")) {
          setSetlist([]);
          localStorage.removeItem("kpia_setlist");
      }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasEntered) return;
      if (e.key === 't' || e.key === 'T') setShowTerminal(prev => !prev);
      if (e.key === 'o' || e.key === 'O') setCameraMode(prev => prev === 'OVERVIEW' ? 'FREE' : 'OVERVIEW');
      if (e.key === 'f' || e.key === 'F') toggleMic();
      if (e.key === 'Escape') setCameraMode('FREE');
      if (e.key === 'l' || e.key === 'L') {
          if (cameraMode === 'LANDING') { setCameraMode('FREE'); } 
          else if (popupStar) { handleSelect(popupStar.id, popupStar.type); setCameraMode('LANDING'); setPopupStar(null); } 
          else if (selectedStar) { setCameraMode('LANDING'); setPopupStar(null); }
      }
      if (showTerminal && cameraMode === 'FREE') {
        if (e.key === 'ArrowDown') setTerminalIndex(prev => (prev + 1) % stars.length);
        if (e.key === 'ArrowUp') setTerminalIndex(prev => (prev - 1 + stars.length) % stars.length);
        if (e.key === 'Enter') handleSelect(stars[terminalIndex].id, stars[terminalIndex].type);
      }
    };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasEntered, showTerminal, terminalIndex, cameraMode, stars, popupStar, selectedStar, history, starStats, toggleMic]);

  return (
    <KeyboardControls map={controlsMap}>
      <main className="h-screen w-full bg-black overflow-hidden relative">
        {!hasEntered && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-orange-500 font-mono">
            <h1 className="text-4xl font-bold mb-4 tracking-widest glow-text">KPIA.SYSTEM</h1>
            <p className="text-xs mb-8 text-gray-500">WASD: Move | MOUSE: Look | L: Land | T: HUD</p>
            <button onClick={() => { setHasEntered(true); initAudio(); }} className="px-8 py-3 border border-orange-500 hover:bg-orange-900/50 text-white transition-all">INITIALIZE SYSTEM</button>
          </div>
        )}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 5, 60], fov: 60 }}>
            <color attach="background" args={['#050505']} />
            <ambientLight intensity={0.1} />
            <pointLight position={[0, 0, 0]} intensity={20} color="#ff8800" distance={200} />
            <Environment preset="city" />
            <Grid position={[0, -30, 0]} args={[400, 400]} cellSize={5} cellThickness={0.5} cellColor="#222222" sectionSize={25} sectionThickness={1} sectionColor="#444444" fadeDistance={200} />
            <CameraManager mode={cameraMode} targetStar={selectedStar} controlsRef={controlsRef} />
            <SpectatorControls active={true} /> {/* 常に操作可能にする */}
            <OrbitControls ref={controlsRef} enableZoom={true} enablePan={false} rotateSpeed={0.5} dampingFactor={0.1} maxDistance={300} enabled={true} />
            <GiantOrganicRNA isFeeding={isFeeding} />
            <GalaxySystem stars={stars} starStats={starStats} onSelect={handleSelect} onHover={handleHover} onLeave={handleLeave} />
            {history.map((id, i) => {
              if (i === 0) return null;
              const startStar = stars.find(s => s.id === history[i-1]); const endStar = stars.find(s => s.id === id);
              if (!startStar || !endStar) return null; return <DynamicFlowLine key={i} startStar={startStar} endStar={endStar} />;
            })}
            <EffectComposer><Bloom intensity={isFeeding ? 3.0 : 1.5} luminanceThreshold={0.1} radius={0.6} /></EffectComposer>
          </Canvas>
        </div>

        {hasEntered && popupStar && cameraMode !== 'LANDING' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-12 pointer-events-none z-20 text-center animate-slide-up">
                <div className="text-cyan-400 font-bold font-mono tracking-widest text-sm bg-black/80 px-4 py-2 border border-cyan-900 shadow-lg shadow-cyan-900/20">TARGET: {popupStar.id}</div>
                <div className="text-cyan-600 text-[10px] font-mono mt-1 blink">PRESS [L] TO LAND</div>
            </div>
        )}

        {/* TERMINAL TOGGLE BUTTON (Mobile/Desktop) */}
        {hasEntered && (
            <button 
                onClick={() => setShowTerminal(prev => !prev)} 
                className="absolute top-4 right-4 z-50 px-3 py-1 bg-black/80 border border-orange-500 text-orange-500 text-xs font-mono font-bold hover:bg-orange-900/50 transition-all"
            >
                [ T ]
            </button>
        )}

        {/* MOBILE TABS */}
        {hasEntered && showTerminal && isMobile && (
            <div className="absolute top-16 right-4 z-50 flex flex-col gap-2 font-mono">
                <button onClick={() => setMobileTab('INFO')} className={`px-2 py-1 text-xs border ${mobileTab==='INFO' ? 'bg-orange-500 text-black border-orange-500' : 'bg-black/80 text-orange-500 border-gray-700'}`}>INFO</button>
                <button onClick={() => setMobileTab('DATA')} className={`px-2 py-1 text-xs border ${mobileTab==='DATA' ? 'bg-orange-500 text-black border-orange-500' : 'bg-black/80 text-orange-500 border-gray-700'}`}>DATA</button>
                <button onClick={() => setMobileTab('CMD')} className={`px-2 py-1 text-xs border ${mobileTab==='CMD' ? 'bg-orange-500 text-black border-orange-500' : 'bg-black/80 text-orange-500 border-gray-700'}`}>CMD</button>
            </div>
        )}

        {/* HUD UI (Desktop: All / Mobile: Tabbed) */}
        {hasEntered && showTerminal && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent">
               <div className="text-orange-500 font-mono tracking-widest"><h2 className="text-xl font-bold">KPIA.SYSTEM</h2><span className="text-[10px] opacity-70">VER {PROFILE_DATA.ver} // {cameraMode}</span></div>
               {!isMobile && <div className="text-right text-[10px] font-mono text-gray-500">UPTIME: ∞<br/>DNA: {isMicActive ? "ACTIVE" : "STANDBY"}</div>}
            </div>

            {/* LEFT PANEL (INFO) */}
            {(!isMobile || mobileTab === 'INFO') && (
                <div className={`absolute top-20 left-4 md:left-8 ${isMobile ? 'w-64' : 'w-80'} max-h-[70vh] overflow-y-auto font-mono text-orange-500 pointer-events-auto no-scrollbar`}>
                    <div className="flex flex-col gap-6">
                        <div className="p-4 bg-black/70 border-l-2 border-orange-500 backdrop-blur-sm">
                            <h3 className="text-xs font-bold mb-2 opacity-70 border-b border-orange-900 pb-1">[ USER PROFILE ]</h3>
                            <div className="text-lg font-bold text-white mb-1">{PROFILE_DATA.name}</div>
                            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line mb-4">{PROFILE_DATA.bio}</p>
                            <div className="space-y-2">{PROFILE_DATA.links.map((link, i) => (<a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-[10px] p-2 border border-gray-700 hover:bg-orange-900/30 hover:border-orange-500 transition-all text-white">{link.label} ↗</a>))}</div>
                        </div>
                        <div className="p-4 bg-black/70 border-l-2 border-orange-500 backdrop-blur-sm">
                            <h3 className="text-xs font-bold mb-2 opacity-70 border-b border-orange-900 pb-1">[ LIVE INFO ]</h3>
                            <div className="space-y-3">{LIVE_INFO_DATA.map((item, i) => (<div key={i} className="flex gap-3 text-xs border-b border-gray-800 pb-2"><div className="flex flex-col items-center justify-center bg-gray-900 px-2 py-1 border border-gray-700 w-12 text-center"><span className="text-[10px] text-gray-500">{item.date.split('.')[1]}</span><span className="text-lg font-bold text-orange-500 leading-none">{item.date.split('.')[2]}</span></div><div className="flex-1"><div className="text-white font-bold">{item.title}</div><div className="text-[10px] text-gray-400 mt-1 whitespace-pre-line">{item.detail}</div><div className="text-[10px] text-orange-400 text-right mt-1">[{item.type}]</div></div></div>))}</div>
                        </div>
                        <div className="p-4 bg-black/70 border-l-2 border-orange-500 backdrop-blur-sm">
                            <h3 className="text-xs font-bold mb-2 opacity-70 border-b border-orange-900 pb-1">[ RELEASES ]</h3>
                            <div className="space-y-2">{RELEASE_DATA.map((item, i) => (<div key={i} className="text-xs flex flex-col gap-1 border-b border-gray-800 pb-1 mb-1"><div className="flex justify-between"><span className="text-gray-500">{item.date}</span><span className="border border-gray-700 px-1 text-[10px] text-orange-300">{item.category}</span></div><span className="text-gray-300">{item.text}</span></div>))}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* RIGHT PANEL (DATA & SETLIST) */}
            {(!isMobile || mobileTab === 'DATA') && (
                <div className={`absolute top-20 right-4 md:right-8 ${isMobile ? 'w-64' : 'w-72'} h-[70vh] font-mono text-orange-500 pointer-events-auto flex flex-col gap-4`}>
                    
                    {/* Star Database */}
                    <div className="bg-black/70 border-r-2 border-orange-500 backdrop-blur-sm flex-1 overflow-hidden flex flex-col h-1/2">
                        <h3 className="p-2 text-xs font-bold border-b border-gray-800 bg-black/80">[ STAR DATABASE ]</h3>
                        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                            <ul className="space-y-1">
                                {stars.map((s, i) => { 
                                    let typeColor = "text-orange-500"; if (s.type === 'cover') typeColor = "text-purple-400"; if (s.type === 'article') typeColor = "text-green-400"; if (s.type === 'draft') typeColor = "text-cyan-600"; 
                                    return (
                                        <li key={s.id} className={`text-xs p-1 ${i === terminalIndex ? "bg-orange-900/50" : ""}`} onMouseEnter={() => setTerminalIndex(i)}>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => { handleSelect(s.id, s.type); e.currentTarget.blur(); }} className={`flex-1 text-left flex justify-between ${s.isDevourer ? "animate-pulse text-red-500" : typeColor}`}>
                                                    <span>{s.id}</span>
                                                    <span className="opacity-30">{s.type}</span>
                                                </button>
                                                <button onClick={() => addToSetlist(s.id)} className="text-[10px] px-1 text-gray-500 hover:text-white border border-gray-800 hover:bg-gray-700">+</button>
                                            </div>
                                        </li>
                                    ) 
                                })}
                            </ul>
                        </div>
                    </div>

                    {/* Setlist Section (New) */}
                    <div className="bg-black/70 border-r-2 border-cyan-500 backdrop-blur-sm flex-1 overflow-hidden flex flex-col h-1/2">
                         <div className="p-2 border-b border-gray-800 bg-black/80 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-cyan-400">[ SETLIST / DNA ]</h3>
                            <div className="flex gap-1">
                                <button onClick={saveSetlist} className="text-[9px] px-2 py-0.5 border border-cyan-700 text-cyan-500 hover:bg-cyan-900/50">SAVE</button>
                                <button onClick={clearSetlist} className="text-[9px] px-2 py-0.5 border border-red-700 text-red-500 hover:bg-red-900/50">CLR</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                            {setlist.length === 0 ? <div className="text-[10px] text-gray-600 text-center mt-4">NO DATA</div> : (
                                <ul className="space-y-1">
                                    {setlist.map((id, i) => (
                                        <li key={i} className="text-xs p-1 bg-white/5 flex justify-between items-center text-cyan-300">
                                            <span className="flex gap-2">
                                                <span className="opacity-40 w-4">{i+1}.</span>
                                                <span>{id}</span>
                                            </span>
                                            <button onClick={() => {
                                                const newSet = [...setlist]; newSet.splice(i, 1); setSetlist(newSet);
                                            }} className="text-gray-500 hover:text-red-400 px-1">×</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* BOTTOM PANEL (CMD/CONTROLS) */}
            {(!isMobile || mobileTab === 'CMD') && (
                <div className={`absolute bottom-8 left-0 w-full px-4 md:px-8 flex ${isMobile ? 'flex-col items-center gap-4' : 'justify-end items-end'} font-mono text-orange-500 pointer-events-auto`}>
                   <div className={`flex gap-4 items-end ${isMobile ? 'flex-col' : ''}`}>
                       <button onClick={toggleMic} className={`px-6 py-3 border border-orange-500 text-xs hover:bg-orange-900/50 text-white font-bold transition-all ${isMicActive ? "bg-orange-600" : "bg-black/80"}`}>DNA {isMicActive ? "[ON]" : "[OFF]"}</button>
                       <button onClick={() => setCameraMode(prev => prev === 'OVERVIEW' ? 'FREE' : 'OVERVIEW')} className={`px-6 py-3 border border-orange-500 text-xs font-bold transition-all ${cameraMode === 'OVERVIEW' ? 'bg-orange-500 text-black' : 'bg-black/80 text-white hover:bg-orange-900/50'}`}>{cameraMode === 'OVERVIEW' ? "EXIT OVERVIEW" : "OVERVIEW [O]"}</button>
                       {popupStar && cameraMode !== 'LANDING' && (<button onClick={() => { handleSelect(popupStar.id, popupStar.type); setCameraMode('LANDING'); setPopupStar(null); }} className="px-6 py-3 bg-black/80 border border-cyan-500 text-xs text-cyan-400 hover:bg-cyan-900/50 font-bold transition-all animate-pulse">LAND [L]</button>)}
                       {cameraMode === 'LANDING' && (<button onClick={() => setCameraMode('FREE')} className="px-6 py-3 bg-red-900/80 border border-red-500 text-xs text-white hover:bg-red-700 font-bold transition-all">ABORT LANDING [L]</button>)}
                   </div>
                </div>
            )}
          </div>
        )}

        {/* LANDING OVERLAY (常に表示 - Terminalの影響を受けない) */}
        {hasEntered && cameraMode === 'LANDING' && selectedStar && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="absolute bottom-24 right-4 md:right-24 bg-black/80 border border-cyan-500 p-6 w-[90vw] md:w-96 backdrop-blur-md pointer-events-auto animate-slide-up">
                    <h2 className="text-xl font-bold text-cyan-400 mb-2">{selectedStar.id}</h2>
                    <div className="text-gray-400 text-xs mb-4 font-mono">Type: {selectedStar.type.toUpperCase()} | Status: ACTIVE</div>
                    <div className="aspect-video bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 mb-2 text-xs relative pointer-events-auto">
                        {selectedStar.youtubeId ? (<YouTubePlayer videoId={selectedStar.youtubeId} />) : (<span>[ DATA ENCRYPTED - AUDIO SENSOR ONLY ]</span>)}
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button onClick={() => addToSetlist(selectedStar.id)} className="flex-1 bg-cyan-900/50 border border-cyan-500 text-cyan-400 text-xs py-2 hover:bg-cyan-500 hover:text-black transition">ADD TO SETLIST</button>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed mt-2">{selectedStar.youtubeId ? "Decryption complete. Accessing media archive." : "No visual data. Analysis mode active."}</p>
                </div>
            </div>
        )}

        <style jsx global>{` 
            .glow-text { text-shadow: 0 0 20px #ff4400; } 
            .animate-slide-in { animation: slide-in 0.3s ease-out; } 
            .animate-slide-up { animation: slide-up 0.5s ease-out; }
            .blink { animation: blink 1s infinite; }
            .animate-ping-short { animation: ping-short 0.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
            @keyframes ping-short { 75%, 100% { transform: scale(1.5); opacity: 0; } }
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slide-up { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </main>
    </KeyboardControls>
  );
}