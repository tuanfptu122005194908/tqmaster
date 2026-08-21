import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FloatingParticlesProps {
  count?: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

export default function FloatingParticles({ count = 180, mouse }: FloatingParticlesProps) {
  const mesh = useRef<THREE.Points>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate random positions in a sphere volume
  const [positions, speeds, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const phs = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      spd[i] = 0.2 + Math.random() * 0.5;
      phs[i] = Math.random() * Math.PI * 2;
    }
    return [pos, spd, phs];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    const geo = mesh.current.geometry;
    const arr = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      // Gentle bob/drift
      arr[ix + 1] = positions[i * 3 + 1] + Math.sin(t * speeds[i] + phases[i]) * 0.3;
      // Slight mouse parallax influence
      arr[ix]     = positions[ix]     + mouse.current.x * 0.15;
      arr[ix + 2] = positions[ix + 2] + mouse.current.y * 0.08;
    }
    geo.attributes.position.needsUpdate = true;
    mesh.current.rotation.y = t * 0.03;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#a5b4fc"
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
