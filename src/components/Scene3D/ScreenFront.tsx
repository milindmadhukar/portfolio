import { useRef, useMemo } from "react";
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

  // Create enhanced CRT shader material with bloom support
  const crtMaterial = useMemo(() => {
    const { vertexShader, fragmentShader } = generateCRTShader(screenConfig);
    
    return new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(screenConfig.canvas.width, screenConfig.canvas.height) },
        iChannel0: { value: textTexture.texture },
        textLine1: { value: screenConfig.text.title.content },
        textLine2: { value: '> system_ready_' },
        cameraComplete: { value: 0 }, // 0 = camera moving, 1 = camera complete
        screenStartupTime: { value: 0 }, // Time since screen startup began
      },
      vertexShader,
      fragmentShader,
      toneMapped: false,
    });
  }, [textTexture.texture, screenConfig]);

  // Update text dynamically
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
      }
      
      if (screenStartTime.current !== null) {
        crtMaterial.uniforms.screenStartupTime.value = state.clock.elapsedTime - screenStartTime.current;
      }
      
      // Update text canvas every few frames for performance
      if (Math.floor(state.clock.elapsedTime * 2) % 2 === 0) {
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