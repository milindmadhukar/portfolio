import type { CanvasConfig } from './index';

export const canvasConfig: CanvasConfig = {
  shadows: true,
  orbitControls: {
    enablePan: true,
    enableZoom: true,
    enableRotate: true,
    minDistance: 1,
    maxDistance: 25,
  },
};