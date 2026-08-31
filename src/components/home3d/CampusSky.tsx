import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Float } from '@react-three/drei';
import * as THREE from 'three';

export type TimeOfDay = 'day' | 'sunset' | 'night';

interface CampusSkyProps {
  timeOfDay: TimeOfDay;
}

export default function CampusSky({ timeOfDay }: CampusSkyProps) {
  const birdsGroup = useRef<THREE.Group>(null!);

  const skyConfig = useMemo(() => {
    switch (timeOfDay) {
      case 'sunset':
        return {
          sunPosition: [20, 4, -40] as [number, number, number],
          turbidity: 8,
          rayleigh: 4,
          mieCoefficient: 0.05,
          mieDirectionalG: 0.8,
          ambientColor: '#fed7aa',
          ambientIntensity: 0.6,
          sunColor: '#f97316',
          sunIntensity: 2.2,
          fogColor: '#fde68a',
        };
      case 'night':
        return {
          sunPosition: [0, -10, -50] as [number, number, number],
          turbidity: 0.1,
          rayleigh: 0.2,
          mieCoefficient: 0.005,
          mieDirectionalG: 0.7,
          ambientColor: '#1e1b4b',
          ambientIntensity: 0.35,
          sunColor: '#38bdf8',
          sunIntensity: 0.5,
          fogColor: '#090d16',
        };
      case 'day':
      default:
        return {
          sunPosition: [30, 25, -20] as [number, number, number],
          turbidity: 2,
          rayleigh: 1.5,
          mieCoefficient: 0.005,
          mieDirectionalG: 0.8,
          ambientColor: '#f8fafc',
          ambientIntensity: 0.85,
          sunColor: '#fffbeb',
          sunIntensity: 2.4,
          fogColor: '#bae6fd',
        };
    }
  }, [timeOfDay]);

  // Birds circling over campus
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.4;
    if (birdsGroup.current) {
      birdsGroup.current.position.x = Math.sin(t) * 14;
      birdsGroup.current.position.z = -18 + Math.cos(t) * 8;
      birdsGroup.current.rotation.y = -t + Math.PI / 2;
    }
  });

  return (
    <group>
      {/* Dynamic Sky */}
      <Sky
        distance={450000}
        sunPosition={skyConfig.sunPosition}
        turbidity={skyConfig.turbidity}
        rayleigh={skyConfig.rayleigh}
        mieCoefficient={skyConfig.mieCoefficient}
        mieDirectionalG={skyConfig.mieDirectionalG}
      />

      {/* Atmospheric Fog */}
      <fog attach="fog" args={[skyConfig.fogColor, 25, 75]} />

      {/* Ambient Lighting */}
      <ambientLight color={skyConfig.ambientColor} intensity={skyConfig.ambientIntensity} />

      {/* Sun / Key Directional Light */}
      <directionalLight
        position={skyConfig.sunPosition}
        intensity={skyConfig.sunIntensity}
        color={skyConfig.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={0.5}
        shadow-camera-far={90}
      />

      {/* Secondary Fill Light */}
      <directionalLight
        position={[-15, 10, 10]}
        intensity={0.4}
        color="#93c5fd"
      />

      {/* Floating Low Clouds */}
      <FloatingClouds timeOfDay={timeOfDay} />

      {/* Birds flock */}
      <group ref={birdsGroup} position={[0, 15, -18]}>
        {[-1.5, 0, 1.8].map((offset, idx) => (
          <mesh key={idx} position={[offset, idx * 0.4, idx * 0.3]} rotation={[0, 0, 0.2 * (idx - 1)]}>
            <coneGeometry args={[0.08, 0.4, 3]} />
            <meshBasicMaterial color="#334155" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function FloatingClouds({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  const clouds = useMemo(() => [
    { pos: [-18, 16, -30] as [number, number, number], scale: 3.2 },
    { pos: [12, 18, -35] as [number, number, number], scale: 4.0 },
    { pos: [-4, 20, -42] as [number, number, number], scale: 5.2 },
    { pos: [22, 14, -28] as [number, number, number], scale: 2.8 },
  ], []);

  const cloudColor = timeOfDay === 'sunset' ? '#fde047' : timeOfDay === 'night' ? '#1e293b' : '#ffffff';
  const cloudOpacity = timeOfDay === 'night' ? 0.3 : 0.65;

  return (
    <group>
      {clouds.map((c, i) => (
        <Float key={i} speed={0.8} rotationIntensity={0.1} floatIntensity={0.3}>
          <group position={c.pos}>
            <mesh>
              <sphereGeometry args={[c.scale, 8, 8]} />
              <meshBasicMaterial color={cloudColor} transparent opacity={cloudOpacity} />
            </mesh>
            <mesh position={[c.scale * 0.5, 0, 0]}>
              <sphereGeometry args={[c.scale * 0.7, 8, 8]} />
              <meshBasicMaterial color={cloudColor} transparent opacity={cloudOpacity * 0.9} />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
}
