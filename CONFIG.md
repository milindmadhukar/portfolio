# Configuration System Documentation

## Overview

The Scene3D component now uses a centralized configuration system located in `/src/config/index.ts`. This allows you to easily modify all visual parameters, animations, and behavior without touching the main component code.

## Configuration Structure

The configuration is organized into logical sections:

- **`debug`**: Toggle development features (orbit controls, debug stats)
- **`camera`**: Animation duration, positions, and initial settings
- **`lighting`**: Ambient light, directional light, and all point lights
- **`environment`**: Floor and wall properties (materials, positions, sizes)
- **`models`**: 3D model paths, scales, positions, and rotations (server, screenBody, screenFront)
- **`screen`**: CRT effects, startup animation, text content, and terminal behavior
- **`postProcessing`**: Bloom and other visual effects
- **`canvas`**: Three.js canvas settings and controls

## Example Customizations

### Change Debug Mode
```typescript
// In /src/config/index.ts
export function loadConfig(): SceneConfig {
  return {
    debug: true, // Enable orbit controls and debug stats
    // ... rest of config
  };
}
```

### Modify Camera Animation
```typescript
camera: {
  animation: {
    duration: 5, // Make camera animation 5 seconds instead of 3
    startPosition: { x: 0, y: 10, z: 25 }, // Start further back and higher
    endPosition: { x: 0, y: 8, z: 3 }, // End closer to screen
  },
  // ...
}
```

### Customize Screen Text
```typescript
screen: {
  text: {
    title: {
      content: 'your name here', // Change the main title
      color: '#ff0041', // Make it red instead of green
    },
    terminal: {
      messages: [
        'initializing_system',
        'loading_projects',
        'ready_to_hire', // Custom terminal messages
      ],
      timing: {
        cycleDuration: 6.0, // Slower message cycling
        typingDuration: 3.0, // Slower typing
      },
    },
  },
}
```

### Adjust CRT Effects
```typescript
screen: {
  crt: {
    curve: 3.5, // More screen curvature
    phosphorGlow: 2.5, // Brighter glow
    scanlineIntensity: 0.08, // More pronounced scanlines
  },
  startup: {
    duration: 3.0, // Longer startup animation
    flickerFrequency: { start: 20.0, end: 1.0 }, // More dramatic flicker
  },
}
```

### Modify Lighting Setup
```typescript
lighting: {
  pointLights: [
    // Add a new dramatic light
    { 
      name: 'dramatic-spot', 
      position: [0, 15, 5], 
      intensity: 50, 
      color: '#ff0080', 
      distance: 30 
    },
    // ... existing lights
  ],
}
```

### Customize Screen Models
```typescript
models: {
  screenBody: {
    path: '/models/screen/screen_body.glb', // The main screen housing
    position: [0.8, 7.58, 2.7],
  },
  screenFront: {
    path: '/models/screen/screen_front.glb', // The screen surface with CRT effects
    position: [0.8, 7.58, 2.7],
    surface: {
      position: [0, 0, 0.01], // Offset for the display surface
      size: [0.3, 0.2], // Display dimensions
    },
  },
}
```

## Screen Components

The screen is now separated into two components:
- **ScreenBodyModel**: The main screen housing/monitor body (no effects)
- **ScreenFrontModel**: The screen surface with CRT shader, bloom effects, and text display

This separation allows for:
- Better visual effects targeting only the screen surface
- Enhanced bloom and glow effects on the display
- Cleaner model organization
- Independent positioning and scaling if needed

## Benefits

1. **Clean Code**: All configuration is separate from logic
2. **Easy Customization**: Change any value without understanding the component internals
3. **Type Safety**: Full TypeScript support with proper interfaces
4. **Centralized**: One place to manage all visual parameters
5. **Maintainable**: Clear organization and documentation

## Adding New Configuration Options

To add new configurable values:

1. Add the property to the appropriate interface in `/src/config/index.ts`
2. Set the default value in the `loadConfig()` function
3. Use the config value in your component: `config.section.property`

The configuration system is designed to be extensible and maintainable for future development!