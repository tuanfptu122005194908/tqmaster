import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Sphere, Torus, Icosahedron, RoundedBox, Float, Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface CenterFocalPointProps {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

export default function CenterFocalPoint({ mouse }: CenterFocalPointProps) {
  const mainGroup = useRef<THREE.Group>(null!);
  const ringA = useRef<THREE.Mesh>(null!);
  const ringB = useRef<THREE.Mesh>(null!);
  const ringC = useRef<THREE.Mesh>(null!);
  const targetRot = useRef({ x: 0, y: 0 });

  // Load the 3D emblem texture
  const texture = useLoader(THREE.TextureLoader, '/hero-3d-core.jpg');

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Responsive 3D Parallax Tracking
    targetRot.current.y += (mouse.current.x * 0.4 - targetRot.current.y) * 0.08;
    targetRot.current.x += (-mouse.current.y * 0.25 - targetRot.current.x) * 0.08;

    if (mainGroup.current) {
      mainGroup.current.rotation.y = targetRot.current.y + Math.sin(t * 0.4) * 0.04;
      mainGroup.current.rotation.x = targetRot.current.x + Math.cos(t * 0.3) * 0.04;
      mainGroup.current.position.y = Math.sin(t * 1.0) * 0.1;
    }

    if (ringA.current) {
      ringA.current.rotation.z = t * 0.35;
      ringA.current.rotation.x = 0.5 + Math.sin(t * 0.2) * 0.1;
    }
    if (ringB.current) {
      ringB.current.rotation.y = -t * 0.4;
      ringB.current.rotation.z = 0.8 + Math.cos(t * 0.25) * 0.1;
    }
    if (ringC.current) {
      ringC.current.rotation.x = -t * 0.3;
      ringC.current.rotation.y = t * 0.2;
    }
  });

  return (
    <group ref={mainGroup} position={[0, 0, 0]}>
      {/* ── 3D Textured Holographic Portal Disc (Face-On) ── */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.98}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Crystal Glass Glow Border Ring */}
      <Torus ref={ringA} args={[1.9, 0.04, 16, 80]} rotation={[0.4, 0, 0]}>
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.9}
          emissive="#0284c7"
          emissiveIntensity={1.5}
        />
      </Torus>

      {/* Neon Cyber Orbit Ring B (Neon Green & Emerald) */}
      <Torus ref={ringB} args={[2.3, 0.025, 16, 90]} rotation={[-0.6, 0.5, 0]}>
        <meshStandardMaterial
          color="#34d399"
          roughness={0.1}
          metalness={0.9}
          emissive="#059669"
          emissiveIntensity={1.8}
        />
      </Torus>

      {/* Outer Cyan Ring */}
      <Torus ref={ringC} args={[2.6, 0.02, 16, 90]} rotation={[0.9, -0.4, 0.3]}>
        <meshStandardMaterial
          color="#818cf8"
          roughness={0.1}
          metalness={0.9}
          emissive="#6366f1"
          emissiveIntensity={1.6}
        />
      </Torus>

      {/* ── Sparkling Floating 3D Diamonds ── */}
      <FloatingGems />

      {/* ── Dynamic Point Lights for Bloom ── */}
      <pointLight color="#38bdf8" intensity={4} distance={8} decay={2} position={[0, 0, 2]} />
      <pointLight color="#34d399" intensity={2.5} distance={6} decay={2} position={[2, -1, 1]} />
      <pointLight color="#a855f7" intensity={3} distance={7} decay={2} position={[-2, 1.5, 1]} />
    </group>
  );
}

function FloatingGems() {
  const gems = useMemo(() => [
    { pos: [2.3, 1.4, 0.6] as [number, number, number], scale: 0.18, color: '#67e8f9', speed: 0.9 },
    { pos: [-2.4, 1.2, -0.3] as [number, number, number], scale: 0.22, color: '#fbbf24', speed: 0.7 },
    { pos: [2.2, -1.6, -0.4] as [number, number, number], scale: 0.17, color: '#34d399', speed: 0.8 },
    { pos: [-2.1, -1.4, 0.5] as [number, number, number], scale: 0.2, color: '#c084fc', speed: 1.0 },
    { pos: [0.2, 2.4, -0.6] as [number, number, number], scale: 0.16, color: '#f472b6', speed: 0.6 },
    { pos: [-0.8, -2.4, 0.4] as [number, number, number], scale: 0.19, color: '#38bdf8', speed: 0.85 },
  ], []);

  return (
    <group>
      {gems.map((g, i) => (
        <GemItem key={i} {...g} />
      ))}
    </group>
  );
}

function GemItem({ pos, scale, color, speed }: { pos: [number, number, number]; scale: number; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed;
    ref.current.rotation.x = t * 0.9;
    ref.current.rotation.y = t * 1.3;
    ref.current.position.y = pos[1] + Math.sin(t * 1.6) * 0.18;
    ref.current.position.x = pos[0] + Math.cos(t * 1.1) * 0.08;
  });

  return (
    <Icosahedron ref={ref} args={[scale, 0]} position={pos}>
      <meshStandardMaterial
        color={color}
        roughness={0.05}
        metalness={0.95}
        emissive={color}
        emissiveIntensity={1.0}
      />
    </Icosahedron>
  );
}
