import type { ModelsConfig } from './index';

export const modelsConfig: ModelsConfig = {
  server: {
    path: '/models/server/server.glb',
    scale: [5, 5, 5],
    position: [0, -2, 0],
    rotation: [0, 0, 0],
  },
  screenBody: {
    path: '/models/screen/screen_body.glb',
    scale: [5, 5, 5],
    position: [0.8, 7.58, 2.7],
    rotation: [0, 0, 0],
  },
  screenFront: {
    path: '/models/screen/screen_front.glb',
    scale: [5, 5, 5],
    position: [0.8, 7.58, 2.7],
    rotation: [0, 0, 0],
    surface: {
      position: [0.00, 0, 0.003],
      size: [0.27, 0.15],
    },
  },
};
