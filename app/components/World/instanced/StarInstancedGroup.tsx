"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

interface EntityData {
  id: string;
  type: string;
  label: string;
  color: string;
  size: number;
  distance: number;
  speed: number;
  inclination: [number, number, number];
  phase: number;
  category?: string;
  erosion?: number;
  isForeign?: boolean;
}

interface StarInstancedGroupProps {
  entities: EntityData[];
  geometryType: string;
  offset: [number, number, number];
  focusId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export default function StarInstancedGroup({
  entities,
  geometryType,
  offset,
  focusId,
  hoveredId,
  onSelect,
  onHover
}: StarInstancedGroupProps) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const [instanceIdMap] = useState(() => new Map<number, string>());

  // Geometry mapping based on category
  const geometry = useMemo(() => {
    const firstEntity = entities[0];
    if (!firstEntity) return new THREE.IcosahedronGeometry(1, 1);

    const size = 1; // Scaled per-instance

    switch (geometryType) {
      case 'dodecahedron': return new THREE.DodecahedronGeometry(size, 0);
      case 'torusKnot': return new THREE.TorusKnotGeometry(size * 0.6, 0.15, 64, 16);
      case 'tetrahedron': return new THREE.TetrahedronGeometry(size, 0);
      case 'box': return new THREE.BoxGeometry(size, size, size);
      case 'sphere': return new THREE.SphereGeometry(size * 1.5, 3, 3);
      case 'icosahedron': return new THREE.IcosahedronGeometry(size, 2);
      case 'torus': return new THREE.TorusGeometry(size * 0.8, 0.2, 16, 100);
      case 'cone': return new THREE.ConeGeometry(size, size * 2, 4);
      case 'octahedron': return new THREE.OctahedronGeometry(size * 1.2, 0);
      default: return new THREE.IcosahedronGeometry(size, 1);
    }
  }, [geometryType]);

  // Determine if wireframe
  const isWireframe = useMemo(() => {
    const category = entities[0]?.category;
    return category === 'WIP' || category === '???' || category === 'Pure_Micro' ||
           category === 'Just_Intonation' || category === 'Noise';
  }, [entities]);

  // Shader material for GPU-based orbital motion
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHoveredIndex: { value: -1 },
        uFocusedIndex: { value: -1 }
      },
      vertexShader: `
        attribute float instanceDistance;
        attribute float instanceSpeed;
        attribute float instancePhase;
        attribute float instanceSize;
        attribute vec3 instanceInclination;
        attribute vec3 instanceColor;
        attribute vec3 instanceOffset;

        uniform float uTime;
        uniform int uHoveredIndex;
        uniform int uFocusedIndex;

        varying vec3 vColor;
        varying float vEmissiveIntensity;

        mat4 rotationMatrix(vec3 axis, float angle) {
          axis = normalize(axis);
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;

          return mat4(
            oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
            oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
            oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
            0.0,                                0.0,                                0.0,                                1.0
          );
        }

        void main() {
          // Calculate orbital position on GPU
          float t = uTime * instanceSpeed + instancePhase;

          // Orbital motion in XZ plane
          vec3 orbitPos = vec3(
            cos(t * 0.5) * instanceDistance,
            0.0,
            sin(t * 0.5) * instanceDistance
          );

          // Apply inclination
          vec4 inclinedPos = rotationMatrix(vec3(0, 0, 1), instanceInclination.x) * vec4(orbitPos, 1.0);
          inclinedPos = rotationMatrix(vec3(1, 0, 0), instanceInclination.z) * inclinedPos;

          // Apply universe offset
          vec3 worldPos = inclinedPos.xyz + instanceOffset;

          // Scale the geometry
          vec3 scaledPos = position * instanceSize;

          // Hover/Focus effects
          bool isHovered = gl_InstanceID == uHoveredIndex;
          bool isFocused = gl_InstanceID == uFocusedIndex;

          if (isHovered || isFocused) {
            scaledPos *= 1.1;
          }

          vEmissiveIntensity = isFocused || isHovered ? 4.0 : 0.8;
          vColor = instanceColor;

          vec4 finalPos = vec4(worldPos + scaledPos, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * finalPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vEmissiveIntensity;

        void main() {
          vec3 finalColor = vColor + vColor * vEmissiveIntensity;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      wireframe: isWireframe
    });
  }, [isWireframe]);

  // Setup instance attributes
  useEffect(() => {
    if (!instancedMeshRef.current || entities.length === 0) return;

    const mesh = instancedMeshRef.current;
    const count = entities.length;

    // Create attribute arrays
    const distances = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    const inclinations = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const offsets = new Float32Array(count * 3);

    // Clear the instance ID map
    instanceIdMap.clear();

    entities.forEach((entity, i) => {
      // Map instance index to entity ID for raycasting
      instanceIdMap.set(i, entity.id);

      // Set instance matrix (identity, position handled in shader)
      const matrix = new THREE.Matrix4();
      mesh.setMatrixAt(i, matrix);

      // Set attributes
      distances[i] = entity.distance;
      speeds[i] = entity.speed;
      phases[i] = entity.phase;
      sizes[i] = entity.size;

      inclinations[i * 3] = entity.inclination[0];
      inclinations[i * 3 + 1] = entity.inclination[1];
      inclinations[i * 3 + 2] = entity.inclination[2];

      const color = new THREE.Color(entity.isForeign ? "#555" : entity.color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      offsets[i * 3] = offset[0];
      offsets[i * 3 + 1] = offset[1];
      offsets[i * 3 + 2] = offset[2];
    });

    // Set custom attributes
    mesh.geometry.setAttribute('instanceDistance',
      new THREE.InstancedBufferAttribute(distances, 1));
    mesh.geometry.setAttribute('instanceSpeed',
      new THREE.InstancedBufferAttribute(speeds, 1));
    mesh.geometry.setAttribute('instancePhase',
      new THREE.InstancedBufferAttribute(phases, 1));
    mesh.geometry.setAttribute('instanceSize',
      new THREE.InstancedBufferAttribute(sizes, 1));
    mesh.geometry.setAttribute('instanceInclination',
      new THREE.InstancedBufferAttribute(inclinations, 3));
    mesh.geometry.setAttribute('instanceColor',
      new THREE.InstancedBufferAttribute(colors, 3));
    mesh.geometry.setAttribute('instanceOffset',
      new THREE.InstancedBufferAttribute(offsets, 3));

    mesh.instanceMatrix.needsUpdate = true;
  }, [entities, offset, instanceIdMap]);

  // Update time uniform each frame
  useFrame(({ clock }) => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = clock.getElapsedTime();

      // Update hovered/focused indices
      const hoveredIndex = entities.findIndex(e => e.id === hoveredId);
      const focusedIndex = entities.findIndex(e => e.id === focusId);

      shaderMaterial.uniforms.uHoveredIndex.value = hoveredIndex;
      shaderMaterial.uniforms.uFocusedIndex.value = focusedIndex;
    }
  });

  // Raycast event handlers
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      const entityId = instanceIdMap.get(e.instanceId);
      if (entityId) onSelect(entityId);
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) {
      const entityId = instanceIdMap.get(e.instanceId);
      if (entityId) {
        onHover(entityId);
        document.body.style.cursor = 'pointer';
      }
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(null);
    document.body.style.cursor = 'auto';
  };

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      shaderMaterial.dispose();
    };
  }, [geometry, shaderMaterial]);

  if (entities.length === 0) return null;

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometry, shaderMaterial, entities.length]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      frustumCulled={false}
    />
  );
}
