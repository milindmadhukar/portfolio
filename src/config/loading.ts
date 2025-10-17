export const loadingConfig = {
  // Loading UI settings
  ui: {
    title: "Loading Experience",
    showProgress: true,
    showAssetCount: true,
    showCurrentItem: true,
    showErrors: true,
  },
  
  // Timing settings
  timing: {
    minimumLoadTime: 500, // Minimum time to show loading screen (ms)
    fadeOutDuration: 300, // Fade out animation duration (ms)
    completionDelay: 100, // Delay before marking as complete (ms)
  },
  
  // Visual settings
  progress: {
    smoothTransition: true,
    animationDuration: 300,
    glowEffect: true,
  },
  
  // Debug settings
  debug: {
    logProgress: false,
    logErrors: true,
    showLoadingTime: false,
  }
};

export type LoadingConfig = typeof loadingConfig;