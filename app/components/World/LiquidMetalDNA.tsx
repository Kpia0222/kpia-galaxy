import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function LiquidMetalDNA({ onClick, erosion = 0.2 }: { onClick: () => void, erosion?: number }) {
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
