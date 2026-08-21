import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingBooksProps {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

// Represents a floating "book" as a thin rounded box
function Book({
  position,
  rotation,
  color,
  speed,
  phase,
  mouse,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  speed: number;
  phase: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const basePos = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = basePos.y + Math.sin(t * speed + phase) * 0.2;
    ref.current.rotation.y = rotation[1] + t * speed * 0.3;
    ref.current.rotation.x = rotation[0] + Math.sin(t * speed * 0.7 + phase) * 0.15;
    // Mouse parallax
    ref.current.position.x = basePos.x + mouse.current.x * 0.3;
    ref.current.position.z = basePos.z + mouse.current.y * 0.2;
  });

  return (
    <RoundedBox
      ref={ref}
      args={[0.6, 0.8, 0.1]}
      radius={0.05}
      smoothness={4}
      position={position}
      rotation={rotation}
    >
      <meshStandardMaterial
        color={color}
        roughness={0.2}
        metalness={0.5}
        emissive={color}
        emissiveIntensity={0.15}
      />
    </RoundedBox>
  );
}

export default function FloatingBooks({ mouse }: FloatingBooksProps) {
  const books = useMemo(() => [
    { position: [-3.2, 1.2, -1.5] as [number, number, number], rotation: [0.3, 0.8, 0.2] as [number, number, number], color: '#6366f1', speed: 0.4, phase: 0 },
    { position: [3.0, 0.8, -2.0] as [number, number, number], rotation: [-0.2, 1.2, 0.4] as [number, number, number], color: '#8b5cf6', speed: 0.5, phase: 1.2 },
    { position: [-2.5, -1.5, -1.0] as [number, number, number], rotation: [0.5, -0.6, 0.3] as [number, number, number], color: '#3b82f6', speed: 0.35, phase: 2.4 },
    { position: [2.8, -1.2, -1.8] as [number, number, number], rotation: [-0.4, 0.9, -0.2] as [number, number, number], color: '#06b6d4', speed: 0.45, phase: 0.8 },
    { position: [0.5, 2.4, -2.5] as [number, number, number], rotation: [0.8, 0.3, 0.6] as [number, number, number], color: '#a78bfa', speed: 0.3, phase: 1.8 },
    { position: [-1.2, -2.5, -2.2] as [number, number, number], rotation: [-0.6, -0.4, 0.5] as [number, number, number], color: '#60a5fa', speed: 0.55, phase: 3.2 },
  ], []);

  return (
    <group>
      {books.map((b, i) => (
        <Book key={i} {...b} mouse={mouse} />
      ))}
    </group>
  );
}
