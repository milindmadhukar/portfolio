import type { EnvironmentConfig } from './index';

export const environmentConfig: EnvironmentConfig = {
  floor: {
    position: [0, -2, 0],
    rotation: [-Math.PI / 2, 0, 0],
    size: [35, 35],
    material: {
      color: '#2a2a2a',
      metalness: 0.1,
      roughness: 0.8,
    },
  },
  walls: {
    back: {
      position: [0, 6.5, -3],
      size: [35, 20],
      material: { color: '#1c1c1c', metalness: 0.0, roughness: 0.9 },
    },
    front: {
      position: [0, 6.5, 17],
      size: [35, 20],
      material: { color: '#1c1c1c', metalness: 0.0, roughness: 0.9 },
    },
    sides: {
      size: [20, 20],
      material: { color: '#1c1c1c', metalness: 0.0, roughness: 0.9 },
      positions: {
        left: [-17.5, 6.5, 7],
        right: [17.5, 6.5, 7],
      },
    },
    ceiling: {
      position: [0, 15, 7],
      rotation: [Math.PI / 2, 0, 0],
      size: [35, 20],
      material: { color: '#0a0a0a', metalness: 0.0, roughness: 0.95 },
    },
  },
};