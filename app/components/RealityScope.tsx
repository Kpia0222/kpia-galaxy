"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RealityScopeProps {
  erosion: number;
  audioData?: Float32Array;
}

// Generate pseudo FFT data if no real audio input
const generatePseudoFFT = (size: number, time: number): Float32Array => {
  const data = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const freq = 20 * Math.pow(20000 / 20, i / size); // Log scale
    const amp =
      0.3 * Math.sin(time * 2 + i * 0.1) +
      0.2 * Math.sin(time * 4 + i * 0.05) +
      0.15 * Math.sin(time * 8 + i * 0.02) +
      Math.random() * 0.1;
    data[i] = Math.max(0, Math.min(1, amp));
  }
  return data;
};

// Calculate cents deviation from nearest 12-TET note
const calculateCentsDeviation = (frequency: number): number => {
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75); // Reference C0

  // Calculate semitones from C0
  const semitones = 12 * Math.log2(frequency / C0);
  const nearestSemitone = Math.round(semitones);

  // Cents deviation: difference * 100
  const centsDeviation = (semitones - nearestSemitone) * 100;

  return centsDeviation;
};

// Map cents deviation to color
const centsToColor = (cents: number, erosion: number): THREE.Color => {
  // Cents range: -50 to +50
  // 0 cents = Cyan (規律)
  // ±50 cents = Purple/Red (異形)

  const absCents = Math.abs(cents);
  const normalizedCents = absCents / 50; // 0 to 1

  // HSL color space
  // Cyan: 180°, Purple: 280°, Red: 0°
  let hue = 180 - normalizedCents * 180; // 180 (cyan) to 0 (red/purple)

  // Add erosion influence - shifts toward purple/red
  hue -= erosion * 100;
  if (hue < 0) hue += 360;

  const saturation = 0.7 + normalizedCents * 0.3;
  const lightness = 0.4 + normalizedCents * 0.2;

  const color = new THREE.Color();
  color.setHSL(hue / 360, saturation, lightness);

  return color;
};

const FREQ_BINS = 64; // Number of frequency bins
const TIME_DEPTH = 32; // Number of time slices (waterfall depth)

