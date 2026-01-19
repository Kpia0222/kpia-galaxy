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
}

export default function MultiverseGateView({
  universes,
  onSelectUniverse,
  currentUniverseId,
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
            onHover={() => setHoveredId(universe.id)}
            onUnhover={() => setHoveredId(null)}
            onClick={() => handleOrbClick(universe.id)}
          />
        ))}
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
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
}

function UniverseOrb({
  universe,
  position,
  isHovered,
  isTransitioning,
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
      <Html position={[0, -2.5, 0]} center>
        <div
          className={`text-center transition-all duration-300 pointer-events-none ${
            isHovered ? "opacity-100 scale-110" : "opacity-70"
          }`}
        >
          <div
            className={`font-mono text-sm font-bold tracking-widest ${
              isHovered ? "text-white" : "text-gray-400"
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
// ORB 2: XEN - Liquid Metal Chaos (Iridescent Wobble)
// ============================================================

function XenOrb({ isHovered, onHover, onUnhover, onClick }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime() * (isHovered ? 3.0 : 1.0);
      (meshRef.current.material as any).uniforms.uTime.value = time;
    }
  });

  const xenMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        // Simplex noise function (simplified)
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

        void main() {
          // Wobble deformation
          float noise1 = snoise(position * 1.5 + uTime * 0.3);
          float noise2 = snoise(position * 3.0 - uTime * 0.4);
          vec3 deformed = position + normal * (noise1 * 0.15 + noise2 * 0.08);

          vNormal = normalize(normalMatrix * normal);
          vPosition = deformed;
          vec4 mvPosition = modelViewMatrix * vec4(deformed, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;

        // Domain warping for liquid metal effect
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

        vec3 hueShift(vec3 color, float shift) {
          const vec3 k = vec3(0.57735, 0.57735, 0.57735);
          float cosAngle = cos(shift);
          return vec3(color * cosAngle + cross(k, color) * sin(shift) + k * dot(k, color) * (1.0 - cosAngle));
        }

        void main() {
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.5);

          // Liquid metal color flow (domain warping)
          vec2 uv = vPosition.xy + vPosition.z * 0.5;
          vec2 q = vec2(noise(uv + uTime * 0.3), noise(uv + vec2(5.2, 1.3) - uTime * 0.25));
          vec2 r = vec2(noise(uv + q * 2.0 + uTime * 0.1), noise(uv + q * 2.0 - uTime * 0.15));
          float f = noise(uv + r * 3.0);

          // Iridescent colors
          vec3 color1 = vec3(1.0, 0.0, 1.0); // Magenta
          vec3 color2 = vec3(0.0, 1.0, 1.0); // Cyan
          vec3 color3 = vec3(1.0, 0.5, 0.0); // Orange

          vec3 mixedColor = mix(color1, color2, f);
          mixedColor = mix(mixedColor, color3, r.x);

          // Hue shift over time
          mixedColor = hueShift(mixedColor, uTime * 0.5);

          // Apply fresnel edge glow
          vec3 finalColor = mixedColor + fresnel * vec3(1.0, 1.0, 1.0) * 0.8;

          gl_FragColor = vec4(finalColor, 0.95);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  return (
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
      <sphereGeometry args={[2, 64, 64]} />
      <primitive object={xenMaterial} />
    </mesh>
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
