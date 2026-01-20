"use client";

/**
 * =====================================================================
 * MultiverseGateView - マルチバースゲート画面
 * =====================================================================
 *
 * プレミアムシェーダーベースの宇宙選択画面
 * - Canon、Xen、Nascentの3つの宇宙をオーブとして表示
 * - 各オーブは独自のカスタムシェーダーで描画
 * - ホバー時のアニメーション、クリックでワープ遷移
 *
 * キー操作:
 * - M キー: マルチバースモードのON/OFF
 *
 * シェーダー構成:
 * - Canon: ガラス + 幾何学グリッド
 * - Xen: 液体金属 + ドメインワーピング
 * - Nascent: 雲レイヤー + ボリュメトリック
 */

import React, { useRef, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PerspectiveCamera, Html, MeshTransmissionMaterial } from "@react-three/drei";

/**
 * 宇宙データの型定義
 */
interface Universe {
  id: number;                             // 宇宙ID
  name: string;                           // 宇宙名（CANON, XEN, NASCENT）
  type: "Canon" | "Xen" | "Lab" | "Unformed";
  pos: [number, number, number];          // 3D空間での位置
  color: string;                          // テーマカラー
  isMicrotonal: boolean;                  // 微分音宇宙かどうか
  erosion: number;                        // 侵食度
  tendency: number;                       // 傾向値
  starCount: number;                      // 含まれる星の数
}

/**
 * コンポーネントのプロパティ
 */
interface MultiverseGateViewProps {
  universes: Universe[];                  // 表示する宇宙の配列
  onSelectUniverse: (id: number) => void; // 宇宙選択時のコールバック
  currentUniverseId: number | null;       // 現在選択されている宇宙ID
  isHudVisible?: boolean;                 // HUD表示状態 (Stealth Mode対応)
}

