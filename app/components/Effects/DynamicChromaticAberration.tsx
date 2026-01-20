import React, { useMemo } from "react";
import { ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";
import { useKpiaStore } from "../../../hooks/useKpiaStore";

// Dynamic Chromatic Aberration - intensifies near Nascent Core
const DynamicChromaticAberration = React.memo(function DynamicChromaticAberration() {
    const erosion = useKpiaStore(state => state.erosion);
    const tendency = useKpiaStore(state => state.tendency);
    const cameraPosition = useKpiaStore(state => state.cameraPosition);

    // Memoize Nascent Core position (constant)
    const nascentCorePos = useMemo(() => new THREE.Vector3(1000, 0, 1000), []);

    // Calculate aberration intensity
    const aberrationIntensity = useMemo(() => {
        // Calculate distance from camera to Nascent Core
        const camPos = new THREE.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        const distance = camPos.distanceTo(nascentCorePos);

        // Proximity effect: intensifies when within 200 units of core
        const proximityFactor = distance < 200 ? (1 - distance / 200) : 0;

        // Base aberration from erosion + proximity effect + tendency effect (prismatic)
        const baseAberration = erosion * 0.016;
        const proximityAberration = proximityFactor * 0.03; // Strong prismatic effect near core
        const tendencyAberration = tendency * 0.02; // Chaos increases aberration globally

        return baseAberration + proximityAberration + tendencyAberration;
    }, [erosion, tendency, cameraPosition, nascentCorePos]);

    // Memoize offset vector
    const offsetVector = useMemo(() => new THREE.Vector2(aberrationIntensity, aberrationIntensity), [aberrationIntensity]);

    return <ChromaticAberration offset={offsetVector} />;
});

export default DynamicChromaticAberration;
