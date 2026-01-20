"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RandomLCG } from "../../utils/random";

interface DeepSpaceNebulaProps {
  count?: number;
  radius?: number;
  erosion?: number;
}

export default function DeepSpaceNebula({ count = 5000, radius = 2000, erosion = 0 }: DeepSpaceNebulaProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate nebula positions with Perlin-like clustering
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const posArray = new Float32Array(count * 3);
    const colArray = new Float32Array(count * 3);
    const rng = new RandomLCG(42);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Create clusters using spherical coordinates with noise
      const theta = rng.next() * Math.PI * 2;
      const phi = Math.acos(2 * rng.next() - 1);
      const r = radius * (0.5 + rng.next() * 0.5);

      // Add clustering effect
      const clusterX = Math.sin(theta * 3) * 500;
      const clusterY = Math.cos(phi * 2) * 300;
      const clusterZ = Math.sin(theta * 2 + phi) * 500;

      posArray[i3] = Math.sin(phi) * Math.cos(theta) * r + clusterX;
      posArray[i3 + 1] = Math.sin(phi) * Math.sin(theta) * r + clusterY;
      posArray[i3 + 2] = Math.cos(phi) * r + clusterZ;

      // Color based on position (cyan to purple gradient)
      const colorMix = Math.abs(Math.sin(theta * 2 + phi));
      colArray[i3] = colorMix * 0.2 + 0.1; // R
      colArray[i3 + 1] = 0.5 + colorMix * 0.3; // G (cyan to purple)
      colArray[i3 + 2] = 0.8 + colorMix * 0.2; // B
    }

    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));

    return geo;
  }, [count, radius]);

  // Gentle rotation and pulsation
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.01;
      pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.02) * 0.1;

      // Pulsate based on erosion
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05 * erosion;
      pointsRef.current.scale.setScalar(scale);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={2}
        vertexColors
        transparent
        opacity={0.15}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
