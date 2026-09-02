import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function AmbientCoreMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.2;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.2;
      ringRef.current.rotation.x = Math.PI / 4 + Math.cos(t * 0.1) * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.1}
          metalness={0.05}
          transmission={0.92}
          thickness={1.5}
          transparent
          opacity={0.65}
        />
        <lineSegments>
          <edgesGeometry args={[new THREE.IcosahedronGeometry(1.505, 1)]} />
          <lineBasicMaterial color="#38bdf8" transparent opacity={0.35} />
        </lineSegments>
      </mesh>

      <mesh ref={ringRef}>
        <torusGeometry args={[2.2, 0.02, 16, 80]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export default function AmbientBackgroundCore({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
        <pointLight position={[0, 0, 0]} color="#06b6d4" intensity={2} distance={6} />
        <AmbientCoreMesh />
      </Canvas>
    </div>
  );
}
