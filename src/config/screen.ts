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
};