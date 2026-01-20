import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sparkles } from "@react-three/drei";
import { OPTIMIZATION_FLAGS } from "../../config/optimizationFlags";
import MicrotonalCrystalsInstanced from "./instanced/MicrotonalCrystalsInstanced";

const MicrotonalCrystals = React.memo(function MicrotonalCrystals({ amount, color }: { amount: number, color: string }) {
    // Use instanced version if optimization flag is enabled
    if (OPTIMIZATION_FLAGS.ENABLE_INSTANCED_CRYSTALS) {
        return (
            <>
                <MicrotonalCrystalsInstanced amount={amount} color={color} baseScale={1.5} speed={2.0} />
                {amount > 0.8 && (
                    <mesh>
                        <sphereGeometry args={[1.5, 32, 32]} />
                        <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
                        <Sparkles count={20} scale={3} size={4} speed={0.4} opacity={0.5} color="#00ffff" />
                        <Sparkles count={20} scale={3.5} size={4} speed={-0.4} opacity={0.5} color="#ff00ff" />
                    </mesh>
                )}
            </>
        );
    }

    // Original implementation (fallback)
    const count = Math.floor(amount * 16);
    const crystals = useMemo(() => Array.from({ length: count }).map(() => ({
        pos: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5].map(v => v * 1.8) as [number, number, number],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
        baseScale: 0.15 + Math.random() * 0.3,
        speed: 2 + Math.random() * 5
    })), [count]);

    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.getElapsedTime();
        ref.current.children.forEach((child, i) => {
            const cData = crystals[i];
            if (!cData) return;
            const pulse = amount >= 0.95
                ? Math.sin(t * cData.speed * 2) * 0.5 + 1.2
                : Math.sin(t * cData.speed) * 0.2 + 1.0;
            child.scale.setScalar(cData.baseScale * pulse);
            child.rotation.x += 0.01; child.rotation.y += 0.02;
        });
        ref.current.rotation.y = t * 0.1;
    });

    return (
        <group ref={ref}>
            {crystals.map((c, i) => (
                <mesh key={i} position={new THREE.Vector3(...c.pos)} rotation={new THREE.Euler(...c.rot)}>
                    <octahedronGeometry args={[1, 0]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.6} />
                </mesh>
            ))}
        </group>
    );
});

export default MicrotonalCrystals;
