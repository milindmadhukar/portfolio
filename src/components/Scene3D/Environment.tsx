import { config } from "../../config";

export function Floor() {
  const { floor } = config.environment;
  
  return (
    <mesh 
      rotation={floor.rotation as [number, number, number]} 
      position={floor.position as [number, number, number]} 
      receiveShadow
    >
      <planeGeometry args={floor.size} />
      <meshStandardMaterial 
        color={floor.material.color} 
        metalness={floor.material.metalness} 
        roughness={floor.material.roughness} 
      />
    </mesh>
  );
}

export function Walls() {
  const { walls } = config.environment;
  
  return (
    <>
      {/* Back wall */}
      <mesh position={walls.back.position as [number, number, number]} receiveShadow>
        <planeGeometry args={walls.back.size} />
        <meshStandardMaterial 
          color={walls.back.material.color} 
          metalness={walls.back.material.metalness} 
          roughness={walls.back.material.roughness} 
        />
      </mesh>

      {/* Side walls */}
      <mesh 
        position={walls.sides.positions.left as [number, number, number]} 
        rotation={[0, Math.PI / 2, 0]} 
        receiveShadow
      >
        <planeGeometry args={walls.sides.size} />
        <meshStandardMaterial 
          color={walls.sides.material.color} 
          metalness={walls.sides.material.metalness} 
          roughness={walls.sides.material.roughness} 
        />
      </mesh>

      <mesh 
        position={walls.sides.positions.right as [number, number, number]} 
        rotation={[0, -Math.PI / 2, 0]} 
        receiveShadow
      >
        <planeGeometry args={walls.sides.size} />
        <meshStandardMaterial 
          color={walls.sides.material.color} 
          metalness={walls.sides.material.metalness} 
          roughness={walls.sides.material.roughness} 
        />
      </mesh>
    </>
  );
}