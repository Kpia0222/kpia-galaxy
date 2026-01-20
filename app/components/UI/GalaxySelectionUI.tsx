"use client";

import { useState } from "react";

interface UniverseData {
  id: number;
  name: string;
  color: string;
}

interface GalaxyData {
  id: string;
  label: string;
  universeId: number;
}

interface GalaxySelectionUIProps {
  universes: UniverseData[];
  galaxies: GalaxyData[];
  onSelect: (galaxyId: string) => void;
}

export default function GalaxySelectionUI({ universes, galaxies, onSelect }: GalaxySelectionUIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState<number | null>(null);

  const handleUniverseClick = (universeId: number) => {
    if (selectedUniverse === universeId) {
      setSelectedUniverse(null);
    } else {
      setSelectedUniverse(universeId);
    }
  };

  const handleGalaxyClick = (galaxyId: string) => {
    onSelect(galaxyId);
    setIsOpen(false);
    setSelectedUniverse(null);
  };

  const filteredGalaxies = selectedUniverse !== null
    ? galaxies.filter(g => g.universeId === selectedUniverse)
    : [];

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/80 border-2 border-cyan-900/50 px-6 py-3 text-[11px] font-bold text-cyan-400 uppercase tracking-wider hover:border-cyan-500 transition-colors backdrop-blur-sm shadow-xl rounded"
      >
        <span className="mr-2">⚡</span>
        GALAXY_SELECTOR
        <span className="ml-2">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[400px] bg-black/95 border-2 border-cyan-900/50 backdrop-blur-md shadow-2xl z-50 rounded overflow-hidden">
          {/* Header */}
          <div className="bg-cyan-950/30 border-b border-cyan-900/50 px-4 py-2">
            <div className="text-[8px] text-cyan-700 uppercase tracking-widest font-bold">
              SELECT_UNIVERSE_&gt;_GALAXY
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {universes.map((universe) => {
              const isExpanded = selectedUniverse === universe.id;
              const universeGalaxies = galaxies.filter(g => g.universeId === universe.id);

              return (
                <div key={universe.id} className="border-b border-gray-900/50 last:border-0">
                  {/* Universe Button */}
                  <button
                    onClick={() => handleUniverseClick(universe.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-cyan-950/20 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full border-2"
                        style={{ borderColor: universe.color, backgroundColor: `${universe.color}33` }}
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: universe.color }}>
                        {universe.name}
                      </span>
                      <span className="text-[9px] text-gray-600 font-mono">
                        ({universeGalaxies.length} galaxies)
                      </span>
                    </div>
                    <span className="text-cyan-600 text-[10px] group-hover:text-cyan-400 transition-colors">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </button>

                  {/* Galaxy List */}
                  {isExpanded && (
                    <div className="bg-black/50 border-t border-cyan-900/30">
                      {universeGalaxies.map((galaxy) => (
                        <button
                          key={galaxy.id}
                          onClick={() => handleGalaxyClick(galaxy.id)}
                          className="w-full text-left px-8 py-2 text-[10px] text-cyan-300 hover:bg-cyan-950/30 hover:text-cyan-100 transition-colors border-b border-gray-900/30 last:border-0 font-mono"
                        >
                          <span className="text-cyan-700 mr-2">└─</span>
                          {galaxy.label}
                          <span className="ml-2 text-[8px] text-gray-600">({galaxy.id})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
