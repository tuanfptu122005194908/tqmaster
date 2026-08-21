import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Torus } from '@react-three/drei';
import * as THREE from 'three';

export default function OrbitalRings() {
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  const ring3 = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1.current) {
      ring1.current.rotation.x = t * 0.4;
      ring1.current.rotation.z = t * 0.2;
    }
    if (ring2.current) {
      ring2.current.rotation.y = t * 0.3;
      ring2.current.rotation.z = t * -0.25;
    }
    if (ring3.current) {
      ring3.current.rotation.x = t * -0.2;
      ring3.current.rotation.y = t * 0.35;
    }
  });

  return (
    <group>
      {/* Ring 1 — large outer, indigo */}
      <Torus ref={ring1} args={[2.2, 0.02, 8, 120]} rotation={[0.5, 0, 0]}>
        <meshStandardMaterial
          color="#6366f1"
          roughness={0.1}
          metalness={0.9}
          emissive="#6366f1"
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </Torus>

      {/* Ring 2 — medium, violet */}
      <Torus ref={ring2} args={[1.6, 0.015, 8, 100]} rotation={[1.2, 0.5, 0]}>
        <meshStandardMaterial
          color="#8b5cf6"
          roughness={0.1}
          metalness={0.9}
          emissive="#8b5cf6"
          emissiveIntensity={0.5}
          transparent
          opacity={0.5}
        />
      </Torus>

      {/* Ring 3 — inner, cyan */}
      <Torus ref={ring3} args={[1.1, 0.01, 8, 80]} rotation={[0, 0.8, 0.5]}>
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.1}
          metalness={0.9}
          emissive="#06b6d4"
          emissiveIntensity={0.6}
          transparent
          opacity={0.4}
        />
      </Torus>
    </group>
  );
}
