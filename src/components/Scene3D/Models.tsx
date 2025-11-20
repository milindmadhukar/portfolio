import { useRef, useEffect } from "react";
import type { Group } from "three";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
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

export function FanBladesModel() {
  const { fanBlades } = config.models;
  const clonedScene = useGLBModel(fanBlades.path);

  return (
    <group
      scale={fanBlades.scale}
      position={fanBlades.position}
      rotation={fanBlades.rotation}
    >
      <primitive object={clonedScene} />
    </group>
  );
}