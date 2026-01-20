import React, { useRef, useContext, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RefContext } from "../../contexts/RefContext";
import { useKpiaStore } from "../../../hooks/useKpiaStore";
import { EntityData } from "../../types";
import { Billboard, Text } from "@react-three/drei";

const FloatingMeteor = React.memo(function FloatingMeteor({ data, onSelect }: { data: EntityData, onSelect: (id: string) => void }) {
    const ref = useRef<THREE.Group>(null);
    const refMap = useContext(RefContext);

    // Store actions
    const hoveredId = useKpiaStore(state => state.hoveredId);
    const setHoveredId = useKpiaStore(state => state.setHoveredId);

    const isHovered = hoveredId === data.id;

    useEffect(() => {
        if (ref.current && refMap) refMap.current.set(data.id, ref.current);
        return () => { if (refMap) refMap.current.delete(data.id); };
    }, [data.id, refMap]);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime() * data.speed + data.phase;
        ref.current.position.set(Math.cos(t) * data.distance, Math.sin(t * 0.3) * 50, Math.sin(t) * data.distance);
        ref.current.rotation.y += 0.005;
    });

    const handleClick = React.useCallback((e: any) => {
        e.stopPropagation();
        onSelect(data.id);
    }, [onSelect, data.id]);

    const handlePointerOver = React.useCallback(() => {
        setHoveredId(data.id);
        document.body.style.cursor = 'pointer';
    }, [setHoveredId, data.id]);

    const handlePointerOut = React.useCallback(() => {
        setHoveredId(null);
        document.body.style.cursor = 'auto';
    }, [setHoveredId]);

    return (
        <group ref={ref}>
            <mesh onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
                <dodecahedronGeometry args={[data.size, 0]} />
                <meshBasicMaterial color={data.erosion! > 0.8 ? "#aaaaff" : "#555"} wireframe transparent opacity={isHovered ? 1.0 : 0.5} />
            </mesh>
            {isHovered && <Billboard position={[0, 1.5, 0]}><Text fontSize={0.5} color="white">{data.id}</Text></Billboard>}
        </group>
    );
});

export default FloatingMeteor;
