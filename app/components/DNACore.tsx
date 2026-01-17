"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Billboard, Text } from "@react-three/drei";

interface DNACoreProps {
  position: [number, number, number];
  erosion?: number;
  isMultiverseView?: boolean;
}

export default function DNACore({ position, erosion = 0, isMultiverseView = false }: DNACoreProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points[]>([]);

  // DNA parameters
  const helixHeight = 50;
  const helixRadius = 8;
  const turns = 5;
  const pointsPerStrand = 200;

  // Animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;

      // Pulsate effect based on erosion
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.05 * (1 + erosion);
      groupRef.current.scale.set(scale, scale, scale);
    }

    // Animate individual points
    pointsRef.current.forEach((points, index) => {
      if (points && points.geometry.attributes.position) {
        const positions = points.geometry.attributes.position.array as Float32Array;
        const t = state.clock.getElapsedTime();

        for (let i = 0; i < positions.length; i += 3) {
          const offset = Math.sin(t * 2 + i * 0.1) * 0.1;
          positions[i] += offset * erosion; // X distortion with erosion
        }

        points.geometry.attributes.position.needsUpdate = true;
      }
    });
  });

  // Generate DNA helix geometry
  const generateHelixPoints = (strand: number): Float32Array => {
    const positions = new Float32Array(pointsPerStrand * 3);

    for (let i = 0; i < pointsPerStrand; i++) {
      const t = (i / pointsPerStrand) * turns * Math.PI * 2;
      const y = (i / pointsPerStrand) * helixHeight - helixHeight / 2;

      // Offset second strand by PI
      const angle = t + (strand === 1 ? Math.PI : 0);

      positions[i * 3] = Math.cos(angle) * helixRadius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * helixRadius;
    }

    return positions;
  };

  return (
    <group ref={groupRef} position={position}>
      {/* DNA Strands */}
      {[0, 1].map((strand) => {
        const positions = generateHelixPoints(strand);
        const color = strand === 0 ? "#ff00ff" : "#00ffff";

        return (
          <points
            key={strand}
            ref={(el) => {
              if (el) pointsRef.current[strand] = el;
            }}
          >
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={pointsPerStrand}
                array={positions}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              size={isMultiverseView ? 1.2 : 0.8}
              color={color}
              transparent
              opacity={isMultiverseView ? 1.0 : 0.8}
              sizeAttenuation={true}
              blending={THREE.AdditiveBlending}
            />
          </points>
        );
      })}

      {/* Connecting rungs */}
      {Array.from({ length: 20 }).map((_, i) => {
        const t = (i / 20) * turns * Math.PI * 2;
        const y = (i / 20) * helixHeight - helixHeight / 2;

        const x1 = Math.cos(t) * helixRadius;
        const z1 = Math.sin(t) * helixRadius;
        const x2 = Math.cos(t + Math.PI) * helixRadius;
        const z2 = Math.sin(t + Math.PI) * helixRadius;

        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([x1, y, z1, x2, y, z2])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#ff4400"
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
            />
          </line>
        );
      })}

      {/* Central glow sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[helixRadius * (isMultiverseView ? 0.5 : 0.3), 16, 16]} />
        <meshBasicMaterial
          color={isMultiverseView ? "#ff00ff" : "#ffffff"}
          transparent
          opacity={isMultiverseView ? 0.4 : 0.1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Extra glow ring in multiverse view */}
      {isMultiverseView && (
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[helixRadius * 1.5, helixRadius * 2, 32]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Label */}
      <Billboard position={[0, helixHeight / 2 + 5, 0]}>
        <Text
          fontSize={2}
          color="#ff00ff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#000000"
        >
          DNA_CORE
        </Text>
        <Text
          position={[0, -3, 0]}
          fontSize={1}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
        >
          GUARDIAN_OF_FREEDOM
        </Text>
      </Billboard>

      {/* Particle field around DNA */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={500}
            array={new Float32Array(
              Array.from({ length: 500 * 3 }, () => (Math.random() - 0.5) * helixRadius * 4)
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.3}
          color="#ff00ff"
          transparent
          opacity={0.3}
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
}
