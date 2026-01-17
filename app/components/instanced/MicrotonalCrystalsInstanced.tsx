"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MicrotonalCrystalsInstancedProps {
  amount: number;
  color: string;
  baseScale?: number;
  speed?: number;
  parentPosition?: THREE.Vector3;
}

export default function MicrotonalCrystalsInstanced({
  amount,
  color,
  baseScale = 1.5,
  speed = 2.0,
  parentPosition = new THREE.Vector3(0, 0, 0)
}: MicrotonalCrystalsInstancedProps) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const crystalCount = Math.floor(amount * 16);

  // Shared geometry (memory efficient)
  const coneGeometry = useMemo(() => {
    return new THREE.ConeGeometry(0.5, 2, 4);
  }, []);

  // Custom shader material for GPU-based animation
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAmount: { value: amount },
        uBaseScale: { value: baseScale },
        uSpeed: { value: speed },
        uColor: { value: new THREE.Color(color) }
      },
      vertexShader: `
        attribute vec3 instanceLocalOffset;
        attribute float instanceRotationPhase;
        attribute float instancePulseSpeed;
        attribute float instanceScale;

        uniform float uTime;
        uniform float uAmount;
        uniform float uBaseScale;
        uniform float uSpeed;

        varying vec3 vPosition;
        varying float vIntensity;

        // Rotation helpers
        mat3 rotateX(float angle) {
          float c = cos(angle);
          float s = sin(angle);
          return mat3(
            1.0, 0.0, 0.0,
            0.0, c, -s,
            0.0, s, c
          );
        }

        mat3 rotateY(float angle) {
          float c = cos(angle);
          float s = sin(angle);
          return mat3(
            c, 0.0, s,
            0.0, 1.0, 0.0,
            -s, 0.0, c
          );
        }

        void main() {
          // Pulse animation (GPU-based)
          float pulse = sin(uTime * uSpeed * instancePulseSpeed) * 0.2 + 1.0;

          // Intense erosion boost
          if (uAmount >= 0.95) {
            pulse *= 1.5;
          }

          vIntensity = pulse;

          // Rotation animation (GPU-based)
          vec3 rotated = position;
          rotated = rotateX(uTime * 0.01 + instanceRotationPhase) * rotated;
          rotated = rotateY(uTime * 0.02 + instanceRotationPhase * 0.5) * rotated;

          // Apply scale
          vec3 scaled = rotated * uBaseScale * instanceScale * pulse;

          // Final world position
          vec3 worldPos = instanceLocalOffset + scaled;

          vPosition = worldPos;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uAmount;

        varying vec3 vPosition;
        varying float vIntensity;

        void main() {
          // Base color with intensity variation
          vec3 finalColor = uColor * (0.8 + vIntensity * 0.2);

          // Erosion glow effect
          if (uAmount >= 0.9) {
            finalColor += vec3(0.2, 0.0, 0.2) * (uAmount - 0.9) * 10.0;
          }

          // Edge fade
          float edgeFade = 1.0 - pow(abs(vPosition.y / 2.0), 2.0);

          gl_FragColor = vec4(finalColor, edgeFade * 0.9);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, [amount, baseScale, speed, color]);

  // Setup instance attributes
  useEffect(() => {
    if (!instancedMeshRef.current) return;

    const mesh = instancedMeshRef.current;
    const localOffsets = new Float32Array(crystalCount * 3);
    const rotationPhases = new Float32Array(crystalCount);
    const pulseSpeeds = new Float32Array(crystalCount);
    const scales = new Float32Array(crystalCount);

    // Generate random positions around parent
    for (let i = 0; i < crystalCount; i++) {
      const i3 = i * 3;

      // Random spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 15 + Math.random() * 10;

      localOffsets[i3] = parentPosition.x + Math.sin(phi) * Math.cos(theta) * radius;
      localOffsets[i3 + 1] = parentPosition.y + Math.sin(phi) * Math.sin(theta) * radius;
      localOffsets[i3 + 2] = parentPosition.z + Math.cos(phi) * radius;

      // Random animation parameters
      rotationPhases[i] = Math.random() * Math.PI * 2;
      pulseSpeeds[i] = 0.8 + Math.random() * 0.4;
      scales[i] = 0.7 + Math.random() * 0.6;

      // Set identity matrix (transformation in shader)
      const matrix = new THREE.Matrix4();
      mesh.setMatrixAt(i, matrix);
    }

    // Set custom attributes
    mesh.geometry.setAttribute('instanceLocalOffset',
      new THREE.InstancedBufferAttribute(localOffsets, 3));
    mesh.geometry.setAttribute('instanceRotationPhase',
      new THREE.InstancedBufferAttribute(rotationPhases, 1));
    mesh.geometry.setAttribute('instancePulseSpeed',
      new THREE.InstancedBufferAttribute(pulseSpeeds, 1));
    mesh.geometry.setAttribute('instanceScale',
      new THREE.InstancedBufferAttribute(scales, 1));

    mesh.instanceMatrix.needsUpdate = true;
  }, [crystalCount, parentPosition]);

  // Only update time uniform per frame (not 1,280 matrices!)
  useFrame(({ clock }) => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = clock.getElapsedTime();
      shaderMaterial.uniforms.uAmount.value = amount;
      shaderMaterial.uniforms.uColor.value.set(color);
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      coneGeometry.dispose();
      shaderMaterial.dispose();
    };
  }, [coneGeometry, shaderMaterial]);

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[coneGeometry, shaderMaterial, crystalCount]}
      frustumCulled={false}
    />
  );
}
