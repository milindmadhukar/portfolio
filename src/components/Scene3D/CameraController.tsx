import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { config } from "../../config";

// Shared state for camera and screen coordination
export let cameraAnimationComplete = false;

export function CameraController() {
  const { camera } = useThree();
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (config.devMode) {
      // In dev mode, immediately mark camera as complete
      if (!cameraAnimationComplete) {
        cameraAnimationComplete = true;
      }
      return;
    }

    const elapsed = (Date.now() - startTime.current) / 1000;
    const duration = config.camera.animation.duration;

    if (elapsed < duration) {
      // Smooth easing function
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      // Use config values for camera animation
      const { startPosition, endPosition, lookAtY } = config.camera.animation;

      camera.position.z = startPosition.z + (endPosition.z - startPosition.z) * eased;
      camera.position.y = startPosition.y + (endPosition.y - startPosition.y) * eased;
      camera.lookAt(0, lookAtY, 0);
    } else if (!cameraAnimationComplete) {
      // Camera animation just finished
      cameraAnimationComplete = true;
    }
  });

  return null;
}