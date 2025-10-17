import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { EffectComposer, Bloom, SMAA } from "@react-three/postprocessing";
import { config } from "../../config";

// Import all components
import { CameraController } from "./CameraController";
import { Lighting } from "./Lighting";
import { Floor, Walls } from "./Environment";
import { ServerModel, ScreenBodyModel } from "./Models";
import { ScreenFrontModel } from "./ScreenFront";

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
      <Canvas 
        camera={{ 
          position: config.camera.initial.position, 
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
        </Suspense>

        {/* Conditional OrbitControls for development */}
        {config.devMode && (
          <OrbitControls
            enablePan={canvasConfig.orbitControls.enablePan}
            enableZoom={canvasConfig.orbitControls.enableZoom}
            enableRotate={canvasConfig.orbitControls.enableRotate}
            minDistance={canvasConfig.orbitControls.minDistance}
            maxDistance={canvasConfig.orbitControls.maxDistance}
          />
        )}

        {/* Post-processing effects for bloom */}
        <EffectComposer>
          <Bloom 
            intensity={bloom.intensity} 
            luminanceThreshold={bloom.luminanceThreshold} 
            luminanceSmoothing={bloom.luminanceSmoothing}
            mipmapBlur={bloom.mipmapBlur}
          />
          <SMAA />
        </EffectComposer>
      </Canvas>

      {/* Development mode indicator */}
      {config.devMode && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            color: "#00ff00",
            fontFamily: "monospace",
            fontSize: "14px",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "5px 10px",
            borderRadius: "3px",
          }}
        >
          DEV MODE - Mouse controls enabled
        </div>
      )}
    </div>
  );
}