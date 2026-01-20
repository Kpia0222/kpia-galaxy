import React, { useMemo } from "react";
import { EntityData } from "../../../types";
import { OPTIMIZATION_FLAGS } from "../../../config/optimizationFlags";
import { groupEntitiesByGeometry } from "../../../utils/entityGrouping";
import StarInstancedGroup from "./StarInstancedGroup";

// Instanced star renderer - groups stars by geometry type for optimal performance
export default function InstancedStarRenderer({
    stars,
    offset,
    focusId,
    hoveredId,
    onSelect,
    onHover
}: {
    stars: EntityData[],
    offset: [number, number, number],
    focusId: string | null,
    hoveredId: string | null,
    onSelect: (id: string) => void,
    onHover: (id: string | null) => void
}) {
    // Group stars by geometry type
    const groupedStars = useMemo(() => groupEntitiesByGeometry(stars), [stars]);

    if (OPTIMIZATION_FLAGS.DEBUG_PERFORMANCE) {
        console.log(`[InstancedStarRenderer] Grouped ${stars.length} stars into ${Object.keys(groupedStars).length} geometry types`);
    }

    return (
        <>
            {Object.entries(groupedStars).map(([geometryType, entities]) => (
                <StarInstancedGroup
                    key={`${geometryType}-${offset.join('-')}`}
                    entities={entities}
                    geometryType={geometryType}
                    offset={offset}
                    focusId={focusId}
                    hoveredId={hoveredId}
                    onSelect={onSelect}
                    onHover={onHover}
                />
            ))}
        </>
    );
}
