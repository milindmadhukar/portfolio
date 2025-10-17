import type { PostProcessingConfig } from './index';

export const postProcessingConfig: PostProcessingConfig = {
  bloom: {
    intensity: 2.0,
    luminanceThreshold: 0.9,
    luminanceSmoothing: 0.9,
    mipmapBlur: true,
  },
};