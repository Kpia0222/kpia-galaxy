"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface GravityQuakeProps {
  epicenter: THREE.Vector3;
  maxRadius: number;
  strength: number;
  onComplete?: () => void;
}

export default function GravityQuake({ epicenter, maxRadius, strength, onComplete }: GravityQuakeProps) {
  const radiusRef = useRef(0);
  const { camera } = useThree();
  const initialCameraPos = useRef(camera.position.clone());
  const shakeIntensity = useRef(strength * 10);

  useEffect(() => {
    initialCameraPos.current.copy(camera.position);
    radiusRef.current = 0;
  }, [camera]);

  useFrame((state, delta) => {
    // Expand shockwave radius
    radiusRef.current += delta * 200 * strength;

    // Camera shake
    if (radiusRef.current < maxRadius) {
      const shakeDecay = 1 - (radiusRef.current / maxRadius);
      const shake = shakeIntensity.current * shakeDecay;

      camera.position.x = initialCameraPos.current.x + (Math.random() - 0.5) * shake;
      camera.position.y = initialCameraPos.current.y + (Math.random() - 0.5) * shake;
      camera.position.z = initialCameraPos.current.z + (Math.random() - 0.5) * shake;

      camera.lookAt(epicenter);
    } else {
      // Restore camera position smoothly
      camera.position.lerp(initialCameraPos.current, 0.1);

      if (camera.position.distanceTo(initialCameraPos.current) < 0.1) {
        onComplete?.();
      }
    }
  });

  // Shockwave visualization
  return (
    <mesh position={epicenter}>
      <ringGeometry args={[Math.max(0, radiusRef.current - 5), radiusRef.current, 64]} />
      <meshBasicMaterial
        color="#ff4400"
        transparent
        opacity={Math.max(0, 1 - radiusRef.current / maxRadius)}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Context provider for gravity quake effects
export function useGravityQuakeOffset(position: THREE.Vector3, quakes: Array<{ epicenter: THREE.Vector3; radius: number; strength: number }>): THREE.Vector3 {
  const offset = new THREE.Vector3(0, 0, 0);

  quakes.forEach((quake) => {
    const distance = position.distanceTo(quake.epicenter);

    if (distance < quake.radius) {
      // Calculate wave effect (sine wave pattern)
      const waveProgress = distance / quake.radius;
      const waveAmplitude = Math.sin(waveProgress * Math.PI * 4) * quake.strength;

      // Direction from epicenter
      const direction = new THREE.Vector3()
        .subVectors(position, quake.epicenter)
        .normalize();

      // Apply offset
      const magnitude = waveAmplitude * (1 - waveProgress) * 5;
      offset.add(direction.multiplyScalar(magnitude));
    }
  });

  return offset;
}
