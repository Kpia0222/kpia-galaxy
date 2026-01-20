"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text, Html } from "@react-three/drei";

interface Universe {
  id: number;
  name: string;
  type: "Canon" | "Xen" | "Lab" | "Unformed";
  baseCoord: [number, number, number];
  erosion: number;
  tendency: number;
  color: string;
  starCount: number;
}

interface MultiverseHubProps {
  universes: Universe[];
  onSelectUniverse: (id: number) => void;
  currentUniverseId: number | null;
}

export default function MultiverseHub({
  universes,
  onSelectUniverse,
  currentUniverseId,
}: MultiverseHubProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredId, setHoveredId] = React.useState<number | null>(null);

  // Calculate positions on a circular mandala pattern
  const universePositions = useMemo(() => {
    const radius = 150;
    return universes.map((universe, index) => {
      const angle = (index / universes.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return { ...universe, position: [x, 0, z] as [number, number, number] };
    });
  }, [universes]);

  // Rotate mandala slowly
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central mandala geometry */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        <ringGeometry args={[120, 180, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Gravity web lines connecting universes */}
      {universePositions.map((universe, i) => {
        return universePositions.slice(i + 1).map((otherUniverse, j) => {
          const points = [
            new THREE.Vector3(...universe.position),
            new THREE.Vector3(...otherUniverse.position),
          ];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);

          return (
            <line key={`web-${i}-${j}`}>
              <bufferGeometry attach="geometry" {...geometry} />
              <lineBasicMaterial
                attach="material"
                color="#00ffff"
                transparent
                opacity={0.15}
                blending={THREE.AdditiveBlending}
              />
            </line>
          );
        });
      })}

      {/* Universe miniatures */}
      {universePositions.map((universe) => (
        <UniverseMiniature
          key={universe.id}
          universe={universe}
          position={universe.position}
          isHovered={hoveredId === universe.id}
          isCurrent={currentUniverseId === universe.id}
          onHover={() => setHoveredId(universe.id)}
          onUnhover={() => setHoveredId(null)}
          onClick={() => onSelectUniverse(universe.id)}
        />
      ))}

      {/* Central core light */}
      <pointLight position={[0, 0, 0]} intensity={50} color="#ffffff" distance={300} />
    </group>
  );
}

interface UniverseMiniatureProps {
  universe: Universe & { position: [number, number, number] };
  position: [number, number, number];
  isHovered: boolean;
  isCurrent: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
}

function UniverseMiniature({
  universe,
  position,
  isHovered,
  isCurrent,
  onHover,
  onUnhover,
  onClick,
}: UniverseMiniatureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const starsRef = useRef<THREE.Points>(null);

  // Generate miniature star field
  const starsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(universe.starCount * 3);
    const colors = new Float32Array(universe.starCount * 3);

    for (let i = 0; i < universe.starCount; i++) {
      // Spherical distribution
      const radius = 5 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = new THREE.Color(universe.color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return geometry;
  }, [universe]);

  // Rotate miniature
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;

      // Hover pulse effect
      if (isHovered) {
        const scale = 1.0 + Math.sin(clock.getElapsedTime() * 5) * 0.1;
        groupRef.current.scale.setScalar(scale);
      } else if (isCurrent) {
        const scale = 1.2 + Math.sin(clock.getElapsedTime() * 2) * 0.05;
        groupRef.current.scale.setScalar(scale);
      } else {
        groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }

    if (starsRef.current) {
      starsRef.current.rotation.y -= 0.005;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Miniature stars */}
      <points ref={starsRef} geometry={starsGeometry}>
        <pointsMaterial
          size={0.3}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Outer sphere */}
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
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial
          color={universe.color}
          transparent
          opacity={isHovered ? 0.3 : isCurrent ? 0.2 : 0.1}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Holographic info display on hover */}
      {isHovered && (
        <Html position={[0, 20, 0]} center>
          <div className="bg-black/80 border border-cyan-400 px-3 py-2 rounded backdrop-blur-sm pointer-events-none">
            <div className="text-cyan-400 text-sm font-mono font-bold mb-1">
              {universe.name}
            </div>
            <div className="text-white/70 text-xs font-mono space-y-0.5">
              <div>TYPE: {universe.type}</div>
              <div>EROSION: {(universe.erosion * 100).toFixed(1)}%</div>
              <div>TENDENCY: {(universe.tendency * 100).toFixed(1)}%</div>
              <div className="text-cyan-300 mt-1">[ CLICK TO WARP ]</div>
            </div>
          </div>
        </Html>
      )}

      {/* Universe label */}
      <Text
        position={[0, -20, 0]}
        fontSize={2}
        color={isCurrent ? universe.color : "#ffffff"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.2}
        outlineColor="#000000"
      >
        {universe.name}
      </Text>

      {/* Current universe indicator */}
      {isCurrent && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[17, 18, 32]} />
            <meshBasicMaterial
              color={universe.color}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <pointLight position={[0, 0, 0]} intensity={20} color={universe.color} distance={50} />
        </>
      )}
    </group>
  );
}
