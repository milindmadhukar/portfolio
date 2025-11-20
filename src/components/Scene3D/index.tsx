import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useRef, useState } from "react";
import { EffectComposer, Bloom, SMAA, N8AO } from "@react-three/postprocessing";
import * as THREE from "three";
import { config } from "../../config";

import { CameraController } from "./CameraController";
import { Lighting } from "./Lighting";
import { Floor, Walls } from "./Environment";
import { ServerModel, ScreenBodyModel, FanBladesModel } from "./Models";
import { ScreenFrontModel } from "./ScreenFront";
import { LoadingManager } from "./LoadingManager";

function DebugStats({ onStatsUpdate }: { onStatsUpdate: (stats: any) => void }) {
  const { camera, gl, scene } = useThree();
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    
    if (now - lastTime.current >= 100) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      frameCount.current = 0;
      lastTime.current = now;
      
      const position: [number, number, number] = [
        Math.round(camera.position.x * 100) / 100,
        Math.round(camera.position.y * 100) / 100,
        Math.round(camera.position.z * 100) / 100
      ];

      const target = new THREE.Vector3();
      camera.getWorldDirection(target);
      target.add(camera.position);
      const lookingAt: [number, number, number] = [
        Math.round(target.x * 100) / 100,
        Math.round(target.y * 100) / 100,
        Math.round(target.z * 100) / 100
      ];

      const info = gl.info;
      
      let meshCount = 0;
      let triangles = 0;
      scene.traverse((child) => {
        if ((child as any).isMesh) {
          meshCount++;
          const geometry = (child as any).geometry;
          if (geometry && geometry.index) {
            triangles += geometry.index.count / 3;
          } else if (geometry && geometry.attributes.position) {
            triangles += geometry.attributes.position.count / 3;
          }
        }
      });
      
      onStatsUpdate({
        fps,
        position,
        lookingAt,
        fov: Math.round((camera as any).fov),
        meshCount,
        triangles: Math.round(triangles),
        drawCalls: info.render.calls,
        programs: info.programs?.length || 0,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      });
    }
  });

  return null;
}

function LoadingSpinner() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

export default function Scene3D() {
  const bloom = config.postProcessing.bloom;
  const canvasConfig = config.canvas;
  const [isLoaded, setIsLoaded] = useState(false);
  const [debugStats, setDebugStats] = useState({
    fps: 0,
    position: [0, 0, 0] as [number, number, number],
    lookingAt: [0, 0, 0] as [number, number, number],
    fov: 0,
    meshCount: 0,
    triangles: 0,
    drawCalls: 0,
    programs: 0,
    geometries: 0,
    textures: 0,
  });

  const handleStatsUpdate = (stats: any) => {
    setDebugStats(stats);
  };

  const handleLoadingComplete = (loaded: boolean) => {
    setIsLoaded(loaded);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <LoadingManager onLoadingComplete={handleLoadingComplete}>
        <Canvas 
          camera={{ 
            position: config.debug ? config.camera.debug.position : config.camera.initial.position, 
            fov: config.camera.initial.fov 
          }} 
          shadows={canvasConfig.shadows}
        >
          <CameraController />
          <Lighting />
          <Floor />
          <Walls />

          <Suspense fallback={<LoadingSpinner />}>
            <ServerModel />
            <ScreenBodyModel />
            <ScreenFrontModel />
            <FanBladesModel />
          </Suspense>

          {config.debug && <DebugStats onStatsUpdate={handleStatsUpdate} />}

          {/* Conditional OrbitControls for development */}
          {config.debug && isLoaded && (
            <OrbitControls
              enablePan={canvasConfig.orbitControls.enablePan}
              enableZoom={canvasConfig.orbitControls.enableZoom}
              enableRotate={canvasConfig.orbitControls.enableRotate}
              minDistance={canvasConfig.orbitControls.minDistance}
              maxDistance={canvasConfig.orbitControls.maxDistance}
              minPolarAngle={canvasConfig.orbitControls.minPolarAngle}
              maxPolarAngle={canvasConfig.orbitControls.maxPolarAngle}
              minAzimuthAngle={canvasConfig.orbitControls.minAzimuthAngle}
              maxAzimuthAngle={canvasConfig.orbitControls.maxAzimuthAngle}
              target={config.camera.debug.lookAt}
            />
          )}

          {/* Post-processing effects for bloom and ambient occlusion */}
          <EffectComposer>
            <N8AO 
              intensity={0.3}
              aoRadius={0.15}
              aoSamples={32}
              denoiseSamples={4}
              distanceFalloff={0.1}
              quality="medium"
            />
            <Bloom 
              intensity={bloom.intensity} 
              luminanceThreshold={bloom.luminanceThreshold} 
              luminanceSmoothing={bloom.luminanceSmoothing}
              mipmapBlur={bloom.mipmapBlur}
            />
            <SMAA />
          </EffectComposer>
        </Canvas>
      </LoadingManager>

      {/* Debug Stats */}
      {config.debug && isLoaded && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            color: "#00ff00",
            fontFamily: "monospace",
            fontSize: "11px",
            backgroundColor: "rgba(0,0,0,0.85)",
            padding: "10px 14px",
            borderRadius: "6px",
            lineHeight: "1.3",
            minWidth: "220px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "12px" }}>
            DEBUG STATS
          </div>
          <div>FPS: {debugStats.fps}</div>
          <div>Position: [{debugStats.position.join(', ')}]</div>
          <div>Looking At: [{debugStats.lookingAt.join(', ')}]</div>
          <div>FOV: {debugStats.fov}°</div>
          <div style={{ marginTop: "6px" }}>
            <div>Meshes: {debugStats.meshCount}</div>
            <div>Triangles: {debugStats.triangles.toLocaleString()}</div>
            <div>Draw Calls: {debugStats.drawCalls}</div>
            <div>Programs: {debugStats.programs}</div>
            <div>Geometries: {debugStats.geometries}</div>
            <div>Textures: {debugStats.textures}</div>
          </div>
          <div style={{ marginTop: "6px", fontSize: "10px", opacity: 0.7 }}>
            Mouse controls enabled
          </div>
        </div>
      )}
    </div>
  );
}