export default function MultiverseGateView({
  universes,
  onSelectUniverse,
  currentUniverseId,
  isHudVisible = true,
}: MultiverseGateViewProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Animate background wave
  useFrame(({ clock }) => {
    if (groupRef.current && !isTransitioning) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  const handleOrbClick = (universeId: number) => {
    setIsTransitioning(true);
    onSelectUniverse(universeId);
  };

  // Position orbs in an arc
  const orbPositions: [number, number, number][] = useMemo(() => {
    const radius = 8;
    const arcAngle = Math.PI / 3; // 60 degrees arc
    return universes.map((_, index) => {
      const angle = -arcAngle / 2 + (arcAngle / (universes.length - 1)) * index;
      return [Math.sin(angle) * radius, 0, Math.cos(angle) * radius - 5];
    });
  }, [universes]);

  return (
    <group>
      {/* Dedicated Camera */}
      <PerspectiveCamera makeDefault position={[0, 2, 15]} fov={50} />

      {/* Abstract Background Wave */}
      <AbstractBackgroundWave />

      {/* Ambient lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 10, 10]} intensity={30} color="#ffffff" />

      {/* Orbs */}
      <group ref={groupRef}>
        {universes.map((universe, index) => (
          <UniverseOrb
            key={universe.id}
            universe={universe}
            position={orbPositions[index]}
            isHovered={hoveredId === universe.id}
            isTransitioning={isTransitioning}
            showLabel={isHudVisible}
            onHover={() => setHoveredId(universe.id)}
            onUnhover={() => setHoveredId(null)}
            onClick={() => handleOrbClick(universe.id)}
          />
        ))}

        {/* ====================================================
            Empty Slots - 未観測の空白（将来拡張用）
            最大6スロット、現在3使用
            ==================================================== */}
        {Array.from({ length: Math.max(0, 6 - universes.length) }).map((_, i) => {
          const emptyIndex = universes.length + i;
          const radius = 8;
          const arcAngle = Math.PI / 2; // 90 degrees for 6 slots
          const angle = -arcAngle / 2 + (arcAngle / 5) * emptyIndex;
          const position: [number, number, number] = [
            Math.sin(angle) * radius * 1.2,
            -2, // 少し下に配置
            Math.cos(angle) * radius - 5
          ];

          return (
            <group key={`empty-slot-${i}`} position={position}>
              {/* 空スロットのゴースト球 */}
              <mesh>
                <sphereGeometry args={[1.5, 16, 16]} />
                <meshBasicMaterial
                  color="#222222"
                  transparent
                  opacity={0.15}
                  wireframe
                />
              </mesh>

              {/* 空スロットのラベル (HUD表示時のみ) */}
              {isHudVisible && (
                <Html position={[0, -2, 0]} center>
                  <div className="text-center pointer-events-none opacity-30">
                    <div className="font-mono text-[8px] text-zinc-600 tracking-widest">
                      SLOT_{emptyIndex + 1}
                    </div>
                    <div className="text-[6px] text-zinc-700 tracking-wider mt-0.5">
                      [UNOBSERVED]
                    </div>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}

// Abstract wireframe wave background
function AbstractBackgroundWave() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      const positions = meshRef.current.geometry.attributes.position;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const wave = Math.sin(x * 0.5 + time * 0.5) * Math.cos(z * 0.5 + time * 0.3) * 2;
        positions.setY(i, wave);
      }

      positions.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -8, -10]} rotation={[-Math.PI / 4, 0, 0]}>
      <planeGeometry args={[50, 50, 50, 50]} />
      <meshBasicMaterial
        color="#111111"
        wireframe
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

interface UniverseOrbProps {
  universe: Universe;
  position: [number, number, number];
  isHovered: boolean;
  isTransitioning: boolean;
  showLabel: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
}

function UniverseOrb({
  universe,
  position,
  isHovered,
  isTransitioning,
  showLabel,
  onHover,
  onUnhover,
  onClick,
}: UniverseOrbProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetScale = isHovered ? 1.2 : 1.0;
  const targetY = isHovered ? position[1] + 0.5 : position[1];

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smooth scale animation
      const currentScale = groupRef.current.scale.x;
      groupRef.current.scale.setScalar(
        THREE.MathUtils.lerp(currentScale, targetScale, delta * 5)
      );

      // Smooth position animation
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        delta * 5
      );

      // Slow rotation
      if (!isTransitioning) {
        groupRef.current.rotation.y += delta * 0.2;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Render appropriate orb based on universe type */}
      {universe.type === "Canon" && (
        <CanonOrb
          isHovered={isHovered}
          onHover={onHover}
          onUnhover={onUnhover}
          onClick={onClick}
        />
      )}
      {universe.type === "Xen" && (
        <XenOrb
          isHovered={isHovered}
          onHover={onHover}
          onUnhover={onUnhover}
          onClick={onClick}
        />
      )}
      {universe.type === "Unformed" && (
        <NascentOrb
          isHovered={isHovered}
          onHover={onHover}
          onUnhover={onUnhover}
          onClick={onClick}
        />
      )}

      {/* UI Label */}
      {/* UI Label (HUD表示時のみ) */}
      {showLabel && (
        <Html position={[0, -2.5, 0]} center>
          <div
            className={`text-center transition-all duration-300 pointer-events-none ${isHovered ? "opacity-100 scale-110" : "opacity-70"
              }`}
          >
            <div
              className={`font-mono text-sm font-bold tracking-widest ${isHovered ? "text-white" : "text-gray-400"
                }`}
              style={{
                textShadow: isHovered
                  ? `0 0 20px ${universe.color}, 0 0 40px ${universe.color}`
                  : "none",
              }}
            >
              {universe.name}
            </div>
            <div className="text-[8px] text-gray-600 tracking-wider mt-1">
              {universe.type.toUpperCase()}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================
// ORB 1: CANON - Geometric Order (Glass with Grid)
// ============================================================

interface OrbProps {
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
}

function CanonOrb({ isHovered, onHover, onUnhover, onClick }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime() * (isHovered ? 2.0 : 1.0);
      (meshRef.current.material as any).uniforms.uTime.value = time;
    }

    if (glowRef.current) {
      const pulse = Math.sin(clock.getElapsedTime() * 2) * 0.5 + 0.5;
      glowRef.current.scale.setScalar(1.0 + pulse * 0.1);
    }
  });

  const canonMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFresnelPower: { value: 3.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uFresnelPower;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        void main() {
          // Fresnel edge glow
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), uFresnelPower);

          // Geometric grid lines
          vec3 gridPos = vPosition * 10.0 + uTime * 0.5;
          float gridX = abs(fract(gridPos.x) - 0.5) < 0.05 ? 1.0 : 0.0;
          float gridY = abs(fract(gridPos.y) - 0.5) < 0.05 ? 1.0 : 0.0;
          float gridZ = abs(fract(gridPos.z) - 0.5) < 0.05 ? 1.0 : 0.0;
          float grid = max(gridX, max(gridY, gridZ));

          // Glass base color
          vec3 baseColor = vec3(0.9, 0.95, 1.0);
          vec3 edgeColor = vec3(0.3, 0.6, 1.0);

          // Combine
          vec3 color = mix(baseColor, edgeColor, fresnel * 0.8);
          color += grid * vec3(0.5, 0.8, 1.0) * 0.5;

          float alpha = 0.3 + fresnel * 0.6 + grid * 0.3;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  return (
    <group>
      {/* Main transmission sphere */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onUnhover();
          document.body.style.cursor = "auto";
        }}
      >
        <icosahedronGeometry args={[2, 4]} />
        <MeshTransmissionMaterial
          backside
          backsideThickness={1.5}
          thickness={0.5}
          ior={1.8}
          chromaticAberration={0.15}
          anisotropy={0.5}
          distortion={0.2}
          distortionScale={0.5}
          temporalDistortion={0.1}
          transmission={1}
          roughness={0}
          metalness={0}
          color="#ffffff"
        />
      </mesh>

      {/* Grid overlay */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.05, 32, 32]} />
        <primitive object={canonMaterial} />
      </mesh>

      {/* Outer glow ring */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.3, 32, 32]} />
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// ORB 2: XEN - 液体金属 (レイマーチングSDF + フレンネル反射)
// ============================================================

/**
 * XenOrb - 混沌の宇宙を象徴する液体金属オーブ
 *
 * 特徴:
 * - レイマーチングベースのSDF（Signed Distance Function）変形
 * - フレンネル反射による外周の発光
 * - erosionパラメータによる表面粗さ・屈折率の動的制御
 * - カラーグラデーション: #1a0b2e（深紫） → #4a148c（鮮やかな紫）
 */
interface XenOrbProps extends OrbProps {
  erosion?: number; // 侵食度 0.0 - 1.0
}

function XenOrb({ isHovered, erosion = 0.8, onHover, onUnhover, onClick }: XenOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime() * (isHovered ? 2.5 : 1.0);
      const mat = meshRef.current.material as any;
      mat.uniforms.uTime.value = time;
      mat.uniforms.uErosion.value = erosion;
    }
    // 外周グローのパルス
    if (glowRef.current) {
      const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.15 + 0.85;
      glowRef.current.scale.setScalar(1.15 + pulse * 0.1);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + pulse * 0.1;
    }
  });

  const xenMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uErosion: { value: erosion },
        // カラーグラデーション: 深紫 → 鮮やかな紫
        uBaseColor: { value: new THREE.Color("#1a0b2e") },
        uHeatColor: { value: new THREE.Color("#4a148c") },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uErosion;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;

        // ============================================
        // Simplex Noise for SDF deformation
        // ============================================
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        // ============================================
        // SDF Sphere for Raymarching-style deformation
        // ============================================
        float sdSphere(vec3 p, float r) {
          return length(p) - r;
        }

        void main() {
          // 多層ノイズによるSDF変形（erosionに応じて強度変化）
          float noiseScale1 = 1.5 + uErosion * 0.5;
          float noiseScale2 = 3.0 + uErosion * 1.0;
          float noiseScale3 = 6.0 + uErosion * 2.0;

          float noise1 = snoise(position * noiseScale1 + uTime * 0.3);
          float noise2 = snoise(position * noiseScale2 - uTime * 0.4);
          float noise3 = snoise(position * noiseScale3 + uTime * 0.2);

          // erosionが高いほど変形が激しくなる
          float deformAmount = 0.1 + uErosion * 0.15;
          float deform = noise1 * deformAmount + noise2 * (deformAmount * 0.6) + noise3 * (deformAmount * 0.3);

          vec3 deformed = position + normal * deform;

          // 法線の再計算（より正確な反射のため）
          float eps = 0.01;
          vec3 n1 = normalize(normal);
          float d1 = snoise((position + n1 * eps) * noiseScale1 + uTime * 0.3);
          float d2 = snoise((position - n1 * eps) * noiseScale1 + uTime * 0.3);
          vec3 perturbedNormal = normalize(normal + (d1 - d2) * 0.5 * normal);

          vNormal = normalize(normalMatrix * perturbedNormal);
          vPosition = deformed;
          vWorldPosition = (modelMatrix * vec4(deformed, 1.0)).xyz;
          vec4 mvPosition = modelViewMatrix * vec4(deformed, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uErosion;
        uniform vec3 uBaseColor;
        uniform vec3 uHeatColor;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;

        // ============================================
        // Domain Warping for Liquid Metal Flow
        // ============================================
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        float fbm(vec2 p) {
          float f = 0.0;
          f += 0.5 * noise(p); p *= 2.02;
          f += 0.25 * noise(p); p *= 2.03;
          f += 0.125 * noise(p); p *= 2.01;
          f += 0.0625 * noise(p);
          return f / 0.9375;
        }

        // ============================================
        // Fresnel Effect - 外周発光
        // ============================================
        float fresnelSchlick(float cosTheta, float F0) {
          return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
        }

        void main() {
          vec3 viewDir = normalize(vViewPosition);
          vec3 norm = normalize(vNormal);

          // フレンネル反射 - 外周ほど強く発光
          float cosTheta = max(dot(viewDir, norm), 0.0);
          float fresnel = fresnelSchlick(cosTheta, 0.04);
          float fresnelGlow = pow(1.0 - cosTheta, 3.0);

          // ============================================
          // 液体金属カラーフロー (Domain Warping)
          // ============================================
          vec2 uv = vPosition.xy * 1.5 + vPosition.z * 0.5;

          // 多層ドメインワーピング
          vec2 q = vec2(
            fbm(uv + uTime * 0.15),
            fbm(uv + vec2(5.2, 1.3) - uTime * 0.12)
          );

          vec2 r = vec2(
            fbm(uv + q * 4.0 + vec2(1.7, 9.2) + uTime * 0.08),
            fbm(uv + q * 4.0 + vec2(8.3, 2.8) - uTime * 0.1)
          );

          float f = fbm(uv + r * 3.0);

          // ============================================
          // カラーグラデーション (#1a0b2e → #4a148c)
          // ============================================
          // 座標に基づくグラデーション
          float gradientFactor = (vPosition.y + 2.0) / 4.0; // -2 to 2 → 0 to 1
          vec3 baseGradient = mix(uBaseColor, uHeatColor, gradientFactor);

          // 液体金属の虹色効果
          vec3 iridescentMagenta = vec3(0.9, 0.2, 0.9);
          vec3 iridescentCyan = vec3(0.2, 0.9, 0.9);
          vec3 iridescentGold = vec3(0.95, 0.75, 0.3);

          vec3 iridescent = mix(iridescentMagenta, iridescentCyan, f);
          iridescent = mix(iridescent, iridescentGold, r.x * 0.5);

          // erosionに応じてベースカラーと虹色をミックス
          vec3 surfaceColor = mix(baseGradient, iridescent, 0.3 + uErosion * 0.4);

          // ============================================
          // 表面粗さと屈折率の動的制御
          // ============================================
          // erosionが高いほど粗さが減少（より滑らかに）
          float roughness = max(0.05, 0.4 - uErosion * 0.35);

          // 環境反射のシミュレーション
          vec3 reflectDir = reflect(-viewDir, norm);
          float envReflection = pow(max(reflectDir.y * 0.5 + 0.5, 0.0), 2.0);

          // erosionが高いほど屈折が歪む
          float distortion = sin(uTime * 2.0 + f * 6.28) * uErosion * 0.1;
          vec3 distortedReflect = normalize(reflectDir + vec3(distortion, distortion * 0.5, -distortion));

          // 最終カラー計算
          vec3 finalColor = surfaceColor;

          // メタリック反射
          finalColor += envReflection * mix(vec3(0.5), iridescentCyan, fresnel) * (1.0 - roughness);

          // フレンネルエッジグロー（深宇宙との境界発光）
          vec3 edgeGlow = mix(vec3(0.8, 0.4, 1.0), vec3(0.4, 0.9, 1.0), sin(uTime) * 0.5 + 0.5);
          finalColor += fresnelGlow * edgeGlow * (0.8 + uErosion * 0.5);

          // 内部発光
          float innerGlow = smoothstep(0.3, 0.0, length(vPosition.xy) / 2.0);
          finalColor += innerGlow * uHeatColor * 0.3;

          gl_FragColor = vec4(finalColor, 0.97);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [erosion]);

  return (
    <group>
      {/* メイン液体金属球 */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onUnhover();
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[2, 128, 128]} />
        <primitive object={xenMaterial} />
      </mesh>

      {/* フレンネルグロー外殻 */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.3, 32, 32]} />
        <meshBasicMaterial
          color="#8844ff"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// ORB 3: NASCENT - Smoky Unformed (Layered Clouds)
// ============================================================

function NascentOrb({ isHovered, onHover, onUnhover, onClick }: OrbProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * (isHovered ? 2.0 : 1.0);

    if (groupRef.current) {
      (groupRef.current.children as THREE.Mesh[]).forEach((child, i) => {
        if (child.material && "uniforms" in child.material) {
          (child.material as any).uniforms.uTime.value = time + i * 0.5;
        }
      });
    }

    if (coreRef.current) {
      const pulse = Math.sin(clock.getElapsedTime() * 2) * 0.3 + 0.7;
      (coreRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  const cloudMaterial = (offset: number) =>
    useMemo(() => {
      return new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: offset },
          uOpacity: { value: 0.15 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vViewPosition;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uOpacity;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vViewPosition;

          // Simple 3D noise
          float hash(vec3 p) {
            p = fract(p * 0.3183099 + 0.1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }

          float noise(vec3 x) {
            vec3 i = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                  mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
              mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                  mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
            );
          }

          void main() {
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);

            // Swirling cloud noise
            vec3 noisePos = vPosition * 2.0 + vec3(uTime * 0.1, uTime * 0.15, uTime * 0.08);
            float n = noise(noisePos);
            n += noise(noisePos * 2.0) * 0.5;
            n += noise(noisePos * 4.0) * 0.25;
            n /= 1.75;

            // White smoky color
            vec3 color = vec3(1.0, 1.0, 1.0);
            float alpha = n * uOpacity + fresnel * 0.3;

            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    }, [offset]);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onUnhover();
        document.body.style.cursor = "auto";
      }}
    >
      {/* Core pulsing light */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>

      {/* Layered cloud spheres */}
      <group ref={groupRef}>
        {[1.2, 1.6, 2.0, 2.4].map((scale, i) => (
          <mesh key={i}>
            <sphereGeometry args={[scale, 32, 32]} />
            <primitive object={cloudMaterial(i * 2)} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
