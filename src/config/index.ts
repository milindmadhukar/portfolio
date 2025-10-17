// TypeScript interfacesindex
export interface SceneConfig {
  debug: boolean;
  camera: CameraConfig;
  lighting: LightingConfig;
  environment: EnvironmentConfig;
  models: ModelsConfig;
  screen: ScreenConfig;
  postProcessing: PostProcessingConfig;
  canvas: CanvasConfig;
}

export interface CameraConfig {
  animation: {
    duration: number;
    easing: 'ease-out-cubic' | 'linear' | 'ease-in-out';
    startPosition: { x: number; y: number; z: number };
    endPosition: { x: number; y: number; z: number };
    lookAtY: number;
  };
  initial: {
    position: [number, number, number];
    fov: number;
  };
  debug: {
    position: [number, number, number];
    lookAt: [number, number, number];
  };
}

export interface LightingConfig {
  ambient: {
    intensity: number;
    color: string;
  };
  directional: {
    position: [number, number, number];
    intensity: number;
    color: string;
    shadow: {
      mapSize: { width: number; height: number };
      camera: {
        far: number;
        left: number;
        right: number;
        top: number;
        bottom: number;
      };
    };
  };
  pointLights: Array<{
    name: string;
    position: [number, number, number];
    intensity: number;
    color: string;
    distance: number;
  }>;
}

export interface EnvironmentConfig {
  floor: {
    position: [number, number, number];
    rotation: [number, number, number];
    size: [number, number];
    material: {
      color: string;
      metalness: number;
      roughness: number;
    };
  };
  walls: {
    back: {
      position: [number, number, number];
      size: [number, number];
      material: { color: string; metalness: number; roughness: number };
    };
    front: {
      position: [number, number, number];
      size: [number, number];
      material: { color: string; metalness: number; roughness: number };
    };
    sides: {
      size: [number, number];
      material: { color: string; metalness: number; roughness: number };
      positions: {
        left: [number, number, number];
        right: [number, number, number];
      };
    };
    ceiling: {
      position: [number, number, number];
      rotation: [number, number, number];
      size: [number, number];
      material: { color: string; metalness: number; roughness: number };
    };
  };
}

export interface ModelsConfig {
  server: {
    path: string;
    scale: [number, number, number];
    position: [number, number, number];
    rotation: [number, number, number];
  };
  screenBody: {
    path: string;
    scale: [number, number, number];
    position: [number, number, number];
    rotation: [number, number, number];
  };
  screenFront: {
    path: string;
    scale: [number, number, number];
    position: [number, number, number];
    rotation: [number, number, number];
    surface: {
      position: [number, number, number];
      size: [number, number];
    };
  };
}

export interface ScreenConfig {
  startup: {
    delayAfterCamera: number;
    duration: number;
    flashDuration: number;
    flickerFrequency: { start: number; end: number };
    brightness: { start: number; end: number };
  };
  crt: {
    curve: number;
    scanlineIntensity: number;
    phosphorGlow: number;
    edgeFade: number;
  };
  canvas: {
    width: number;
    height: number;
  };
  text: {
    title: {
      content: string;
      font: string;
      color: string;
      position: { x: number; y: number };
    };
    terminal: {
      color: string;
      font: string;
      position: { y: number };
      messages: string[];
      timing: {
        delayAfterStartup: number;
        cycleDuration: number;
        typingDuration: number;
        cursorBlinkSpeed: { typing: number; idle: number };
      };
      cursor: {
        width: number;
        height: number;
        yOffset: number;
      };
    };
  };
  matrix: {
    colors: {
      primary: string;      // Main matrix numbers color
      secondary: string;    // Glow/highlight color  
      background: string;   // Background tint
    };
    animation: {
      speed: number;        // Overall animation speed multiplier
      intensity: number;    // Digital effect intensity
      glitchFrequency: number; // Frequency of glitch effects
    };
    timing: {
      textDuration: number;     // How long to show text (seconds)
      matrixDuration: number;   // How long to show matrix (seconds)
      cloudDuration: number;    // How long to show cloud (seconds)
      transitionDuration: number; // Transition fade time (seconds)
      delayAfterStartup: number; // Wait time after screen startup
    };
  };
  cloud: {
    colors: {
      primary: string;      // Main cloud color
      secondary: string;    // Background/base color
      accent: string;       // Accent highlights
    };
    animation: {
      speed: number;        // Animation speed multiplier
      intensity: number;    // Cloud density/intensity
      flowRate: number;     // How fast the clouds move
    };
  };
}

export interface PostProcessingConfig {
  bloom: {
    intensity: number;
    luminanceThreshold: number;
    luminanceSmoothing: number;
    mipmapBlur: boolean;
  };
}

export interface CanvasConfig {
  shadows: boolean;
  orbitControls: {
    enablePan: boolean;
    enableZoom: boolean;
    enableRotate: boolean;
    minDistance: number;
    maxDistance: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    minAzimuthAngle?: number;
    maxAzimuthAngle?: number;
    boundingBox?: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
}

// Import configuration values from separate files
import { modelsConfig } from './models';
import { screenConfig } from './screen';
import { environmentConfig } from './environment';
import { cameraConfig } from './camera';
import { lightingConfig } from './lighting';
import { postProcessingConfig } from './postprocessing';
import { canvasConfig } from './canvas';

// Load configuration
export function loadConfig(): SceneConfig {
  return {
    debug: false,
    camera: cameraConfig,
    lighting: lightingConfig,
    environment: environmentConfig,
    models: modelsConfig,
    screen: screenConfig,
    postProcessing: postProcessingConfig,
    canvas: canvasConfig,
  };
}

// Global config instance
export const config = loadConfig();
