varying vec2 vUv;

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 displayResolution;
uniform sampler2D iChannel0;
uniform float cameraComplete;
uniform float screenStartupTime;

// Configuration constants (to be replaced dynamically)
#define CURVE 2.5
#define SCANLINE_INTENSITY 0.04
#define PHOSPHOR_GLOW 1.8
#define EDGE_FADE 0.05
#define STARTUP_DURATION 2.0
#define FLASH_DURATION 0.3
#define FLICKER_FREQ_START 15.0
#define FLICKER_FREQ_END 2.0
#define BRIGHTNESS_START 0.3
#define BRIGHTNESS_END 1.0

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

// Simple chunky pixel VFD functions
vec2 getPixelCoord(vec2 uv, vec2 resolution) {
  return floor(uv * resolution);
}

float createChunkyPixel(vec2 uv, vec2 resolution) {
  // Get which pixel we're in
  vec2 pixelCoord = getPixelCoord(uv, resolution);
  vec2 pixelCenter = (pixelCoord + 0.5) / resolution;
  
  // Sample text at pixel center
  vec4 textSample = texture2D(iChannel0, pixelCenter);
  float textIntensity = (textSample.r + textSample.g + textSample.b) / 3.0;
  
  // Create pixel boundaries with gaps
  vec2 pixelUV = fract(uv * resolution);
  float pixelMask = step(0.1, pixelUV.x) * step(pixelUV.x, 0.9) * 
                    step(0.1, pixelUV.y) * step(pixelUV.y, 0.9);
  
  // Only light up if text is present AND we're inside pixel bounds
  return pixelMask * step(0.1, textIntensity);
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
  float startupProgress = clamp(screenStartupTime / STARTUP_DURATION, 0.0, 1.0);
  
  // Create chunky VFD pixels
  float pixelLit = createChunkyPixel(vUv, displayResolution);
  
  vec4 content = vec4(0.0, 0.0, 0.0, 1.0); // Default black
  
  if (pixelLit > 0.0) {
    // Light up pixel with orange VFD color
    content = vec4(1.0, 0.36, 0.0, 1.0); // Orange #FF5C00
    
    // Apply basic CRT effects only to lit pixels
    if (startupProgress < 1.0) {
      if (screenStartupTime < FLASH_DURATION) {
        float flash = smoothstep(0.0, FLASH_DURATION, screenStartupTime);
        content *= flash;
      } else {
        float flickerFreq = mix(FLICKER_FREQ_START, FLICKER_FREQ_END, startupProgress);
        float flicker = 0.8 + 0.2 * sin(screenStartupTime * flickerFreq);
        float brightness = mix(BRIGHTNESS_START, BRIGHTNESS_END, startupProgress);
        content *= flicker * brightness;
      }
    }
    
    // Add glow for bloom
    content += content * content * 0.3;
  }
  
  c = content;
  
  gl_FragColor = c;
}