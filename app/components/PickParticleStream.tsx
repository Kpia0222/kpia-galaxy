"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

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
  const { positions, velocities } = React.useMemo(() => {
    const posArray = new Float32Array(particleCount * 3);
    const velArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const t = i / particleCount;

      // Start position with some spread
      posArray[i3] = startPos.x + (Math.random() - 0.5) * 5;
      posArray[i3 + 1] = startPos.y + (Math.random() - 0.5) * 5;
      posArray[i3 + 2] = startPos.z + (Math.random() - 0.5) * 5;

      // Calculate velocity vector toward end position
      const direction = new THREE.Vector3()
        .subVectors(endPos, startPos)
        .normalize();

      velArray[i3] = direction.x;
      velArray[i3 + 1] = direction.y;
      velArray[i3 + 2] = direction.z;
    }

    return { positions: posArray, velocities: velArray };
  }, [startPos, endPos]);

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
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
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
