"use client";

import React, { useRef, useMemo, useContext } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Billboard, Text } from "@react-three/drei";
import { Suspense } from "react";

interface NascentStarProps {
  data: any; // EntityData
  offset: [number, number, number];
  tendency: number; // 0.0 (Order/White) to 1.0 (Chaos/Purple)
  focusId: string | null;
  onSelect: (id: string) => void;
  hoverCtx: any;
}

// OrbitGroup component for orbital motion
function OrbitGroup({ data, offset, children }: { data: any; offset: [number, number, number]; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * data.speed + data.phase;

    const x = Math.cos(t * 0.5) * data.distance + offset[0];
    const z = Math.sin(t * 0.5) * data.distance + offset[2];
    const y = offset[1];

    ref.current.position.set(x, y, z);
    ref.current.rotation.set(...data.inclination);
  });

  return (
    <group ref={ref}>
      {/* Orbit visualization */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[data.distance, 0.01, 8, 120]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {children}
    </group>
  );
}

// CelestialBody clickable wrapper
function CelestialBody({ data, onClick, children, hoverCtx }: { data: any; onClick: (id: string) => void; children: React.ReactNode; hoverCtx: any }) {
  return (
    <mesh
      onClick={(e) => { e.stopPropagation(); onClick(data.id); }}
      onPointerOver={(e) => {
        e.stopPropagation();
        hoverCtx?.setHoveredId(data.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        hoverCtx?.setHoveredId(null);
        document.body.style.cursor = 'auto';
      }}
    >
      {children}
    </mesh>
  );
}

export default function NascentStar({ data, offset, tendency, focusId, onSelect, hoverCtx }: NascentStarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isHovered = hoverCtx?.hoveredId === data.id;
  const isFocused = focusId === data.id;

  // Dynamic color based on tendency: white (Order) -> acid purple (Chaos)
  const dynamicColor = useMemo(() => {
    const orderColor = new THREE.Color(1.0, 1.0, 1.0); // #ffffff
    const chaosColor = new THREE.Color(0.74, 0.0, 1.0); // #bc00ff
    return new THREE.Color().lerpColors(orderColor, chaosColor, tendency);
  }, [tendency]);

  // Geometry based on Nascent category
  const visuals = useMemo(() => {
    switch (data.category) {
      case 'Undefined':
        return { geom: <sphereGeometry args={[data.size, 8, 8]} />, wireframe: true };
      case 'Potential':
        return { geom: <icosahedronGeometry args={[data.size, 1]} />, wireframe: false };
      case 'Collapsed':
        return { geom: <boxGeometry args={[data.size, data.size, data.size]} />, wireframe: false };
      case 'Quantum':
        return { geom: <octahedronGeometry args={[data.size, 0]} />, wireframe: true };
      case 'Nascent':
        return { geom: <dodecahedronGeometry args={[data.size, 0]} />, wireframe: false };
      default:
        return { geom: <tetrahedronGeometry args={[data.size, 0]} />, wireframe: false };
    }
  }, [data.category, data.size]);

  // Digital glitch effect for high tendency
  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // High tendency causes geometry trembling (digital glitch)
    if (tendency > 0.5) {
      const glitchIntensity = (tendency - 0.5) * 2; // 0.0 to 1.0
      const time = clock.getElapsedTime();

      // Random jitter on vertices
      const offset = Math.sin(time * 20 + data.id.charCodeAt(0)) * 0.05 * glitchIntensity;
      meshRef.current.rotation.x += offset;
      meshRef.current.rotation.y += offset * 0.5;

      // Scale flicker
      const scaleFlicker = 1.0 + Math.sin(time * 30) * 0.03 * glitchIntensity;
      meshRef.current.scale.setScalar(scaleFlicker);
    } else {
      // Reset to normal
      meshRef.current.scale.setScalar(1.0);
    }
  });

  return (
    <OrbitGroup data={data} offset={offset}>
      <CelestialBody data={data} onClick={onSelect} hoverCtx={hoverCtx}>
        <group ref={meshRef}>
          {visuals.geom}
          <meshStandardMaterial
            color={dynamicColor}
            emissive={dynamicColor}
            emissiveIntensity={isFocused || isHovered ? 4 : 1.2}
            flatShading={true}
            wireframe={visuals.wireframe}
          />
        </group>
      </CelestialBody>

      {/* Label */}
      <Billboard position={[0, 2.5, 0]}>
        {!isFocused && data.label && (
          <Suspense fallback={null}>
            <Text fontSize={0.7} color={dynamicColor.getHex()} fillOpacity={isHovered ? 1 : 0.6}>
              {String(data.label)}
            </Text>
          </Suspense>
        )}
      </Billboard>

      {/* Digital noise particles for high tendency */}
      {tendency > 0.7 && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={50}
              array={new Float32Array(
                Array.from({ length: 150 }, () => (Math.random() - 0.5) * data.size * 3)
              )}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.1}
            color={dynamicColor}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      )}

      {/* Planets (if any) */}
      {data.children?.map((planet: any) => (
        <OrbitGroup key={planet.id} data={planet} offset={[0, 0, 0]}>
          <CelestialBody data={planet} onClick={onSelect} hoverCtx={hoverCtx}>
            <sphereGeometry args={[planet.size, 12, 12]} />
            <meshStandardMaterial
              color={dynamicColor}
              emissive={dynamicColor}
              emissiveIntensity={1.5}
            />
          </CelestialBody>

          {/* Satellites (if any) */}
          {planet.children?.map((sat: any) => (
            <OrbitGroup key={sat.id} data={sat} offset={[0, 0, 0]}>
              <CelestialBody data={sat} onClick={onSelect} hoverCtx={hoverCtx}>
                <sphereGeometry args={[sat.size, 8, 8]} />
                <meshStandardMaterial
                  color={dynamicColor}
                  emissive={dynamicColor}
                  emissiveIntensity={2}
                />
              </CelestialBody>
            </OrbitGroup>
          ))}
        </OrbitGroup>
      ))}
    </OrbitGroup>
  );
}
