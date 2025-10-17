import type { PostProcessingConfig } from './index';

export const postProcessingConfig: PostProcessingConfig = {
  bloom: {
    intensity: 2.5,
    luminanceThreshold: 0.4,
    luminanceSmoothing: 0.9,
    mipmapBlur: true,
  },
};
