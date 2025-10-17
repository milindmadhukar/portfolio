import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useState } from "react";

// Global loading state for tracking model loading
let globalLoadingState: {
  loaders: Set<string>;
  loaded: Set<string>;
  listeners: Array<() => void>;
} = {
  loaders: new Set(),
  loaded: new Set(),
  listeners: []
};

export function addGlobalLoadingListener(callback: () => void) {
  globalLoadingState.listeners.push(callback);
  return () => {
    const index = globalLoadingState.listeners.indexOf(callback);
    if (index > -1) {
      globalLoadingState.listeners.splice(index, 1);
    }
  };
}

export function getGlobalLoadingProgress() {
  const total = globalLoadingState.loaders.size;
  const loaded = globalLoadingState.loaded.size;
  return {
    total,
    loaded,
    progress: total > 0 ? (loaded / total) * 100 : 0,
    isLoading: loaded < total
  };
}

// Utility hook for loading GLB models with shadow support and loading tracking
export function useGLBModel(path: string, enableShadows = true) {
  const modelId = `model-${path}`;
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Register this model as a loader
  useEffect(() => {
    if (!isRegistered) {
      globalLoadingState.loaders.add(modelId);
      setIsRegistered(true);
      // Notify listeners
      globalLoadingState.listeners.forEach(cb => cb());
    }
  }, [modelId, isRegistered]);
  
  const gltf = useLoader(GLTFLoader, path, (loader) => {
    // Mark as loaded when the model finishes loading
    if (!globalLoadingState.loaded.has(modelId)) {
      globalLoadingState.loaded.add(modelId);
      // Notify listeners
      globalLoadingState.listeners.forEach(cb => cb());
    }
  });
  
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

// Shared shader generation utility - supports text, matrix, and cloud modes
export function generateCRTShader(screenConfig: any, mode: 'text' | 'matrix' | 'cloud' = 'text') {
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Helper function to convert hex color to vec3
  const hexToVec3 = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return `vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)})`;
  };

  const matrixShader = `
    float time;

    float noise(vec2 p)
    {
      return sin(p.x*10.) * sin(p.y*(3. + sin(time/11.))) + .2; 
    }

    mat2 rotate(float angle)
    {
      return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    }

    float fbm(vec2 p)
    {
      p *= 1.1;
      float f = 0.;
      float amp = .5;
      for( int i = 0; i < 3; i++) {
        mat2 modify = rotate(time/50. * float(i*i));
        f += amp*noise(p);
        p = modify * p;
        p *= 2.;
        amp /= 2.2;
      }
      return f;
    }

    float pattern(vec2 p, out vec2 q, out vec2 r) {
      q = vec2( fbm(p + vec2(1.)), fbm(rotate(.1*time)*p + vec2(1.)));
      r = vec2( fbm(rotate(.1)*q + vec2(0.)), fbm(q + vec2(0.)));
      return fbm(p + 1.*r);
    }

    float sampleFont(vec2 p, float num) {
        float glyph[2];
        if (num < 1.)      { glyph[0] = 0.91333008; glyph[1] = 0.89746094; }
        else if (num < 2.) { glyph[0] = 0.27368164; glyph[1] = 0.06933594; }
        else if (num < 3.) { glyph[0] = 1.87768555; glyph[1] = 1.26513672; }
        else if (num < 4.) { glyph[0] = 1.87719727; glyph[1] = 1.03027344; }
        else if (num < 5.) { glyph[0] = 1.09643555; glyph[1] = 1.51611328; }
        else if (num < 6.) { glyph[0] = 1.97045898; glyph[1] = 1.03027344; }
        else if (num < 7.) { glyph[0] = 0.97045898; glyph[1] = 1.27246094; }
        else if (num < 8.) { glyph[0] = 1.93945312; glyph[1] = 1.03222656; }
        else if (num < 9.) { glyph[0] = 0.90893555; glyph[1] = 1.27246094; }
        else               { glyph[0] = 0.90893555; glyph[1] = 1.52246094; }
        
        float pos = floor(p.x + p.y * 5.);
        if (pos < 13.) {
            return step(1., mod(pow(2., pos) * glyph[0], 2.));
        } else {
            return step(1., mod(pow(2., pos-13.) * glyph[1], 2.));
        }
    }

    float digit(vec2 p){
        p -= vec2(0.5, 0.5);
        p *= (1.+0.15*pow(length(p),0.6));
        p += vec2(0.5, 0.5);
        
        p.x += sin(iTime/7.)/5.;
        p.y += sin(iTime/13.)/5.;
            
        vec2 grid = vec2(3.,1.) * 15.;
        vec2 s = floor(p * grid) / grid;
        p = p * grid;
        vec2 q;
        vec2 r;
        float intensity = pattern(s/10., q, r)*1.3 - 0.03 ;
        p = fract(p);
        p *= vec2(1.2, 1.2);
        float x = fract(p.x * 5.);
        float y = fract((1. - p.y) * 5.);
        vec2 fpos = vec2(floor(p.x * 5.), floor((1. - p.y) * 5.));
        float isOn = sampleFont(fpos, floor(intensity*10.));
        return p.x <= 1. && p.y <= 1. ? isOn * (0.2 + y*4./5.) * (0.75 + x/4.) : 0.;
    }

    float hash(float x){
        return fract(sin(x*234.1)* 324.19 + sin(sin(x*3214.09) * 34.132 * x) + x * 234.12);
    }

    float onOff(float a, float b, float c)
    {
      return step(c, sin(iTime + a*cos(iTime*b)));
    }

    float displace(vec2 look)
    {
        float y = (look.y-mod(iTime/4.,1.));
        float window = 1./(1.+50.*y*y);
      return sin(look.y*20. + iTime)/80.*onOff(4.,2.,.8)*(1.+cos(iTime*60.))*window;
    }

    vec3 getColor(vec2 p){
        float bar = mod(p.y + time*20., 1.) < 0.2 ?  1.4  : 1.;
        p.x += displace(p);
        float middle = digit(p);
        float off = 0.002;
        float sum = 0.;
        for (float i = -1.; i < 2.; i+=1.){
            for (float j = -1.; j < 2.; j+=1.){
                sum += digit(p+vec2(off*i, off*j));
            }
        }
        
        // Use configurable colors with reduced brightness
        vec3 primaryColor = ${screenConfig.matrix ? hexToVec3(screenConfig.matrix.colors.primary) : 'vec3(0.0, 1.0, 0.25)'};
        vec3 secondaryColor = ${screenConfig.matrix ? hexToVec3(screenConfig.matrix.colors.secondary) : 'vec3(1.0, 1.0, 1.0)'};
        
         // Increase brightness slightly for better bloom effect
         return primaryColor * 0.7 * middle + sum/15. * secondaryColor * bar * 0.7;
    }
  `;

  const cloudShader = `
    #define PI2 6.28318530718
    #define PI 3.1416

    float vorocloud(vec2 p){
        float f = 0.0;
        vec2 pp = cos(vec2(p.x * 14.0, (16.0 * p.y + cos(floor(p.x * 30.0)) + iTime * PI2)) );
        p = cos(p * 12.1 + pp * 10.0 + 0.5 * cos(pp.x * 10.0));
        
        vec2 pts[4];
        
        pts[0] = vec2(0.5, 0.6);
        pts[1] = vec2(-0.4, 0.4);
        pts[2] = vec2(0.2, -0.7);
        pts[3] = vec2(-0.3, -0.4);
        
        float d = 5.0;
        
        for(int i = 0; i < 4; i++){
            pts[i].x += 0.03 * cos(float(i)) + p.x;
            pts[i].y += 0.03 * sin(float(i)) + p.y;
            d = min(d, distance(pts[i], pp));
        }
        
        f = 2.0 * pow(1.0 - 0.3 * d, 13.0);
        f = min(f, 1.0);
        
        return f;
    }

    vec4 getCloudColor(vec2 UV){
        float x = UV.x;
        float y = UV.y;
        
        vec2 p = vec2(x, y) - vec2(0.5);
        
        // Use configurable colors for cloud
        vec3 primaryColor = ${screenConfig.cloud ? hexToVec3(screenConfig.cloud.colors.primary) : 'vec3(0.1, 0.6, 0.5)'};
        vec3 secondaryColor = ${screenConfig.cloud ? hexToVec3(screenConfig.cloud.colors.secondary) : 'vec3(0.0, 0.02, 0.0)'};
        vec3 accentColor = ${screenConfig.cloud ? hexToVec3(screenConfig.cloud.colors.accent) : 'vec3(0.5, 0.5, 1.0)'};
        
        vec4 col = vec4(secondaryColor, 1.0);
        
        float v = vorocloud(p);
        v = 0.2 * floor(v * 5.0);
        
        col.rgb += primaryColor * v;
        col.b += accentColor.b * pow(v, 5.0);
        
        v = vorocloud(p * 2.0);
        v = 0.2 * floor(v * 5.0);
        
        col.rgb += primaryColor * 0.5 * v;
        col.b += accentColor.b * 0.01 * pow(v, 5.0);
        
        col.a = 1.0;
        
        return col;
    }
  `;

  const fragmentShader = `
    uniform float iTime;
    uniform vec2 iResolution;
    uniform sampler2D iChannel0;
    uniform float cameraComplete;
    uniform float screenStartupTime;
    uniform float showMatrix; // 0 = show text, 1 = show matrix, 2 = show cloud
    uniform float transitionProgress; // 0-1 for smooth transitions
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    ${mode === 'matrix' || mode === 'cloud' ? matrixShader : ''}
    ${mode === 'cloud' ? cloudShader : ''}

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
      
      // Use flat UV coordinates
      vec2 uvC = vUv;
      
      vec4 content;
      
      ${mode === 'matrix' || mode === 'cloud' ? `
        // Multi-mode support with fade transitions
        vec4 textContent = texture2D(iChannel0, uvC);
        vec4 matrixContent;
        vec4 cloudContent;
        
        // Calculate matrix content
        time = iTime / 3.;
        vec3 matrixColor = getColor(uvC);
        matrixContent = vec4(matrixColor, 1.0);
        
        // Calculate cloud content
        cloudContent = getCloudColor(uvC);
        
        // Handle fade transitions
        if (transitionProgress > 0.0) {
          // Fade out current mode, fade in next mode
          vec4 currentContent;
          vec4 nextContent;
          
          if (showMatrix < 0.5) {
            // Transitioning from text
            currentContent = textContent;
            nextContent = matrixContent;
          } else if (showMatrix < 1.5) {
            // Transitioning from matrix
            currentContent = matrixContent;
            nextContent = cloudContent;
          } else {
            // Transitioning from cloud
            currentContent = cloudContent;
            nextContent = textContent;
          }
          
          // Smooth fade with sine curve for natural feel
          float fadeProgress = smoothstep(0.0, 1.0, transitionProgress);
          content = mix(currentContent, nextContent, fadeProgress);
        } else {
          // No transition - show current mode
          if (showMatrix < 0.5) {
            content = textContent;
          } else if (showMatrix < 1.5) {
            content = matrixContent;
          } else {
            content = cloudContent;
          }
        }
      ` : `
        // Text mode - always show text
        content = texture2D(iChannel0, uvC);
      `}
      
      // CRT scanlines
      float scanline = sin(uvC.y * iResolution.y * 2.0) * ${screenConfig.crt.scanlineIntensity.toFixed(3)} + 0.96;
      content *= scanline;
      
      // Enhanced phosphor glow for bloom
      content *= ${screenConfig.crt.phosphorGlow.toFixed(1)};
      
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