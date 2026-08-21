import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import * as THREE from 'three';
import FloatingParticles from './FloatingParticles';
import FloatingBooks from './FloatingBooks';
import OrbitalRings from './OrbitalRings';
import CenterFocalPoint from './CenterFocalPoint';

interface SceneContentProps {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

function SceneContent({ mouse }: SceneContentProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Subtle whole-scene camera drift
    state.camera.position.x += (mouse.current.x * 0.5 - state.camera.position.x) * 0.03;
    state.camera.position.y += (mouse.current.y * 0.3 - state.camera.position.y) * 0.03;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      {/* Ambient + directional lighting */}
      <ambientLight intensity={0.4} color="#e0e7ff" />
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.2}
        color="#c7d2fe"
        castShadow
      />
      <directionalLight
        position={[-4, -3, -2]}
        intensity={0.6}
        color="#818cf8"
      />
      {/* Rim light */}
      <pointLight position={[0, 4, -4]} intensity={1.5} color="#7c3aed" distance={15} decay={2} />

      {/* 3D Objects */}
      <CenterFocalPoint mouse={mouse} />
      <OrbitalRings />
      <FloatingBooks mouse={mouse} />
      <FloatingParticles count={200} mouse={mouse} />
    </group>
  );
}

interface HeroSceneProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function HeroScene({ className, style }: HeroSceneProps) {
  const mouse = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    mouse.current.y = ((e.clientY - rect.top)  / rect.height - 0.5) * -2;
  };

  const handleMouseLeave = () => {
    mouse.current.x = 0;
    mouse.current.y = 0;
  };

  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
          <SceneContent mouse={mouse} />
        </Suspense>
      </Canvas>
    </div>
  );
}
