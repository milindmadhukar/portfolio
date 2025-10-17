import { config } from "../../config";

export function Lighting() {
  const { ambient, directional, pointLights } = config.lighting;

  return (
    <>
      {/* Base ambient light */}
      <ambientLight intensity={ambient.intensity} color={ambient.color} />

      {/* Main directional light for shadows */}
      <directionalLight
        position={directional.position}
        intensity={directional.intensity}
        color={directional.color}
        castShadow
        shadow-mapSize-width={directional.shadow.mapSize.width}
        shadow-mapSize-height={directional.shadow.mapSize.height}
        shadow-camera-far={directional.shadow.camera.far}
        shadow-camera-left={directional.shadow.camera.left}
        shadow-camera-right={directional.shadow.camera.right}
        shadow-camera-top={directional.shadow.camera.top}
        shadow-camera-bottom={directional.shadow.camera.bottom}
      />

      {/* Point lights from config */}
      {pointLights.map((light, index) => (
        <pointLight
          key={`${light.name}-${index}`}
          position={light.position}
          intensity={light.intensity}
          color={light.color}
          distance={light.distance}
        />
      ))}
    </>
  );
}