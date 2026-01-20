import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { EntityData } from "../../types";
import { useKpiaStore } from "../../../hooks/useKpiaStore";

export default function QuestionShard({ data, onSelect }: { data: EntityData, onSelect: (id: string) => void }) {
    const ref = useRef<THREE.Group>(null);
    const hoveredId = useKpiaStore(state => state.hoveredId);
    const isHovered = hoveredId === data.id;

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime() * data.speed + data.phase;
        ref.current.position.set(Math.cos(t) * data.distance, Math.sin(t * 0.5) * 50, Math.sin(t) * data.distance);
        ref.current.rotation.x += 0.01; ref.current.rotation.y += 0.015;
    });

    return (
        <group ref={ref}>
            <mesh
                onClick={(e) => { e.stopPropagation(); onSelect(data.id); }}
                onPointerOver={(e) => { e.stopPropagation(); useKpiaStore.getState().setHoveredId(data.id); document.body.style.cursor = "pointer"; }}
                onPointerOut={(e) => { e.stopPropagation(); useKpiaStore.getState().setHoveredId(null); document.body.style.cursor = "auto"; }}
            >
                <octahedronGeometry args={[2, 0]} />
                <meshStandardMaterial color="#ffffff" wireframe emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
            <Html position={[0, 4, 0]} center style={{ pointerEvents: "none", opacity: isHovered ? 1 : 0, transition: "opacity 0.3s" }}>
                <div className="bg-black/80 text-white px-2 py-1 text-xs whitespace-nowrap border border-white/30 backdrop-blur-sm">
                    {data.bio}
                </div>
            </Html>
        </group>
    );
}
