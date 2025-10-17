import type { LightingConfig } from './index';

export const lightingConfig: LightingConfig = {
  ambient: {
    intensity: 0.4,
    color: '#ffffff',
  },
  directional: {
    position: [5, 8, 5],
    intensity: 1.2,
    color: '#ffffff',
    shadow: {
      mapSize: { width: 2048, height: 2048 },
      camera: {
        far: 50,
        left: -15,
        right: 15,
        top: 15,
        bottom: -15,
      },
    },
  },
  pointLights: [
    { name: 'neon-top', position: [0, 20, -8], intensity: 30, color: '#00ffff', distance: 25 },
    { name: 'neon-left', position: [-6, 6, -8], intensity: 25, color: '#ff00ff', distance: 20 },
    { name: 'neon-right', position: [6, 6, -8], intensity: 25, color: '#00ff00', distance: 20 },
    { name: 'floor-left', position: [-8, 2, 0], intensity: 25, color: '#ffff00', distance: 18 },
    { name: 'floor-right', position: [8, 2, 0], intensity: 25, color: '#ff4400', distance: 18 },
    { name: 'floor-front', position: [0, 2, 6], intensity: 18, color: '#4400ff', distance: 15 },
    { name: 'wall-left', position: [-10, 4, 0], intensity: 15, color: '#ff0080', distance: 16 },
    { name: 'wall-right', position: [10, 4, 0], intensity: 15, color: '#80ff00', distance: 16 },
    { name: 'floor-ambient', position: [0, 0.5, 0], intensity: 10, color: '#ffffff', distance: 12 },
  ],
};