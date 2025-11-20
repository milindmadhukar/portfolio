import type { LightingConfig } from './index';

export const lightingConfig: LightingConfig = {
  ambient: {
    intensity: 0.15,
    color: '#2a2a40',
  },
  directional: {
    position: [5, 10, 12],
    intensity: 0.6,
    color: '#ffffff',
    shadow: {
      mapSize: { width: 2048, height: 2048 },
      camera: {
        far: 50,
        left: -20,
        right: 20,
        top: 20,
        bottom: -20,
      },
    },
  },
  pointLights: [
    
    // Wall glow lights - positioned between server and walls
    { name: 'left-wall-glow-1', position: [-8, 4, 0], intensity: 60, color: '#0040ff', distance: 15 },
    { name: 'left-wall-glow-2', position: [-8, 8, 0], intensity: 50, color: '#0060ff', distance: 12 },
    { name: 'left-wall-glow-3', position: [-8, 12, 0], intensity: 40, color: '#0080ff', distance: 10 },
    
    { name: 'right-wall-glow-1', position: [8, 4, 0], intensity: 80, color: '#ff4000', distance: 15 },
    { name: 'right-wall-glow-2', position: [8, 8, 0], intensity: 70, color: '#ff6000', distance: 12 },
    { name: 'right-wall-glow-3', position: [8, 12, 0], intensity: 60, color: '#ff8000', distance: 10 },
    
    // Back wall accent
    { name: 'back-accent', position: [0, 8, -4], intensity: 25, color: '#00ffff', distance: 8 },

    // Corner accent lights
    { name: 'corner-front-left', position: [-16, 8, 16], intensity: 65, color: '#ff0080', distance: 25 },
    { name: 'corner-front-right', position: [16, 8, 16], intensity: 65, color: '#00ff80', distance: 25 },
    { name: 'corner-back-left', position: [-16, 8, -2], intensity: 45, color: '#8000ff', distance: 20 },
    { name: 'corner-back-right', position: [16, 8, -2], intensity: 45, color: '#ff8000', distance: 20 },
    
    // Ceiling and floor accents
    { name: 'ceiling-accent', position: [0, 14, 8], intensity: 20, color: '#ff00ff', distance: 18 },
    { name: 'floor-accent', position: [0, 1, 12], intensity: 15, color: '#80ff40', distance: 20 },
  ],
};
