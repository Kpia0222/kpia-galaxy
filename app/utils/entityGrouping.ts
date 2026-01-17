// Utility functions for grouping entities by geometry type for instanced rendering

interface EntityData {
  id: string;
  type: string;
  label: string;
  color: string;
  size: number;
  distance: number;
  speed: number;
  inclination: [number, number, number];
  phase: number;
  category?: string;
  erosion?: number;
  isForeign?: boolean;
  children?: EntityData[];
}

export interface GroupedEntities {
  [geometryType: string]: EntityData[];
}

/**
 * Maps entity category to geometry type
 */
export function getGeometryType(category?: string, isForeign?: boolean): string {
  if (isForeign) return 'octahedron';

  switch (category) {
    case 'Original': return 'dodecahedron';
    case 'Remix': return 'torusKnot';
    case 'Bootleg': return 'tetrahedron';
    case 'WIP': return 'box';
    case '???': return 'sphere';
    // Microtonal Categories
    case 'Pure_Micro': return 'icosahedron';
    case 'Xenharmonic': return 'torus';
    case 'Just_Intonation': return 'cone';
    case 'Spectral': return 'octahedron';
    case 'Noise': return 'dodecahedron';
    default: return 'icosahedron';
  }
}

/**
 * Groups entities by their geometry type for instanced rendering
 */
export function groupEntitiesByGeometry(entities: EntityData[]): GroupedEntities {
  const groups: GroupedEntities = {};

  entities.forEach(entity => {
    const geomKey = getGeometryType(entity.category, entity.isForeign);

    if (!groups[geomKey]) {
      groups[geomKey] = [];
    }

    groups[geomKey].push(entity);
  });

  return groups;
}

/**
 * Flattens all stars from multiple universes into a single array
 */
export function flattenGalaxyData(galaxyData: { [universeId: number]: EntityData[] }): EntityData[] {
  const flattened: EntityData[] = [];

  Object.values(galaxyData).forEach(universeEntities => {
    universeEntities.forEach(entity => {
      if (entity.type === 'star') {
        flattened.push(entity);
      }
    });
  });

  return flattened;
}

/**
 * Count total draw calls reduction from instancing
 */
export function calculateDrawCallReduction(grouped: GroupedEntities): { before: number, after: number, reduction: string } {
  let totalEntities = 0;
  let totalGroups = 0;

  Object.values(grouped).forEach(group => {
    totalEntities += group.length;
    totalGroups++;
  });

  const reductionPercent = totalGroups > 0
    ? ((1 - totalGroups / totalEntities) * 100).toFixed(1)
    : '0.0';

  return {
    before: totalEntities,
    after: totalGroups,
    reduction: `${reductionPercent}%`
  };
}
