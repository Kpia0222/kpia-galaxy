import { create } from 'zustand';

// 必要な型定義（後で共通型定義ファイルに移動することを推奨）
type Mode = 'UNIVERSE' | 'STAR' | 'PLANET' | 'SATELLITE' | 'DNA' | 'LAB' | 'MULTIVERSE';

interface KpiaState {
    // World State
    erosion: number;
    tendency: number;

    // Navigation State
    focusId: string | null;
    hoveredId: string | null;
    cameraPosition: { x: number; y: number; z: number };
    currentMode: Mode;
    previousMode: Mode;
    previousFocusId: string | null;
    activeCamSlot: number | null;

    // UI State
    isHudVisible: boolean;
    hudLocked: boolean;
    isSearchFocused: boolean;

    // Actions
    setErosion: (value: number) => void;
    setTendency: (value: number) => void;
    setFocusId: (id: string | null) => void;
    setHoveredId: (id: string | null) => void;
    setCameraPosition: (pos: { x: number; y: number; z: number }) => void;
    setMode: (mode: Mode) => void;
    setActiveCamSlot: (slot: number | null) => void;

    setHudVisible: (visible: boolean) => void;
    setHudLocked: (locked: boolean) => void;
    setSearchFocused: (focused: boolean) => void;

    // Helper Action
    toggleHud: () => void;
}

export const useKpiaStore = create<KpiaState>((set) => ({
    // Initial State
    erosion: 0.0,
    tendency: 0.0,

    focusId: null,
    hoveredId: null,
    cameraPosition: { x: 0, y: 400, z: 800 },
    currentMode: 'DNA', // 初期モードはDNA
    previousMode: 'UNIVERSE',
    previousFocusId: null,
    activeCamSlot: 0,

    isHudVisible: true,
    hudLocked: false,
    isSearchFocused: false,

    // Actions
    setErosion: (value) => set({ erosion: value }),
    setTendency: (value) => set({ tendency: value }),
    setFocusId: (id) => set({ focusId: id }),
    setHoveredId: (id) => set({ hoveredId: id }),
    setCameraPosition: (pos) => set({ cameraPosition: pos }),

    setMode: (mode) => set((state) => ({
        previousMode: state.currentMode,
        previousFocusId: state.focusId,
        currentMode: mode
    })),

    setActiveCamSlot: (slot) => set({ activeCamSlot: slot }),

    setHudVisible: (visible) => set({ isHudVisible: visible }),
    setHudLocked: (locked) => set({ hudLocked: locked }),
    setSearchFocused: (focused) => set({ isSearchFocused: focused }),

    toggleHud: () => set((state) => {
        const newState = !state.isHudVisible;
        return {
            isHudVisible: newState,
            hudLocked: !newState // OFFにするならロック(true)、ONにするならロック解除(false)
        };
    }),
}));
