import type { CameraConfig } from './index';

export const cameraConfig: CameraConfig = {
  animation: {
    duration: 3,
    easing: 'ease-out-cubic',
    startPosition: { x: 0, y: 5, z: 18 },
    endPosition: { x: 0, y: 7.6, z: 4.03 },
    lookAtY: 7.6,
  },
  initial: {
    position: [0, 5, 15],
    fov: 75,
  },
};