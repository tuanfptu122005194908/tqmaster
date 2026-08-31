import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface AlphaBuildingProps {
  position?: [number, number, number];
  scale?: [number, number, number] | number;
}

export default function AlphaBuilding({ position = [0, 0, -25], scale = 1 }: AlphaBuildingProps) {
  // Generate the modular checkerboard grid of the Alpha building
  const { blocks, windows, plants } = useMemo(() => {
    const blocksArr: { pos: [number, number, number]; size: [number, number, number] }[] = [];
    const windowsArr: { pos: [number, number, number]; size: [number, number, number] }[] = [];
    const plantsArr: { pos: [number, number, number]; size: [number, number, number] }[] = [];

    // Building dimensions
    const cols = 15; // Width steps (-7 to 7)
    const blockWidth = 2.4;
    const blockHeight = 1.6;
    const blockDepth = 3.5;

    // Undulating roof height profile (characteristic wave top of Alpha building)
    const getFloorCount = (col: number) => {
      const normalized = (col + 7) / 14; // 0 to 1
      // Wave shape: higher in center-left and center-right, dipping smoothly
      const wave = Math.sin(normalized * Math.PI) * 2.5 + Math.sin(normalized * Math.PI * 2) * 0.8;
      return Math.max(3, Math.min(7, Math.round(4.5 + wave)));
    };

    for (let c = -7; c <= 7; c++) {
      const maxFloors = getFloorCount(c);
      const x = c * blockWidth;

      for (let f = 0; f < maxFloors; f++) {
        const y = f * blockHeight + blockHeight / 2;

        // Skip ground/first floor center blocks to create the iconic Archway Tunnel (Cổng vòm thông tầng)
        const isCenterArch = Math.abs(c) <= 1 && f <= 1;
        if (isCenterArch) {
          continue;
        }

        // Checkerboard pattern (alternating white facade block vs recessed window/balcony)
        const isSolid = (Math.abs(c) + f) % 2 === 0;

        if (isSolid) {
          // Solid white module
          blocksArr.push({
            pos: [x, y, 0],
            size: [blockWidth * 0.96, blockHeight * 0.94, blockDepth],
          });
        } else {
          // Recessed window & balcony terrace
          windowsArr.push({
            pos: [x, y, -0.4],
            size: [blockWidth * 0.9, blockHeight * 0.88, blockDepth * 0.7],
          });

          // Some recessed balconies feature lush green terrace plants
          if (f > 0 && (c + f) % 3 === 0) {
            plantsArr.push({
              pos: [x, y - blockHeight * 0.25, 0.9],
              size: [blockWidth * 0.8, 0.45, 0.8],
            });
          }
        }

        // Rooftop garden plants on top level
        if (f === maxFloors - 1) {
          plantsArr.push({
            pos: [x, y + blockHeight * 0.5 + 0.2, (Math.random() - 0.5) * 1.2],
            size: [blockWidth * 0.75, 0.5, 1.2],
          });
        }
      }
    }

    return { blocks: blocksArr, windows: windowsArr, plants: plantsArr };
  }, []);

  return (
    <group position={position} scale={scale}>
      {/* ── Main Building Core Foundation ── */}
      <mesh position={[0, 4.5, -0.5]} receiveShadow>
        <boxGeometry args={[36, 9.5, 3.8]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.9}
        />
      </mesh>

      {/* ── White Checkerboard Facade Blocks ── */}
      <group>
        {blocks.map((b, i) => (
          <mesh key={`b-${i}`} position={b.pos} castShadow receiveShadow>
            <boxGeometry args={b.size} />
            <meshStandardMaterial
              color="#f8fafc"
              roughness={0.25}
              metalness={0.08}
            />
          </mesh>
        ))}
      </group>

      {/* ── Architectural Glass Windows (Reflective Deep Blue) ── */}
      <group>
        {windows.map((w, i) => (
          <mesh key={`w-${i}`} position={w.pos}>
            <boxGeometry args={w.size} />
            <meshPhysicalMaterial
              color="#0284c7"
              roughness={0.1}
              metalness={0.8}
              transmission={0.4}
              transparent
              opacity={0.85}
              reflectivity={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* ── Balcony & Rooftop Pocket Gardens ── */}
      <group>
        {plants.map((p, i) => (
          <mesh key={`p-${i}`} position={p.pos}>
            <boxGeometry args={p.size} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#16a34a' : '#15803d'}
              roughness={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* ── Central Entrance Archway Gateway Tunnel ── */}
      {/* Archway inner ceiling & walls */}
      <mesh position={[0, 1.6, -0.2]} receiveShadow>
        <boxGeometry args={[4.7, 3.2, 4.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {/* Inner walkway through tunnel */}
      <mesh position={[0, 0.05, -0.2]} receiveShadow>
        <boxGeometry args={[4.4, 0.1, 4.5]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>

      {/* Warm Ambient Under-Arch Lighting */}
      <pointLight position={[0, 2.5, 0]} color="#fef08a" intensity={2.5} distance={12} decay={2} />
      <pointLight position={[0, 2.5, -2]} color="#60a5fa" intensity={2} distance={10} decay={2} />

      {/* ── Alpha (α) Logo & Building Title on Facade ── */}
      <group position={[3.6, 2.6, 1.8]}>
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[1.5, 1.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <Text
          position={[0, 0.1, 0.02]}
          fontSize={0.65}
          fontWeight={900}
          color="#ea580c"
          anchorX="center"
          anchorY="middle"
        >
          α
        </Text>
        <Text
          position={[0, -0.32, 0.02]}
          fontSize={0.16}
          fontWeight={800}
          color="#0f172a"
          anchorX="center"
          anchorY="middle"
        >
          ALPHA
        </Text>
      </group>

      {/* ── Rooftop Antenna & Telecom Pole ── */}
      <mesh position={[0, 12, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 4, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 14, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}
