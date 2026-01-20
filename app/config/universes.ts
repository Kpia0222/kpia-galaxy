import { EntityData, UniverseData } from "../types";
import { QUESTIONS, SAMPLE_LYRICS } from "./constants";

// =====================================================================
// 宇宙・エンティティ設定
// =====================================================================

// Multiverse Configuration - Expandable Universe Array
export const UNIVERSES: UniverseData[] = [
    {
        id: 0,
        name: 'CANON',
        type: 'Canon',
        pos: [0, 0, 0],
        color: '#ff4400',
        isMicrotonal: false,
        erosion: 0.2,
        tendency: 0.1,
        starCount: 40
    },
    {
        id: 1,
        name: 'XEN',
        type: 'Xen',
        pos: [2000, 0, 0],
        color: '#ff00ff',
        isMicrotonal: true,
        erosion: 0.8,
        tendency: 0.6,
        starCount: 40
    },
    {
        id: 2,
        name: 'NASCENT',
        type: 'Unformed',
        pos: [1000, 0, 1000],
        color: '#ffffff',
        isMicrotonal: false,
        erosion: 0.0,
        tendency: 0.0,
        starCount: 30
    }
];

// Oort Cloud Meteors
export const OORT_METEORS: EntityData[] = Array.from({ length: 200 }, (_, i) => ({
    id: `Mt.${String(i + 1).padStart(3, '0')}`,
    type: 'meteor', label: `Ref_Signal_${i + 1}`, category: 'Reference',
    color: "#aaaaaa", size: 0.3 + Math.random() * 0.4,
    distance: 150 + Math.random() * 300,
    speed: 0.005 + Math.random() * 0.045,
    inclination: [(Math.random() - 0.5) * Math.PI, 0, (Math.random() - 0.5) * Math.PI],
    phase: Math.random() * Math.PI * 2,
    erosion: Math.random(),
    bio: "External Thought Pattern",
    lyrics: "Raw data fragment from external source...",
    qualia: "Unknown_Signal",
    universeId: 0
}));

// Shards (Questions)
export const SHARD_DATA: EntityData[] = QUESTIONS.map((q, i) => ({
    id: `Shard-${i}`, type: 'relic', label: `Fragment_${i}`, category: 'Relic',
    color: "#ffffff", size: 0.8, distance: 200 + Math.random() * 50, speed: 0.05,
    inclination: [Math.random() * Math.PI, 0, Math.random() * Math.PI], phase: Math.random() * Math.PI,
    bio: q, erosion: 0.8, qualia: "Philosophical_Debris",
    universeId: 0
}));

