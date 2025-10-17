import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import { config } from "../../config";
import { useGLBModel, generateCRTShader, createTextTexture } from "./utils";
import { cameraAnimationComplete } from "./CameraController";

export function ScreenFrontModel() {
  const groupRef = useRef<Group>(null!);
  const { screenFront } = config.models;
  const screenConfig = config.screen;
  
  const clonedScene = useGLBModel(screenFront.path);

  // Apply bloom to emissive materials
  clonedScene.traverse((child) => {
    if ((child as any).isMesh) {
      const material = (child as any).material;
      if (material) {
        material.emissive = new THREE.Color(0x002200); // Subtle green emission
        material.emissiveIntensity = 0.1;
      }
    }
  });

  // Create dynamic text texture for the CRT display
  const textTexture = useMemo(() => {
    return createTextTexture(screenConfig.canvas.width, screenConfig.canvas.height);
  }, [screenConfig.canvas.width, screenConfig.canvas.height]);

  // State for text/matrix/cloud cycling with fade transitions
  const [currentMode, setCurrentMode] = useState<'text' | 'matrix' | 'cloud'>('text');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const cycleTiming = useRef({ lastSwitch: 0, transitionStart: 0 });

  // Create CRT shader material with cloud support
  const crtMaterial = useMemo(() => {
    const { vertexShader, fragmentShader } = generateCRTShader(screenConfig, 'cloud');
    
    return new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(screenConfig.canvas.width, screenConfig.canvas.height) },
        iChannel0: { value: textTexture.texture },
        textLine1: { value: screenConfig.text.title.content },
        textLine2: { value: '> system_ready_' },
        cameraComplete: { value: 0 }, // 0 = camera moving, 1 = camera complete
        screenStartupTime: { value: 0 }, // Time since screen startup began
        showMatrix: { value: 0 }, // 0 = show text, 1 = show matrix, 2 = show cloud
        transitionProgress: { value: 0 }, // 0-1 for smooth transitions
      },
      vertexShader,
      fragmentShader,
      toneMapped: true,
    });
  }, [textTexture.texture, screenConfig]);

  // Update text dynamically and handle text/matrix cycling
  const screenStartTime = useRef<number | null>(null);
  
  useFrame((state) => {
    if (crtMaterial && textTexture.ctx) {
      // Update shader time
      crtMaterial.uniforms.iTime.value = state.clock.elapsedTime;
      
      // Update camera completion status
      crtMaterial.uniforms.cameraComplete.value = cameraAnimationComplete ? 1 : 0;
      
      // Track screen startup timing
      if (cameraAnimationComplete && screenStartTime.current === null) {
        screenStartTime.current = state.clock.elapsedTime;
        cycleTiming.current.lastSwitch = state.clock.elapsedTime; // Start cycling timer
      }
      
      if (screenStartTime.current !== null) {
        crtMaterial.uniforms.screenStartupTime.value = state.clock.elapsedTime - screenStartTime.current;
        
        // Handle text/matrix/cloud cycling with fade transitions
        const startupDuration = screenConfig.startup.duration;
        const timeSinceStartup = state.clock.elapsedTime - screenStartTime.current;
        const { matrix } = screenConfig;
        
        if (timeSinceStartup > startupDuration + matrix.timing.delayAfterStartup) {
          const timeSinceLastSwitch = state.clock.elapsedTime - cycleTiming.current.lastSwitch;
          let currentDuration: number;
          
          // Determine current mode duration
          switch (currentMode) {
            case 'text':
              currentDuration = matrix.timing.textDuration;
              break;
            case 'matrix':
              currentDuration = matrix.timing.matrixDuration;
              break;
            case 'cloud':
              currentDuration = matrix.timing.cloudDuration;
              break;
          }
          
          if (timeSinceLastSwitch >= currentDuration && !isTransitioning) {
            // Start fade transition
            setIsTransitioning(true);
            cycleTiming.current.transitionStart = state.clock.elapsedTime;
          }
          
          // Handle fade transition progress
          if (isTransitioning) {
            const transitionTime = state.clock.elapsedTime - cycleTiming.current.transitionStart;
            const transitionProgress = Math.min(transitionTime / matrix.timing.transitionDuration, 1.0);
            
            crtMaterial.uniforms.transitionProgress.value = transitionProgress;
            
            if (transitionProgress >= 1.0) {
              // Transition complete - switch to next mode
              const nextMode = currentMode === 'text' ? 'matrix' : 
                              currentMode === 'matrix' ? 'cloud' : 'text';
              setCurrentMode(nextMode);
              setIsTransitioning(false);
              cycleTiming.current.lastSwitch = state.clock.elapsedTime;
              crtMaterial.uniforms.transitionProgress.value = 0;
            }
          } else {
            crtMaterial.uniforms.transitionProgress.value = 0;
          }
        }
        
        // Update shader mode value
        const modeValue = currentMode === 'text' ? 0 : 
                         currentMode === 'matrix' ? 1 : 2;
        crtMaterial.uniforms.showMatrix.value = modeValue;
      }
      
      // Update text canvas every few frames for performance (only when showing text)
      if (Math.floor(state.clock.elapsedTime * 2) % 2 === 0 && currentMode === 'text') {
        const ctx = textTexture.ctx;
        
        // Clear with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, screenConfig.canvas.width, screenConfig.canvas.height);
        
        // Only draw text if screen has started up
        if (cameraAnimationComplete && screenStartTime.current !== null) {
          const startupTime = state.clock.elapsedTime - screenStartTime.current;
          
          // Draw title text
          const { title } = screenConfig.text;
          ctx.fillStyle = title.color;
          ctx.font = title.font;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(title.content, title.position.x, title.position.y);
          
          // Terminal command line with smooth typing animation (only after startup stabilizes)
          if (startupTime > screenConfig.text.terminal.timing.delayAfterStartup) {
            const terminalStartTime = startupTime - screenConfig.text.terminal.timing.delayAfterStartup;
            const { terminal } = screenConfig.text;
            
            ctx.fillStyle = terminal.color;
            ctx.font = terminal.font;
            
            // Each message cycle
            const { cycleDuration, typingDuration, cursorBlinkSpeed } = terminal.timing;
            const currentCycle = Math.floor(terminalStartTime / cycleDuration);
            const cycleProgress = (terminalStartTime % cycleDuration);
            
            const currentMessage = terminal.messages[currentCycle % terminal.messages.length];
            
            // Calculate the full line with arrow and message for centering
            const fullLine = '> ' + currentMessage;
            const fullLineWidth = ctx.measureText(fullLine).width;
            const startX = (screenConfig.canvas.width - fullLineWidth) / 2;
            
            // Always draw the prompt arrow first
            ctx.textAlign = 'left';
            ctx.fillText('>', startX, terminal.position.y);
            
            if (cycleProgress < typingDuration) {
              // Typing phase: smooth character-by-character reveal
              const typingProgress = cycleProgress / typingDuration;
              const totalChars = currentMessage.length;
              const charsToShow = Math.floor(typingProgress * totalChars);
              const partialMessage = currentMessage.substring(0, charsToShow);
              
              // Draw the typed portion of the message
              if (partialMessage.length > 0) {
                const arrowWidth = ctx.measureText('> ').width;
                ctx.fillText(partialMessage, startX + arrowWidth, terminal.position.y);
              }
              
              // Draw blinking cursor block at the end of typed text
              const showCursor = Math.floor(state.clock.elapsedTime * cursorBlinkSpeed.typing) % 2 === 0;
              if (showCursor) {
                const arrowWidth = ctx.measureText('> ').width;
                const typedWidth = ctx.measureText(partialMessage).width;
                const cursorX = startX + arrowWidth + typedWidth;
                
                // Draw cursor as a filled rectangle (terminal block cursor)
                ctx.fillRect(cursorX, terminal.cursor.yOffset, terminal.cursor.width, terminal.cursor.height);
              }
            } else {
              // Display phase: show complete message with blinking cursor at end
              const arrowWidth = ctx.measureText('> ').width;
              ctx.fillText(currentMessage, startX + arrowWidth, terminal.position.y);
              
              // Blinking cursor at the end of complete message
              const showCursor = Math.floor(state.clock.elapsedTime * cursorBlinkSpeed.idle) % 2 === 0;
              if (showCursor) {
                const messageWidth = ctx.measureText(currentMessage).width;
                const cursorX = startX + arrowWidth + messageWidth;
                ctx.fillRect(cursorX, terminal.cursor.yOffset, terminal.cursor.width, terminal.cursor.height);
              }
            }
          }
        }
        
        // Update texture
        textTexture.texture.needsUpdate = true;
      } else if (currentMode !== 'text') {
        // Clear canvas when showing matrix or cloud (both rendered by shader)
        const ctx = textTexture.ctx;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, screenConfig.canvas.width, screenConfig.canvas.height);
        textTexture.texture.needsUpdate = true;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      scale={screenFront.scale}
      position={screenFront.position}
      rotation={screenFront.rotation}
    >
      <primitive object={clonedScene} />
      
      {/* CRT Screen surface with enhanced effects for bloom */}
      <mesh position={screenFront.surface.position as [number, number, number]}>
        <planeGeometry args={screenFront.surface.size} />
        <primitive object={crtMaterial} attach="material" />
      </mesh>
    </group>
  );
}