import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sparkles } from "@react-three/drei";

export default function ImpactEffect({ position, color }: { position: THREE.Vector3, color: string }) {
    const [finished, setFinished] = useState(false);
    const groupRef = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        if (!groupRef.current || finished) return;
        const scale = groupRef.current.scale.x + 0.5;
        groupRef.current.scale.setScalar(scale);
        groupRef.current.children.forEach((child: any) => { if (child.material) child.material.opacity -= 0.02; });
        if (groupRef.current.children[0] && (groupRef.current.children[0] as any).material.opacity <= 0) { setFinished(true); }
    });

    if (finished) return null;

    return (
        <group ref={groupRef} position={position}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.5, 1, 32]} /><meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.2, 0.8, 32]} /><meshBasicMaterial color="white" transparent opacity={0.8} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
            <pointLight color={color} intensity={20} distance={50} decay={2} />
            <Sparkles count={30} scale={4} size={10} speed={2} color={color} />
        </group>
    );
}
