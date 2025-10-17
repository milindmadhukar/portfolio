import { useRef } from "react";
import type { Group } from "three";
import { config } from "../../config";
import { useGLBModel } from "./utils";

export function ServerModel() {
  const groupRef = useRef<Group>(null!);
  const { server } = config.models;
  const clonedScene = useGLBModel(server.path);

  return (
    <group
      ref={groupRef}
      scale={server.scale}
      position={server.position}
      rotation={server.rotation}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

export function ScreenBodyModel() {
  const groupRef = useRef<Group>(null!);
  const { screenBody } = config.models;
  const clonedScene = useGLBModel(screenBody.path);

  return (
    <group
      ref={groupRef}
      scale={screenBody.scale}
      position={screenBody.position}
      rotation={screenBody.rotation}
    >
      <primitive object={clonedScene} />
    </group>
  );
}