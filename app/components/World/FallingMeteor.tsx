import React, { useRef, useContext, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RefContext } from "../../contexts/RefContext";
import { EntityData } from "../../types";
import { Billboard, Text, Sparkles } from "@react-three/drei";

export default function FallingMeteor({ data, targetId, onImpact }: { data: EntityData, targetId: string, onImpact: (meteorId: string, targetId: string) => void }) {
    const ref = useRef<THREE.Group>(null);
    const refMap = useContext(RefContext);
    const [active, setActive] = useState(true);
    const [startPos] = useState(() => {
        const angle = Math.random() * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * 250, 150, Math.sin(angle) * 250);
    });

    useFrame((state, delta) => {
        if (!active || !ref.current || !refMap?.current.has(targetId)) return;
        const targetPos = new THREE.Vector3();
        refMap.current.get(targetId)!.getWorldPosition(targetPos);
        const dist = ref.current.position.distanceTo(targetPos);
        const speed = 1.0 + (250 - dist) * 0.05;
        ref.current.position.lerp(targetPos, delta * speed * 0.01);
        ref.current.rotation.x += 0.1; ref.current.rotation.y += 0.1;
        if (dist < 4) { setActive(false); onImpact(data.id, targetId); }
    });

    if (!active) return null;

    return (
        <group ref={ref} position={startPos}>
            <Sparkles count={40} scale={4} size={5} color={data.erosion! > 0.8 ? "#ff00ff" : "#ffaa00"} />
            <mesh>
                <dodecahedronGeometry args={[1.2, 0]} />
                <meshStandardMaterial color={data.erosion! > 0.8 ? "#ff00ff" : "#ffaa00"} emissive={data.erosion! > 0.8 ? "#ff00ff" : "#ffaa00"} emissiveIntensity={2} />
            </mesh>
            <Billboard position={[0, 2, 0]}><Text fontSize={0.6} color="white" fillOpacity={0.7}>{data.label}</Text></Billboard>
        </group>
    );
}
