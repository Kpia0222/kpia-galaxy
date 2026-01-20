import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function GravitationalDistortion({ position }: { position: THREE.Vector3 }) {
    const groupRef = useRef<THREE.Group>(null);
    const [visible, setVisible] = useState(true);

    useFrame(({ camera }) => {
        if (!groupRef.current) return;

        // Get world position of this effect
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);

        // Calculate distance to camera
        const distance = camera.position.distanceTo(worldPos);

        // Only show effect when camera is within 50 units
        setVisible(distance < 50);
    });

    if (!visible) return null;

    return (
        <group ref={groupRef} position={position}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2, 6, 32]} />
                <meshBasicMaterial
                    color="#000"
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                    blending={THREE.SubtractiveBlending}
                    premultipliedAlpha={true}
                />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2, 2.2, 32]} />
                <meshBasicMaterial color="#fff" transparent opacity={0.2} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    );
}
