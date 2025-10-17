import type { CameraConfig } from './index';

// Responsive camera calculations
export function calculateResponsiveCamera(viewportWidth: number, viewportHeight: number) {
  const aspectRatio = viewportWidth / viewportHeight;
  const isMobile = viewportWidth < 768;

  // Screen center position (where we want the screen to be perfectly centered)
  const screenCenterY = 7.58; // From screenBody position

  // Server bounds (approximate based on scale and position)
  const serverWidth = 5;  // Approximate server width with scale [5,5,5]

  // Calculate FOV needed to fit server width with some padding
  const paddingFactor = 1.1; // Reduced to 10% padding for closer view
  const requiredWidth = serverWidth * paddingFactor;

  // Calculate distance needed to fit server in view
  let fov = isMobile ? 85 : 75; // Wider FOV for mobile
  let distance = (requiredWidth / 2) / Math.tan((fov * Math.PI / 180) / 2) / aspectRatio;

  // Ensure minimum distance - much closer now
  if (isMobile) {
    distance = Math.max(distance, 7.25); // Even closer on mobile: reduced from 3.5 to 2.5
  } else {
    distance = Math.max(distance, 4.25); // Keep desktop close
  }

  // Camera Y position - adjust for mobile to look head-on at screen
  let cameraY;
  let lookAtY
  if (isMobile) {
    // On mobile: position camera to look head-on at screen, but have screen appear at top 25%
    // To get screen at top 25%, camera needs to be lower than screen center
    const viewportOffset = screenCenterY * 0.25; // Move camera down significantly
    cameraY = screenCenterY - viewportOffset; // Camera lower than screen
    lookAtY = screenCenterY - viewportOffset; // Look directly at screen center
  } else {
    // Desktop: keep screen centered
    cameraY = screenCenterY;
    lookAtY = screenCenterY; 
  }

  // Look-at Y position - look directly at screen center for head-on view

  // Calculate start and end positions for animation
  const startDistance = distance + (isMobile ? 3 : 7); // Much shorter start distance for mobile
  const endDistance = distance;

  return {
    fov,
    startPosition: { x: 0, y: cameraY, z: startDistance },
    endPosition: { x: 0, y: cameraY, z: endDistance },
    lookAtY: lookAtY, // Use mobile-specific lookAtY
    distance: endDistance
  };
}

export const cameraConfig: CameraConfig = {
  animation: {
    duration: 3,
    easing: 'ease-out-cubic',
    startPosition: { x: 0, y: 7.58, z: 20 }, // Will be overridden by responsive calc
    endPosition: { x: 0, y: 7.58, z: 8 },    // Will be overridden by responsive calc
    lookAtY: 7.58,
  },
  initial: {
    position: [0, 7.58, 18], // Will be overridden by responsive calc
    fov: 75,                 // Will be overridden by responsive calc
  },
  debug: {
    position: [0, 7.58, 6], // Closer debug position
    lookAt: [0.00, 7.58, 0],
  },
};
