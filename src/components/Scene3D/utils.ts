import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

// Utility hook for loading GLB models with shadow support
export function useGLBModel(path: string, enableShadows = true) {
  const gltf = useLoader(GLTFLoader, path);
  
  // Clone the scene to avoid sharing materials
  const clonedScene = gltf.scene.clone();
  
  // Enable shadows for all meshes in the model
  if (enableShadows) {
    clonedScene.traverse((child) => {
      if ((child as any).isMesh) {
        (child as any).castShadow = true;
        (child as any).receiveShadow = true;
      }
    });
  }
  
  return clonedScene;
}

// Shared shader generation utility
export function generateCRTShader(screenConfig: any) {
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float iTime;
    uniform vec2 iResolution;
    uniform sampler2D iChannel0;
    uniform float cameraComplete;
    uniform float screenStartupTime;
    varying vec2 vUv;

    #define CURVE ${screenConfig.crt.curve.toFixed(1)}

    vec2 CurvedSurface(vec2 uv, float r) {
      return r * uv / sqrt(r * r - dot(uv, uv));
    }

    vec2 crtCurve(vec2 fragCoord, float r) {
      r = CURVE * r;
      vec2 uv = (fragCoord / iResolution.xy - 0.5) * 2.0;
      uv = CurvedSurface(uv, r);
      uv = (uv / 2.0) + 0.5;
      return uv;
    }

    // Random function for flicker noise
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec2 fragCoord = vUv * iResolution;
      vec4 c = vec4(0.0);
      
      // If camera hasn't finished moving, screen is completely off
      if (cameraComplete < 0.5) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }
      
      // Screen startup animation
      float startupDuration = ${screenConfig.startup.duration.toFixed(1)};
      float startupProgress = clamp(screenStartupTime / startupDuration, 0.0, 1.0);
      
      // Apply CRT curvature to content
      vec2 uvC = crtCurve(fragCoord, 1.0);
      
      // Display content with CRT effects
      if (uvC.x > 0.0 && uvC.x < 1.0 && uvC.y > 0.0 && uvC.y < 1.0) {
        vec4 content = texture2D(iChannel0, uvC);
        
        // CRT scanlines
        float scanline = sin(uvC.y * iResolution.y * 2.0) * ${screenConfig.crt.scanlineIntensity.toFixed(3)} + 0.96;
        content *= scanline;
        
        // Enhanced phosphor glow for bloom
        content *= ${screenConfig.crt.phosphorGlow.toFixed(1)};
        
        // Screen edge fade
        float edge = smoothstep(0.0, ${screenConfig.crt.edgeFade.toFixed(3)}, uvC.x) * 
                    smoothstep(0.0, ${screenConfig.crt.edgeFade.toFixed(3)}, uvC.y) * 
                    smoothstep(1.0, ${(1.0 - screenConfig.crt.edgeFade).toFixed(3)}, uvC.x) * 
                    smoothstep(1.0, ${(1.0 - screenConfig.crt.edgeFade).toFixed(3)}, uvC.y);
        content *= edge;
        
        // Startup flicker effects
        if (startupProgress < 1.0) {
          // Initial power-on flash
          if (screenStartupTime < ${screenConfig.startup.flashDuration.toFixed(1)}) {
            float flash = smoothstep(0.0, ${screenConfig.startup.flashDuration.toFixed(1)}, screenStartupTime) * 
                         (1.0 + sin(screenStartupTime * 60.0) * 0.5);
            content *= flash;
          } else {
            // Stabilization flickers
            float flickerFreq = mix(${screenConfig.startup.flickerFrequency.start.toFixed(1)}, ${screenConfig.startup.flickerFrequency.end.toFixed(1)}, startupProgress);
            float flicker = 0.8 + 0.2 * sin(screenStartupTime * flickerFreq) + 
                           0.1 * random(uvC + screenStartupTime * 0.1);
            
            // Brightness stabilization
            float brightness = mix(${screenConfig.startup.brightness.start.toFixed(1)}, ${screenConfig.startup.brightness.end.toFixed(1)}, startupProgress);
            content *= flicker * brightness;
          }
        }
        
        // Add glow for bloom effect - boost bright areas
        content += content * content * 0.5;
        
        c = content;
      }
      
      gl_FragColor = c;
    }
  `;

  return { vertexShader, fragmentShader };
}

// Create dynamic text texture
export function createTextTexture(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return { canvas, texture, ctx: canvas.getContext('2d')! };
}