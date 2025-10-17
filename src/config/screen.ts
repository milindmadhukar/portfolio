import type { ScreenConfig } from './index';

export const screenConfig: ScreenConfig = {
  startup: {
    delayAfterCamera: 1.5,
    duration: 2.0,
    flashDuration: 0.3,
    flickerFrequency: { start: 15.0, end: 2.0 },
    brightness: { start: 0.3, end: 1.0 },
  },
  crt: {
    curve: 2.5,
    scanlineIntensity: 0.04,
    phosphorGlow: 1.8,
    edgeFade: 0.05,
  },
  canvas: {
    width: 512,
    height: 256,
  },
  text: {
    title: {
      content: 'milind madhukar',
      font: 'bold 28px monospace',
      color: '#FF5C00',
      position: { x: 256, y: 120 },
    },
    terminal: {
      color: '#FF5C00',
      font: '16px monospace',
      position: { y: 160 },
      messages: [
        'system_ready',
        'loading_portfolio',
        'establishing_connection',
        'welcome_user',
      ],
      timing: {
        delayAfterStartup: 1.5,
        cycleDuration: 4.0,
        typingDuration: 2.0,
        cursorBlinkSpeed: { typing: 4, idle: 2 },
      },
      cursor: {
        width: 8,
        height: 16,
        yOffset: 150,
      },
    },
  },
  matrix: {
    colors: {
      primary: '#FF5C00',      // Uniform orange to match text
      secondary: '#FF5C00',    // Same orange for consistency
      background: '#001100',   // Keep dark background
    },
    animation: {
      speed: 1.0,              // Normal speed
      intensity: 0.3,          // Reduced intensity for less brightness
      glitchFrequency: 0.1,    // Occasional glitches
    },
    timing: {
      textDuration: 4.0,       // 4 seconds of text
      matrixDuration: 3.0,     // 3 seconds of matrix
      cloudDuration: 3.0,      // 3 seconds of cloud
      transitionDuration: 0.8, // Longer transition for smoother effect
      delayAfterStartup: 2.0,  // Wait 2 seconds after screen startup
    },
  },
  cloud: {
    colors: {
      primary: '#FF5C00',      // Uniform orange to match text
      secondary: '#000000',    // Dark orange background
      accent: '#FF5C00',       // Same orange for accents
    },
    animation: {
      speed: 1.0,              // Normal animation speed
      intensity: 0.5,          // Medium cloud density
      flowRate: 1.5,           // Moderate flow speed
    },
  },
};
