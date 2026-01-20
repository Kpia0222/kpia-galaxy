import React, { useRef, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sparkles, Billboard, Text } from "@react-three/drei";

export default function AlienComet({ onShepherdSignal }: { onShepherdSignal: () => void }) {
    const ref = useRef<THREE.Group>(null);
    const lastSignalTime = useRef(0);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime() * 0.15;
        const x = Math.cos(t) * 80;
        const z = Math.sin(t) * 380;
        const y = Math.sin(t * 2) * 30;
        ref.current.position.set(x, y, z);
        ref.current.rotation.y += 0.1;
        if (Math.abs(z) > 350 && clock.getElapsedTime() - lastSignalTime.current > 5) {
            onShepherdSignal();
            lastSignalTime.current = clock.getElapsedTime();
        }
    });

    return (
        <group ref={ref}>
            <mesh><octahedronGeometry args={[3.0, 0]} /><meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={10} wireframe /></mesh>
            <Sparkles count={50} scale={12} size={6} speed={0.4} opacity={0.5} color="#00ffff" />
            <pointLight color="#00ffff" intensity={8} distance={60} />
            <Billboard position={[0, 5, 0]}><Suspense fallback={null}><Text fontSize={1.0} color="#00ffff" fillOpacity={0.8}>[ ALIEN_SHEPHERD ]</Text></Suspense></Billboard>
        </group>
    );
}
