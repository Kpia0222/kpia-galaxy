"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RandomLCG } from "../../utils/random";

interface NascentCoreProps {
  position: [number, number, number];
  tendency: number; // 0.0 (Order/White) to 1.0 (Chaos/Purple)
}

export default function NascentCore({ position, tendency }: NascentCoreProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const gasRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Prismatic shader material for the core
  const coreMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTendency: { value: tendency },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uTendency;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

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

        // Rainbow prismatic effect
        vec3 getPrismaticColor(float noise, float tendency) {
          // Base rainbow cycling
          float hue = mod(noise * 3.0 + uTime * 0.2, 1.0);

          // Order (white) to Chaos (acid purple) transition
          vec3 orderColor = vec3(1.0); // Pure white
          vec3 chaosColor = vec3(0.74, 0.0, 1.0); // #bc00ff acid purple

          vec3 rainbow;
          if (hue < 0.166) {
            rainbow = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), hue * 6.0);
          } else if (hue < 0.333) {
            rainbow = mix(vec3(1.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0), (hue - 0.166) * 6.0);
          } else if (hue < 0.5) {
            rainbow = mix(vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 1.0), (hue - 0.333) * 6.0);
          } else if (hue < 0.666) {
            rainbow = mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 0.0, 1.0), (hue - 0.5) * 6.0);
          } else if (hue < 0.833) {
            rainbow = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 1.0), (hue - 0.666) * 6.0);
          } else {
            rainbow = mix(vec3(1.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), (hue - 0.833) * 6.0);
          }

          // Mix rainbow with tendency-based color
          vec3 tendencyColor = mix(orderColor, chaosColor, tendency);
          return mix(rainbow, tendencyColor, tendency * 0.7);
        }

        void main() {
          // Multi-layered noise for prismatic shimmer
          float noise1 = snoise(vPosition * 2.0 + uTime * 0.3);
          float noise2 = snoise(vPosition * 4.0 - uTime * 0.5);
          float noise3 = snoise(vPosition * 8.0 + uTime * 0.7);

          float combinedNoise = (noise1 + noise2 * 0.5 + noise3 * 0.25) / 1.75;

          // Pulsing intensity based on tendency
          float pulse = sin(uTime * 2.0 + combinedNoise * 3.14159) * 0.5 + 0.5;
          float instability = mix(0.1, 0.8, uTendency);
          float brightness = 1.0 + pulse * instability;

          // Fresnel effect for edge glow
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

          vec3 color = getPrismaticColor(combinedNoise, uTendency);
          color *= brightness;
          color += fresnel * 0.5;

          // Soft edges for "unformed" appearance
          float alpha = 0.85 + fresnel * 0.15;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Gas cloud particles with noise texture distortion
  const gasGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const rng = new RandomLCG(position[0] + position[1] + position[2]); // 位置に基づくシード

    for (let i = 0; i < count; i++) {
      // Spherical distribution with noise
      const theta = rng.next() * Math.PI * 2;
      const phi = Math.acos(rng.next() * 2 - 1);
      const radius = 15 + rng.next() * 20;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Prismatic colors
      const hue = rng.next();
      const r = Math.abs(Math.sin(hue * Math.PI * 2));
      const g = Math.abs(Math.sin((hue + 0.33) * Math.PI * 2));
      const b = Math.abs(Math.sin((hue + 0.66) * Math.PI * 2));

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return geo;
  }, [position]);

  // Animation loop
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (coreRef.current) {
      // Rotate the core slowly
      coreRef.current.rotation.y = time * 0.1;
      coreRef.current.rotation.z = time * 0.05;

      // Update shader uniform
      (coreRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      (coreRef.current.material as THREE.ShaderMaterial).uniforms.uTendency.value = tendency;
    }

    if (gasRef.current) {
      // Animate gas cloud
      gasRef.current.rotation.y = time * 0.05;
      gasRef.current.rotation.x = time * 0.03;

      // Pulse effect on gas
      const scale = 1.0 + Math.sin(time * 0.8) * 0.1 * tendency;
      gasRef.current.scale.setScalar(scale);
    }

    if (glowRef.current) {
      // Outer glow pulse
      const glowScale = 1.0 + Math.sin(time * 1.5) * 0.15;
      glowRef.current.scale.setScalar(glowScale);
    }
  });

  return (
    <group position={position}>
      {/* Core prismatic sphere */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[12, 4]} />
        <primitive object={coreMaterial} />
      </mesh>

      {/* Gas cloud particles */}
      <points ref={gasRef} geometry={gasGeometry}>
        <pointsMaterial
          size={0.8}
          vertexColors
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[18, 32, 32]} />
        <meshBasicMaterial
          color={tendency > 0.5 ? "#bc00ff" : "#ffffff"}
          transparent
          opacity={0.1 + tendency * 0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Rotating ring particles (orbiting debris) */}
      {Array.from({ length: 3 }).map((_, ringIndex) => (
        <group
          key={ringIndex}
          rotation={[
            Math.PI / 2 + (ringIndex * Math.PI) / 6,
            ringIndex * 0.5,
            0,
          ]}
        >
          <mesh>
            <torusGeometry args={[20 + ringIndex * 5, 0.3, 8, 64]} />
            <meshBasicMaterial
              color={ringIndex % 2 === 0 ? "#ffffff" : "#bc00ff"}
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
