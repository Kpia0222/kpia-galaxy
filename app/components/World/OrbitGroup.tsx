import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EntityData } from "../../types";
import { Torus } from "@react-three/drei";

const OrbitGroup = React.memo(function OrbitGroup({ data, offset, children }: { data: EntityData, offset: [number, number, number], children: React.ReactNode }) {
    const groupRef = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        const t = clock.getElapsedTime() * data.speed;
        groupRef.current.rotation.y = data.phase + t * 0.5;
    });
    return (
        <group position={offset}>
            <group rotation={[data.inclination[0], 0, data.inclination[2]]}>
                <group ref={groupRef}><group position={[data.distance, 0, 0]}>{children}</group></group>
                {/* Orbit visualization - increased opacity and added emissive for better visibility */}
                <Torus args={[data.distance, 0.01, 8, 120]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshBasicMaterial
                        color={data.color}
                        transparent
                        opacity={0.3}
                        blending={THREE.AdditiveBlending}
                    />
                </Torus>
            </group>
        </group>
    );
});

export default OrbitGroup;
