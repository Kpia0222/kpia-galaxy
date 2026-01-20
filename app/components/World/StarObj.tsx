import React, { useMemo, Suspense } from "react";
import * as THREE from "three";
import { Billboard, Text } from "@react-three/drei";
import { EntityData } from "../../types";
import { useKpiaStore } from "../../../hooks/useKpiaStore";
import CelestialBody from "./CelestialBody";
import OrbitGroup from "./OrbitGroup";
import MicrotonalCrystals from "./MicrotonalCrystals";
import GravitationalDistortion from "../Effects/GravitationalDistortion";

const StarObj = React.memo(function StarObj({ data, offset, focusId, onSelect }: { data: EntityData, offset: [number, number, number], focusId: string | null, onSelect: (id: string) => void }) {
    const hoveredId = useKpiaStore(state => state.hoveredId);
    const isHovered = hoveredId === data.id;
    const isFocused = focusId === data.id;

    const visuals = useMemo(() => {
        if (data.isForeign) return { geom: <octahedronGeometry args={[data.size, 0]} />, wireframe: false };
        switch (data.category) {
            case 'Original': return { geom: <dodecahedronGeometry args={[data.size, 0]} />, wireframe: false };
            case 'Remix': return { geom: <torusKnotGeometry args={[data.size * 0.6, 0.15, 64, 16]} />, wireframe: false };
            case 'Bootleg': return { geom: <tetrahedronGeometry args={[data.size, 0]} />, wireframe: false };
            case 'WIP': return { geom: <boxGeometry args={[data.size, data.size, data.size]} />, wireframe: true };
            case '???': return { geom: <sphereGeometry args={[data.size * 1.5, 3, 3]} />, wireframe: true };
            // Microtonal Categories
            case 'Pure_Micro': return { geom: <icosahedronGeometry args={[data.size, 2]} />, wireframe: true };
            case 'Xenharmonic': return { geom: <torusGeometry args={[data.size * 0.8, 0.2, 16, 100]} />, wireframe: false };
            case 'Just_Intonation': return { geom: <coneGeometry args={[data.size, data.size * 2, 4]} />, wireframe: true };
            case 'Spectral': return { geom: <octahedronGeometry args={[data.size * 1.2, 0]} />, wireframe: false };
            case 'Noise': return { geom: <dodecahedronGeometry args={[data.size, 0]} />, wireframe: true };
            default: return { geom: <icosahedronGeometry args={[data.size, 1]} />, wireframe: false };
        }
    }, [data]);

    return (
        <OrbitGroup data={data} offset={offset}>
            <CelestialBody data={data} onClick={onSelect}>
                {visuals.geom}
                <meshStandardMaterial color={data.isForeign ? "#555" : data.color} emissive={data.color} emissiveIntensity={isFocused || isHovered ? 4 : 0.8} flatShading={true} wireframe={visuals.wireframe} />
                {data.erosion! >= 1.0 && <MicrotonalCrystals amount={data.erosion!} color={data.color} />}
                {data.erosion! > 0.8 && <GravitationalDistortion position={new THREE.Vector3(0, 0, 0)} />}
            </CelestialBody>
            <Billboard position={[0, 2.5, 0]}>
                {!isFocused && data.label && <Suspense fallback={null}><Text fontSize={0.7} color="white" fillOpacity={isHovered ? 1 : 0.6}>{String(data.label)}</Text></Suspense>}
            </Billboard>
            {data.children?.map(planet => (
                <OrbitGroup key={planet.id} data={planet} offset={[0, 0, 0]}>
                    <CelestialBody data={planet} onClick={onSelect}>
                        <sphereGeometry args={[planet.size, 12, 12]} />
                        <meshStandardMaterial color={planet.color} emissive={planet.color} emissiveIntensity={1} />
                        {planet.erosion! >= 1.0 && <MicrotonalCrystals amount={planet.erosion!} color={planet.color} />}
                    </CelestialBody>
                    {planet.children?.map(sat => (
                        <OrbitGroup key={sat.id} data={sat} offset={[0, 0, 0]}>
                            <CelestialBody data={sat} onClick={onSelect}>
                                <sphereGeometry args={[sat.size, 8, 8]} />
                                <meshStandardMaterial color={sat.color} emissive={sat.color} emissiveIntensity={2} />
                            </CelestialBody>
                        </OrbitGroup>
                    ))}
                </OrbitGroup>
            ))}
        </OrbitGroup>
    );
});

export default StarObj;
