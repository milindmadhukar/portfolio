import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, Suspense, useEffect } from 'react'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { Group } from 'three'
import * as THREE from 'three'

// Development mode - set to true to enable orbit controls and disable animation
const DEV_MODE = true

function CameraController() {
  const { camera } = useThree()
  const startTime = useRef(Date.now())
  
  useFrame(() => {
    if (DEV_MODE) return // Skip animation in dev mode
    
    const elapsed = (Date.now() - startTime.current) / 1000
    const duration = 3
    
    if (elapsed < duration) {
      // Smooth easing function
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      
      // Start position: far back, end position: close up but not too close
      const startZ = 18
      const endZ = 4.5
      const startY = 5
      const endY = 8.5
      
      camera.position.z = startZ + (endZ - startZ) * eased
      camera.position.y = startY + (endY - startY) * eased
      camera.lookAt(0,endY, 0) // Look at the top of the server (y = 2)
    }
  })
  
  return null
}

function AmbientLighting() {
  return (
    <>
      {/* Base ambient light */}
      <ambientLight intensity={0.4} color="#ffffff" />
      
      {/* Main directional light for shadows */}
      <directionalLight 
        position={[5, 8, 5]} 
        intensity={1.2} 
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      
      {/* Neon ambient lights bouncing off backdrop */}
      <pointLight position={[0, 6, -8]} intensity={30} color="#00ffff" distance={25} />
      <pointLight position={[-6, 6, -8]} intensity={25} color="#ff00ff" distance={20} />
      <pointLight position={[6, 6, -8]} intensity={25} color="#00ff00" distance={20} />
      
      {/* Floor bounce lighting */}
      <pointLight position={[-8, 2, 0]} intensity={25} color="#ffff00" distance={18} />
      <pointLight position={[8, 2, 0]} intensity={25} color="#ff4400" distance={18} />
      <pointLight position={[0, 2, 6]} intensity={18} color="#4400ff" distance={15} />
      
      {/* Side wall ambient bounces */}
      <pointLight position={[-10, 4, 0]} intensity={15} color="#ff0080" distance={16} />
      <pointLight position={[10, 4, 0]} intensity={15} color="#80ff00" distance={16} />
      
      {/* Additional floor ambient */}
      <pointLight position={[0, 0.5, 0]} intensity={10} color="#ffffff" distance={12} />
    </>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[25, 25]} />
      <meshStandardMaterial 
        color="#666666" 
        metalness={0.3} 
        roughness={0.1}
      />
    </mesh>
  )
}

function Backdrop() {
  return (
    <>
      {/* Back wall */}
      <mesh position={[0, 5, -10]} receiveShadow>
        <planeGeometry args={[25, 15]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.0} 
          roughness={0.8}
        />
      </mesh>
      
      {/* Side walls */}
      <mesh position={[-10, 5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.0} 
          roughness={0.8}
        />
      </mesh>
      
      <mesh position={[10, 5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.0} 
          roughness={0.8}
        />
      </mesh>
    </>
  )
}

function ServerRackModel() {
  const groupRef = useRef<Group>(null!)
  
  // Load GLB model
  const gltf = useLoader(GLTFLoader, '/models/server_rack/server_racking_system.glb')
  
  // Clone the scene to avoid sharing materials
  const clonedScene = gltf.scene.clone()
  
  // Enable shadows for all meshes in the model
  clonedScene.traverse((child) => {
    if ((child as any).isMesh) {
      (child as any).castShadow = true;
      (child as any).receiveShadow = true;
    }
  })

  return (
    <group ref={groupRef} scale={[5, 5, 5]} position={[0, -2, 0]} rotation={[0, 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  )
}

function LoadingSpinner() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="white" />
    </mesh>
  )
}

export default function Scene3D() {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw', 
      height: '100vh',
      overflow: 'hidden'
    }}>
      <Canvas camera={{ position: [0, 5, 15], fov: 75 }} shadows>
        <CameraController />
        <AmbientLighting />
        <Floor />
        <Backdrop />

        <Suspense fallback={<LoadingSpinner />}>
          <ServerRackModel />
        </Suspense>

        {/* Conditional OrbitControls for development */}
        {DEV_MODE && (
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minDistance={1}
            maxDistance={25}
          />
        )}
      </Canvas>
      
      {/* Development mode indicator */}
      {DEV_MODE && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: '#00ff00',
          fontFamily: 'monospace',
          fontSize: '14px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '5px 10px',
          borderRadius: '3px'
        }}>
          DEV MODE - Mouse controls enabled
        </div>
      )}
    </div>
  )
}
