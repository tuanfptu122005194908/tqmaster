import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface FptSign3DProps {
  position?: [number, number, number];
  onClick?: () => void;
}

export default function FptSign3D({ position = [0, 0.4, 0], onClick }: FptSign3DProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (glowRef.current) {
      glowRef.current.intensity = 1.8 + Math.sin(t * 2) * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Concrete plinth / pedestal base */}
      <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 0.35, 1.2]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Grass/Hedge planter behind and under sign */}
      <mesh position={[0, -0.05, -0.3]} receiveShadow>
        <boxGeometry args={[14.6, 0.3, 1.6]} />
        <meshStandardMaterial
          color="#15803d"
          roughness={0.9}
        />
      </mesh>

      {/* Main 3D Text: FPT */}
      <group position={[-3.6, 0.35, 0.2]}>
        {/* Shadow block backing for 3D depth */}
        <mesh position={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[3.2, 1.1, 0.3]} />
          <meshStandardMaterial color="#c2410c" roughness={0.4} metalness={0.3} />
        </mesh>
        <Text
          fontSize={1.15}
          fontWeight={900}
          letterSpacing={0.12}
          color="#ff6600"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#7c2d12"
        >
          FPT
        </Text>
      </group>

      {/* Main 3D Text: UNIVERSITY */}
      <group position={[1.8, 0.35, 0.2]}>
        {/* Shadow block backing for 3D depth */}
        <mesh position={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[7.2, 1.1, 0.3]} />
          <meshStandardMaterial color="#c2410c" roughness={0.4} metalness={0.3} />
        </mesh>
        <Text
          fontSize={1.05}
          fontWeight={900}
          letterSpacing={0.16}
          color="#ff7a1a"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor="#7c2d12"
        >
          UNIVERSITY
        </Text>
      </group>

      {/* Orange accent glow light */}
      <pointLight
        ref={glowRef}
        position={[0, 1.2, 1.5]}
        color="#ff7700"
        intensity={2}
        distance={8}
        decay={2}
      />
    </group>
  );
}
