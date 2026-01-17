/**
 * Feature flags for performance optimizations
 * Enable/disable features for gradual rollout and A/B testing
 */

export const OPTIMIZATION_FLAGS = {
  // Phase 1: Instancing
  // TEMPORARILY DISABLED: Instancing breaks hierarchical rendering (planets/satellites disappear)
  ENABLE_INSTANCED_STARS: false, // TODO: Fix to render children recursively
  ENABLE_INSTANCED_CRYSTALS: true, // This works correctly
  ENABLE_INSTANCED_METEORS: false, // Not yet implemented

  // Phase 2: LOD System
  ENABLE_GPU_ORBITS: true,
  ENABLE_DYNAMIC_LOD: false, // Not yet implemented

  // Phase 3: Performance Monitor
  ENABLE_PERFORMANCE_MONITOR: false, // Not yet implemented

  // Phase 4: FFT Optimization
  ENABLE_FFT_OPTIMIZATION: false, // Not yet implemented

  // Debug mode: Show performance metrics in console
  DEBUG_PERFORMANCE: true
} as const;

export type OptimizationFlags = typeof OPTIMIZATION_FLAGS;
