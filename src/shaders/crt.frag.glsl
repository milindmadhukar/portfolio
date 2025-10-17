varying vec2 vUv;

uniform float iTime;
uniform vec2 iResolution;
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
  
  // Apply CRT curvature to content
  vec2 uvC = crtCurve(fragCoord, 1.0);
  
  // Display content with CRT effects
  if (uvC.x > 0.0 && uvC.x < 1.0 && uvC.y > 0.0 && uvC.y < 1.0) {
    vec4 content = texture2D(iChannel0, uvC);
    
    // CRT scanlines
    float scanline = sin(uvC.y * iResolution.y * 2.0) * SCANLINE_INTENSITY + 0.96;
    content *= scanline;
    
    // Enhanced phosphor glow for bloom
    content *= PHOSPHOR_GLOW;
    
    // Screen edge fade
    float edge = smoothstep(0.0, EDGE_FADE, uvC.x) * 
                smoothstep(0.0, EDGE_FADE, uvC.y) * 
                smoothstep(1.0, (1.0 - EDGE_FADE), uvC.x) * 
                smoothstep(1.0, (1.0 - EDGE_FADE), uvC.y);
    content *= edge;
    
    // Startup flicker effects
    if (startupProgress < 1.0) {
      // Initial power-on flash
      if (screenStartupTime < FLASH_DURATION) {
        float flash = smoothstep(0.0, FLASH_DURATION, screenStartupTime) * 
                     (1.0 + sin(screenStartupTime * 60.0) * 0.5);
        content *= flash;
      } else {
        // Stabilization flickers
        float flickerFreq = mix(FLICKER_FREQ_START, FLICKER_FREQ_END, startupProgress);
        float flicker = 0.8 + 0.2 * sin(screenStartupTime * flickerFreq) + 
                       0.1 * random(uvC + screenStartupTime * 0.1);
        
        // Brightness stabilization
        float brightness = mix(BRIGHTNESS_START, BRIGHTNESS_END, startupProgress);
        content *= flicker * brightness;
      }
    }
    
    // Add glow for bloom effect - boost bright areas
    content += content * content * 0.5;
    
    c = content;
  }
  
  gl_FragColor = c;
}