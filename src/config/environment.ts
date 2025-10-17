import type { EnvironmentConfig } from './index';

export const environmentConfig: EnvironmentConfig = {
  floor: {
    position: [0, -2, 0],
    rotation: [-Math.PI / 2, 0, 0],
    size: [25, 25],
    material: {
      color: '#666666',
      metalness: 0.3,
      roughness: 0.1,
    },
  },
  walls: {
    back: {
      position: [0, 5, -10],
      size: [25, 15],
      material: { color: '#1a1a1a', metalness: 0.0, roughness: 0.8 },
    },
    sides: {
      size: [20, 15],
      material: { color: '#1a1a1a', metalness: 0.0, roughness: 0.8 },
      positions: {
        left: [-10, 5, 0],
        right: [10, 5, 0],
      },
    },
  },
};