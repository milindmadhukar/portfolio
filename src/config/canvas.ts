import type { CanvasConfig } from './index';

export const canvasConfig: CanvasConfig = {
  shadows: true,
  orbitControls: {
    enablePan: true,
    enableZoom: true,
    enableRotate: true,
    minDistance: 2,
    maxDistance: 18,
    minPolarAngle: 0.2,
    maxPolarAngle: Math.PI * 0.85,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
    boundingBox: {
      min: [-16, 0, -2],
      max: [16, 14, 16]
    }
  },
};