// 宇宙生成関数
export const generateGalaxy = (count: number, offset: [number, number, number], universeId: number): EntityData[] => {
    return Array.from({ length: count }, (_, i) => {
        const isMicrotonal = universeId === 1;
        const isNascent = universeId === 2;

        const categories = isMicrotonal
            ? ["Pure_Micro", "Xenharmonic", "Just_Intonation", "Spectral", "Noise"]
            : isNascent
                ? ["Undefined", "Potential", "Collapsed", "Quantum", "Nascent"]
                : ["Original", "Remix", "Bootleg", "Cover", "WIP", "???"];

        const category = categories[i % categories.length];
        const prefix = isMicrotonal ? "Mu" : isNascent ? "Ns" : "Kp";
        const starId = `${prefix}.${String(i + 1).padStart(4, '0')}`;
        const randomInc = () => [(Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4] as [number, number, number];

        let distance = 0; let color = ""; let size = 1.0; let erosion = isMicrotonal ? 0.9 : 0; let qualia = "0.00";

        if (isNascent) {
            // Nascent universe: all start as pure white, will be colored by tendency dynamically
            distance = 40 + Math.random() * 120;
            color = "#ffffff"; // Pure white (Order) - will lerp to purple based on tendency
            size = 0.6 + Math.random() * 0.6;
            erosion = 0.0; // No erosion, but has tendency instead
            qualia = "Superposition";
        } else if (isMicrotonal) {
            distance = 30 + Math.random() * 150;
            color = i % 2 === 0 ? "#ff00ff" : "#8800ff";
            erosion = 0.8 + Math.random() * 0.2;
            qualia = "Fluid_Harmony";
        } else {
            switch (category) {
                case "Original": distance = 30 + Math.random() * 20; color = "#ff4400"; erosion = 0.05; qualia = "Artificial_Grid"; break;
                case "Cover": distance = 50 + Math.random() * 20; color = "#ffffff"; erosion = 0.1; qualia = "Mimicry"; break;
                case "Remix": distance = 80 + Math.random() * 25; color = "#00ffff"; erosion = 0.4; qualia = "Fluctuation"; break;
                case "WIP": distance = 120 + Math.random() * 30; color = "#ccff00"; size = 0.4; erosion = 0.3; qualia = "Unborn"; break;
                case "Bootleg": distance = 100 + Math.random() * 25; color = "#ff00ff"; erosion = 0.7; qualia = "Violation"; break;
                case "???": distance = 160 + Math.random() * 40; color = "#220033"; erosion = 1.0; qualia = "The_Void"; break;
            }
        }

        const children: EntityData[] = [];

        // Calculate cent deviation for this star (microtonal universe has random offsets)
        const starCentDeviation = isMicrotonal ? (Math.random() - 0.5) * 100 : 0; // -50 to +50 cents

        // Add planets to both Original and Microtonal universes
        if (isMicrotonal) {
            // Microtonal stars get 1-2 planets
            const planetCount = Math.random() > 0.5 ? 2 : 1;
            for (let p = 0; p < planetCount; p++) {
                const planetId = `${starId}-P${p + 1}`;
                const planetCentDeviation = starCentDeviation + (Math.random() - 0.5) * 30; // Inherit + variation

                const planet: EntityData = {
                    id: planetId,
                    type: 'planet',
                    label: `Harmonic_${p + 1}`,
                    color: i % 3 === 0 ? "#ff00ff" : i % 3 === 1 ? "#00ffff" : "#ffff00",
                    size: 0.25 + Math.random() * 0.15,
                    distance: 6 + p * 4 + Math.random() * 2,
                    speed: 0.4 + Math.random() * 0.3,
                    inclination: randomInc(),
                    phase: Math.random() * 6,
                    category: "Harmonic",
                    erosion: 0.6 + Math.random() * 0.3,
                    universeId,
                    parent: starId,
                    centDeviation: planetCentDeviation,
                    children: []
                };

                // Add satellites to planets occasionally
                if (Math.random() > 0.6) {
                    const satelliteId = `${planetId}-S1`;
                    const satelliteCentDeviation = planetCentDeviation + (Math.random() - 0.5) * 15; // Further variation

                    planet.children = [{
                        id: satelliteId,
                        type: 'satellite',
                        label: `Overtone_${p + 1}.1`,
                        color: planet.color,
                        size: 0.1,
                        distance: 2,
                        speed: 0.8,
                        inclination: randomInc(),
                        phase: Math.random() * 6,
                        category: "Overtone",
                        erosion: 0.5,
                        universeId,
                        parent: planetId,
                        centDeviation: satelliteCentDeviation
                    }];
                }

                children.push(planet);
            }
        } else if (category === "Original" || category === "Remix") {
            // Original universe logic - add planets
            const planetId = `${starId}-P1`;
            const planet: EntityData = {
                id: planetId,
                type: 'planet',
                label: `Analysis_1`,
                color: color,
                size: 0.2,
                distance: 5,
                speed: 0.5,
                inclination: randomInc(),
                phase: Math.random() * 6,
                category,
                erosion: erosion * 0.5,
                universeId,
                parent: starId,
                centDeviation: 0, // Original universe is perfectly tuned to 12-TET
                children: []
            };

            // Add satellite to planet occasionally
            if (Math.random() > 0.7) {
                planet.children = [{
                    id: `${planetId}-S1`,
                    type: 'satellite',
                    label: `Sub_Analysis_1.1`,
                    color: color,
                    size: 0.08,
                    distance: 1.5,
                    speed: 1.0,
                    inclination: randomInc(),
                    phase: Math.random() * 6,
                    category: "Sub_Analysis",
                    erosion: erosion * 0.3,
                    universeId,
                    parent: planetId,
                    centDeviation: 0
                }];
            }

            children.push(planet);
        }

        return {
            id: starId, type: 'star', label: starId, category, color, size, distance,
            speed: 0.01 + Math.random() * 0.03, inclination: randomInc(), phase: Math.random() * 6,
            youtubeId: (!isMicrotonal && i % 4 === 0) ? "eh8noQsIhjg" : undefined,
            children, clicks: 0, erosion, isForeign: false,
            lyrics: (!isMicrotonal) ? SAMPLE_LYRICS : undefined,
            qualia, universeId,
            centDeviation: starCentDeviation
        };
    });
};

export const INITIAL_GALAXY_DATA = generateGalaxy(40, [0, 0, 0], 0);
export const MICROTONAL_GALAXY_DATA = generateGalaxy(40, [2000, 0, 0], 1);
export const NASCENT_GALAXY_DATA = generateGalaxy(30, [1000, 0, 1000], 2);
