import React, { useMemo } from 'react';
import * as THREE from 'three';

export default function CampusGround() {
  // Procedural trees & palm trees coordinates
  const palmTrees = useMemo(() => [
    { x: -5.5, z: -10, scale: 1.1, rot: 0.2 },
    { x: -3.2, z: -10.5, scale: 1.25, rot: -0.1 },
    { x: -1.0, z: -10, scale: 1.3, rot: 0.15 },
    { x: 1.2, z: -10.2, scale: 1.2, rot: -0.2 },
    { x: 3.4, z: -10.6, scale: 1.35, rot: 0.3 },
    { x: 5.6, z: -10, scale: 1.15, rot: -0.1 },
  ], []);

  const canopyTrees = useMemo(() => [
    // Left forest strip
    { x: -14, z: -18, scale: 2.2, color: '#15803d' },
    { x: -16, z: -12, scale: 2.5, color: '#166534' },
    { x: -13, z: -6, scale: 2.0, color: '#15803d' },
    { x: -15, z: 0, scale: 2.4, color: '#14532d' },
    { x: -12, z: 6, scale: 1.8, color: '#16a34a' },
    // Right backdrop trees behind basketball court
    { x: 16, z: -20, scale: 2.4, color: '#15803d' },
    { x: 18, z: -14, scale: 2.6, color: '#166534' },
    { x: 15, z: -8, scale: 2.0, color: '#14532d' },
    { x: 19, z: 2, scale: 2.2, color: '#16a34a' },
  ], []);

  return (
    <group position={[0, 0, 0]}>
      {/* ── Main Terrain Grass Base ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial
          color="#166534"
          roughness={0.9}
        />
      </mesh>

      {/* ── Central Diagonal Paved Courtyard (Quảng trường gạch chéo FPT) ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, Math.PI / 4]}
        position={[0, 0.01, -2]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#b45309"
          roughness={0.75}
          metalness={0.1}
        />
      </mesh>

      {/* Outer Plaza Border Ring / Walkway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2]} receiveShadow>
        <ringGeometry args={[13.8, 14.6, 64]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      {/* Asphalt Campus Roadway leading across */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -12]} receiveShadow>
        <planeGeometry args={[46, 5]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* ── Lawn Strip in front of Palm Trees ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -8.5]} receiveShadow>
        <planeGeometry args={[18, 2.5]} />
        <meshStandardMaterial color="#22c55e" roughness={0.85} />
      </mesh>

      {/* ── Palm Trees Row (Hàng Cây Cọ Trước Tòa Alpha) ── */}
      <group>
        {palmTrees.map((pt, i) => (
          <PalmTreeItem key={`palm-${i}`} {...pt} />
        ))}
      </group>

      {/* ── Lush Canopy Trees Flanking Both Sides ── */}
      <group>
        {canopyTrees.map((tree, i) => (
          <CanopyTreeItem key={`tree-${i}`} {...tree} />
        ))}
      </group>

      {/* ── Sân Bóng Rổ FPT (Basketball Court) on the Right ── */}
      <BasketballCourt position={[13, 0.03, -2]} />
    </group>
  );
}

function PalmTreeItem({ x, z, scale, rot }: { x: number; z: number; scale: number; rot: number }) {
  const height = 5.5 * scale;

  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* Slender trunk */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.09 * scale, 0.16 * scale, height, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>

      {/* Palm leaf cluster crown */}
      <group position={[0, height, 0]}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <group key={idx} rotation={[0.4, rad, 0]}>
              <mesh position={[0, 0.4 * scale, 1.2 * scale]} rotation={[-0.4, 0, 0]} castShadow>
                <coneGeometry args={[0.55 * scale, 2.2 * scale, 4]} />
                <meshStandardMaterial
                  color={idx % 2 === 0 ? '#15803d' : '#16a34a'}
                  roughness={0.6}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function CanopyTreeItem({ x, z, scale, color }: { x: number; z: number; scale: number; color: string }) {
  const trunkH = 1.8 * scale;

  return (
    <group position={[x, 0, z]}>
      {/* Trunk */}
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.25 * scale, 0.4 * scale, trunkH, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} />
      </mesh>

      {/* Layered Foliage Spheres */}
      <mesh position={[0, trunkH + 0.8 * scale, 0]} castShadow>
        <dodecahedronGeometry args={[1.5 * scale, 1]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0.4 * scale, trunkH + 1.6 * scale, -0.3 * scale]} castShadow>
        <dodecahedronGeometry args={[1.2 * scale, 1]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}

function BasketballCourt({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Vibrant Blue Court Surface */}
      <mesh receiveShadow>
        <planeGeometry args={[12, 18]} />
        <meshStandardMaterial
          color="#2563eb"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Court Border Line */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[10.8, 16.8]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>

      {/* Orange Key / Free-throw zone top & bottom */}
      <mesh position={[0, 5.5, 0.02]}>
        <planeGeometry args={[3.2, 3.8]} />
        <meshStandardMaterial color="#ea580c" roughness={0.4} />
      </mesh>
      <mesh position={[0, -5.5, 0.02]}>
        <planeGeometry args={[3.2, 3.8]} />
        <meshStandardMaterial color="#ea580c" roughness={0.4} />
      </mesh>

      {/* Center Circle */}
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[1.4, 1.5, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Center Half-court Line */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[10.8, 0.08]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 3D Hoops Pole (Right side back up in 3D space) */}
      <group position={[0, 7.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Steel Post */}
        <mesh position={[0, 1.8, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 3.6, 8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Backboard */}
        <mesh position={[0, 3.2, -0.4]}>
          <boxGeometry args={[1.4, 0.9, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Orange Rim */}
        <mesh position={[0, 2.9, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.25, 0.02, 8, 24]} />
          <meshStandardMaterial color="#ea580c" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