export default function RealityScope({ erosion, audioData }: RealityScopeProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);
  const historyRef = useRef<Float32Array[]>([]);

  // Initialize history buffer
  useEffect(() => {
    historyRef.current = Array.from({ length: TIME_DEPTH }, () =>
      new Float32Array(FREQ_BINS).fill(0)
    );
  }, []);

  // Create geometry and initial attributes
  const { geometry, positions, colors } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const posArray = new Float32Array(FREQ_BINS * TIME_DEPTH * 3);
    const colArray = new Float32Array(FREQ_BINS * TIME_DEPTH * 3);

    // Initialize positions in grid
    for (let z = 0; z < TIME_DEPTH; z++) {
      for (let x = 0; x < FREQ_BINS; x++) {
        const idx = (z * FREQ_BINS + x) * 3;

        // X: logarithmic frequency distribution (-1 to 1)
        posArray[idx] = (x / (FREQ_BINS - 1)) * 2 - 1;

        // Y: amplitude (will be updated)
        posArray[idx + 1] = 0;

        // Z: time depth (-1 to 0, front to back)
        posArray[idx + 2] = -z / (TIME_DEPTH - 1);

        // Initial color
        colArray[idx] = 0;
        colArray[idx + 1] = 1;
        colArray[idx + 2] = 1;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));

    return { geometry: geo, positions: posArray, colors: colArray };
  }, []);

  // Vertex Shader with erosion-based distortion
  const vertexShader = `
    uniform float uErosion;
    uniform float uTime;

    attribute vec3 color;
    varying vec3 vColor;
    varying float vErosion;

    // Pseudo-random function
    float random(vec3 st) {
      return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    }

    void main() {
      vColor = color;
      vErosion = uErosion;

      vec3 pos = position;

      // Z-Instability: time axis distortion
      if (uErosion > 0.3) {
        float zNoise = random(vec3(pos.x, pos.z, uTime * 0.5)) * 2.0 - 1.0;
        pos.z += zNoise * uErosion * 0.3;
      }

      // Vertex Glitch: scatter vertices when erosion is high
      if (uErosion > 0.7) {
        float scatter = (uErosion - 0.7) / 0.3; // 0 to 1
        vec3 randomOffset = vec3(
          random(vec3(pos.x, uTime, 1.0)) * 2.0 - 1.0,
          random(vec3(pos.y, uTime, 2.0)) * 2.0 - 1.0,
          random(vec3(pos.z, uTime, 3.0)) * 2.0 - 1.0
        );
        pos += randomOffset * scatter * 0.5;
      }

      // XY Jitter at medium erosion
      if (uErosion > 0.5) {
        float jitter = (uErosion - 0.5) * 2.0;
        pos.x += (random(vec3(pos.z, uTime * 2.0, 1.0)) - 0.5) * jitter * 0.1;
        pos.y += (random(vec3(pos.z, uTime * 2.0, 2.0)) - 0.5) * jitter * 0.05;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = 3.0 * (1.0 + uErosion);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  // Fragment Shader
  const fragmentShader = `
    varying vec3 vColor;
    varying float vErosion;

    void main() {
      // Circular point
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      if (dist > 0.5) discard;

      // Glow effect based on erosion
      float alpha = 1.0 - (dist * 2.0);
      alpha = pow(alpha, 1.0 - vErosion * 0.5);

      gl_FragColor = vec4(vColor, alpha);
    }
  `;

  // Update shader material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uErosion: { value: 0 },
        uTime: { value: 0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, []);

  // Animation loop
  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current) return;

    timeRef.current += delta;

    // Update shader uniforms
    materialRef.current.uniforms.uErosion.value = erosion;
    materialRef.current.uniforms.uTime.value = timeRef.current;

    // Generate or use audio data
    const currentFFT = audioData || generatePseudoFFT(FREQ_BINS, timeRef.current);

    // Shift history back (waterfall effect)
    historyRef.current.unshift(currentFFT);
    if (historyRef.current.length > TIME_DEPTH) {
      historyRef.current.pop();
    }

    // Update geometry positions and colors
    const posAttribute = pointsRef.current.geometry.attributes.position;
    const colAttribute = pointsRef.current.geometry.attributes.color;

    for (let z = 0; z < TIME_DEPTH; z++) {
      const fftData = historyRef.current[z];
      if (!fftData) continue;

      for (let x = 0; x < FREQ_BINS; x++) {
        const idx = (z * FREQ_BINS + x) * 3;

        // Update Y position (amplitude)
        const amplitude = fftData[x];
        posAttribute.array[idx + 1] = amplitude * 1.5; // Scale amplitude

        // Calculate frequency for this bin (logarithmic)
        const minFreq = 20;
        const maxFreq = 20000;
        const frequency = minFreq * Math.pow(maxFreq / minFreq, x / (FREQ_BINS - 1));

        // Calculate cents deviation
        const cents = calculateCentsDeviation(frequency);

        // Map to color
        const color = centsToColor(cents, erosion);

        // Update color attribute
        colAttribute.array[idx] = color.r;
        colAttribute.array[idx + 1] = color.g;
        colAttribute.array[idx + 2] = color.b;
      }
    }

    posAttribute.needsUpdate = true;
    colAttribute.needsUpdate = true;
  });

  // Create line segments for grid
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];

    // Frequency grid lines (vertical)
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * 2 - 1;
      const points = [
        new THREE.Vector3(x, 0, 0),
        new THREE.Vector3(x, 0, -1)
      ];
      lines.push(
        <line key={`freq-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                points[0].x, points[0].y, points[0].z,
                points[1].x, points[1].y, points[1].z
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#222" transparent opacity={0.2} />
        </line>
      );
    }

    // Time grid lines (horizontal)
    for (let i = 0; i <= 8; i++) {
      const z = -i / 8;
      const points = [
        new THREE.Vector3(-1, 0, z),
        new THREE.Vector3(1, 0, z)
      ];
      lines.push(
        <line key={`time-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                points[0].x, points[0].y, points[0].z,
                points[1].x, points[1].y, points[1].z
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#222" transparent opacity={0.2} />
        </line>
      );
    }

    return lines;
  }, []);

  return (
    <group>
      {/* Background grid */}
      {gridLines}

      {/* Main spectrum points */}
      <points ref={pointsRef} geometry={geometry}>
        <primitive ref={materialRef} object={shaderMaterial} attach="material" />
      </points>

      {/* Axis labels (using simple meshes) */}
      <mesh position={[-1.2, 0, 0.1]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
      <mesh position={[1.2, 0, 0.1]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#ff00ff" />
      </mesh>
    </group>
  );
}
