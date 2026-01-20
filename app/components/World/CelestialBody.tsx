import React, { useRef, useContext, useEffect } from "react";
import * as THREE from "three";
import { ThreeEvent } from "@react-three/fiber";
import { RefContext } from "../../contexts/RefContext";
import { useKpiaStore } from "../../../hooks/useKpiaStore";
import { EntityData } from "../../types";

const CelestialBody = React.memo(function CelestialBody({ data, children, onClick }: { data: EntityData, children: React.ReactNode, onClick: (id: string) => void }) {
    const ref = useRef<THREE.Group>(null);
    const refMap = useContext(RefContext);

    // Store actions
    const setHoveredId = useKpiaStore(state => state.setHoveredId);

    useEffect(() => {
        if (ref.current && refMap) refMap.current.set(data.id, ref.current);
        return () => { if (refMap) refMap.current.delete(data.id); };
    }, [data.id, refMap]);

    const handleClick = React.useCallback((e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick(data.id);
    }, [onClick, data.id]);

    const handlePointerOver = React.useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHoveredId(data.id);
        document.body.style.cursor = 'pointer';
    }, [setHoveredId, data.id]);

    const handlePointerOut = React.useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHoveredId(null);
        document.body.style.cursor = 'auto';
    }, [setHoveredId]);

    return (
        <group ref={ref}>
            <mesh onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
                {children}
            </mesh>
        </group>
    );
});

export default CelestialBody;
