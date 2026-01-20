"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RandomLCG } from "../../utils/random";

interface PickParticleStreamProps {
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  color: string;
  onComplete: () => void;
}

export default function PickParticleStream({ startPos, endPos, color, onComplete }: PickParticleStreamProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const progressRef = useRef(0);
  const particleCount = 50;

  // Generate particles along the path
  const { geometry, velocities } = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const velArray = new Float32Array(particleCount * 3);
    const rng = new RandomLCG(12345); // 固定シードで純粋性を確保

    // 事前にランダムオフセット
    const offsets = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      offsets[i] = rng.range(-2.5, 2.5);
    }

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const t = i / particleCount;

      // Start position with some spread
      posArray[i3] = startPos.x + offsets[i3];
      posArray[i3 + 1] = startPos.y + offsets[i3 + 1];
      posArray[i3 + 2] = startPos.z + offsets[i3 + 2];

      // Calculate velocity vector toward end position
      const direction = new THREE.Vector3()
        .subVectors(endPos, startPos)
        .normalize();

      velArray[i3] = direction.x;
      velArray[i3 + 1] = direction.y;
      velArray[i3 + 2] = direction.z;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    return { geometry: geo, velocities: velArray };
  }, [startPos, endPos, particleCount]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    progressRef.current += delta * 3; // Speed multiplier

    const posAttribute = pointsRef.current.geometry.attributes.position;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const t = progressRef.current;

      // Move particle toward end position
      posAttribute.array[i3] += velocities[i3] * delta * 200;
      posAttribute.array[i3 + 1] += velocities[i3 + 1] * delta * 200;
      posAttribute.array[i3 + 2] += velocities[i3 + 2] * delta * 200;

      // Add spiral motion
      const spiral = Math.sin(t * 10 + i * 0.5) * 2;
      posAttribute.array[i3] += spiral * delta * 10;
      posAttribute.array[i3 + 2] += Math.cos(t * 10 + i * 0.5) * 2 * delta * 10;
    }

    posAttribute.needsUpdate = true;

    // Fade out material
    if (pointsRef.current.material instanceof THREE.PointsMaterial) {
      pointsRef.current.material.opacity = Math.max(0, 1 - progressRef.current * 0.5);
    }

    // Complete when particles reach destination
    if (progressRef.current > 2) {
      onComplete();
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={1.5}
        color={color}
        transparent
        opacity={1}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
