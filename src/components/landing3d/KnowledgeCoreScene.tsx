import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';

// 10 Key University Subjects with carefully spaced 3D coordinates
export interface SubjectNodeData {
  id: string;
  code: string;
  name: string;
  semester: string;
  color: string;
  position: [number, number, number];
}

export const SUBJECT_NODES: SubjectNodeData[] = [
  { id: 'prf192', code: 'PRF192', name: 'Programming Fundamentals (C)', semester: 'Kỳ 1', color: '#3b82f6', position: [-2.2, 1.4, 0.4] },
  { id: 'csi104', code: 'CSI104', name: 'Introduction to Computer Science', semester: 'Kỳ 1', color: '#06b6d4', position: [-0.9, 2.2, -0.3] },
  { id: 'pro192', code: 'PRO192', name: 'Object-Oriented Programming (Java)', semester: 'Kỳ 2', color: '#2563eb', position: [1.9, 1.5, 0.5] },
  { id: 'mad101', code: 'MAD101', name: 'Discrete Mathematics', semester: 'Kỳ 2', color: '#8b5cf6', position: [2.5, 0.1, -0.4] },
  { id: 'csd201', code: 'CSD201', name: 'Data Structures & Algorithms', semester: 'Kỳ 3', color: '#0284c7', position: [1.8, -1.6, 0.5] },
  { id: 'mas291', code: 'MAS291', name: 'Probability & Statistics', semester: 'Kỳ 3', color: '#059669', position: [-0.2, -2.3, 0.4] },
  { id: 'osg202', code: 'OSG202', name: 'Operating Systems', semester: 'Kỳ 2', color: '#0d9488', position: [-2.1, -1.3, -0.5] },
  { id: 'cea201', code: 'CEA201', name: 'Computer Architecture', semester: 'Kỳ 2', color: '#d97706', position: [0.7, 2.3, 0.3] },
  { id: 'swe201c', code: 'SWE201c', name: 'Software Engineering Intro', semester: 'Kỳ 4', color: '#4f46e5', position: [-2.5, 0.2, 0.6] },
  { id: 'dbi202', code: 'DBI202', name: 'Database Management Systems', semester: 'Kỳ 3', color: '#2563eb', position: [-1.4, -2.0, -0.4] },
];

// Single Subject Node in 3D
function SubjectNode({
  node,
  isHovered,
  isSelected,
  onHover,
  onClick,
}: {
  node: SubjectNodeData;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onClick: (node: SubjectNodeData) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const targetScale = isHovered ? 1.35 : isSelected ? 1.2 : 1.0;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8);
    }
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3 + node.position[0]) * 0.15 + 1.0;
      glowRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  // Line from center [0,0,0] to node position
  const linePoints = useMemo(() => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(...node.position);
    return [start, end];
  }, [node.position]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(linePoints);
  }, [linePoints]);

  return (
    <group position={node.position}>
      {/* Subtle line connection back to core center */}
      <primitive
        object={
          new THREE.Line(
            lineGeometry,
            new THREE.LineBasicMaterial({
              color: isHovered ? '#06b6d4' : '#cbd5e1',
              transparent: true,
              opacity: isHovered ? 0.8 : 0.35,
              linewidth: 1,
            })
          )
        }
        position={[-node.position[0], -node.position[1], -node.position[2]]}
      />

      {/* Floating sphere node */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.id);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onClick(node);
        }}
        cursor="pointer"
      >
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshPhysicalMaterial
          color={isHovered ? '#ffffff' : '#f1f5f9'}
          emissive={node.color}
          emissiveIntensity={isHovered ? 0.9 : 0.35}
          roughness={0.15}
          metalness={0.15}
          clearcoat={0.9}
        />

        {/* Outer glowing halo */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshBasicMaterial
            color={node.color}
            transparent
            opacity={isHovered ? 0.45 : 0.18}
          />
        </mesh>
      </mesh>

      {/* HTML Label / Badge */}
      <Html
        position={[0, 0.32, 0]}
        center
        distanceFactor={8.5}
        zIndexRange={[100, 0]}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick(node);
          }}
          onMouseEnter={() => onHover(node.id)}
          onMouseLeave={() => onHover(null)}
          className={`cursor-pointer select-none transition-all duration-300 ${
            isHovered
              ? 'scale-110 -translate-y-1'
              : 'opacity-95 hover:opacity-100'
          }`}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight shadow-sm transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
              isHovered
                ? 'bg-blue-600 text-white shadow-blue-500/30 ring-2 ring-blue-400'
                : 'bg-white/95 text-slate-800 border border-slate-200 shadow-slate-100'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: isHovered ? '#67e8f9' : node.color }}
            />
            <span>{node.code}</span>
          </div>

          {/* Detailed Tooltip on Hover */}
          {isHovered && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-3 py-2 bg-slate-900/95 text-white rounded-xl shadow-xl text-left border border-slate-700/60 backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150"
              style={{ minWidth: 180, maxWidth: 220 }}
            >
              <div className="flex items-center justify-between text-[10px] text-cyan-300 font-semibold mb-0.5">
                <span>{node.semester}</span>
                <span className="text-slate-400">FPT SE/IT</span>
              </div>
              <div className="text-[12px] font-bold text-white leading-tight">
                {node.name}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-300">
                <span className="text-emerald-400 font-medium">✓ Mock Exam</span>
                <span>•</span>
                <span className="text-blue-400 font-medium">PE Practice</span>
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// The Central Knowledge Core - Delicate, Compact & Glass-like
function CentralKnowledgeCore() {
  const outerCageRef = useRef<THREE.Mesh>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Floating background micro-particles in balanced orbit
  const particlePositions = useMemo(() => {
    const count = 75;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 0.8 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Slow elegant rotation of outer cage
    if (outerCageRef.current) {
      outerCageRef.current.rotation.y = t * 0.14;
      outerCageRef.current.rotation.x = Math.sin(t * 0.08) * 0.15;
    }

    // Gentle pulse of inner nucleus
    if (innerCoreRef.current) {
      const pulse = 1.0 + Math.sin(t * 1.8) * 0.08;
      innerCoreRef.current.scale.set(pulse, pulse, pulse);
      innerCoreRef.current.rotation.y = -t * 0.25;
    }

    // Orbital rings rotation
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.18;
      ring1Ref.current.rotation.x = Math.PI / 4 + Math.sin(t * 0.1) * 0.08;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.15;
      ring2Ref.current.rotation.z = -Math.PI / 3 + Math.cos(t * 0.12) * 0.08;
    }

    // Micro-particles drift
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.04;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Translucent Compact Outer Glass Polyhedron (Radius 0.55 instead of 1.2!) */}
      <mesh ref={outerCageRef}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.08}
          metalness={0.05}
          transmission={0.92}
          thickness={0.8}
          ior={1.45}
          transparent
          opacity={0.75}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
          reflectivity={0.9}
        />
        {/* Subtle geometric wireframe accent */}
        <lineSegments>
          <edgesGeometry args={[new THREE.IcosahedronGeometry(0.555, 1)]} />
          <lineBasicMaterial color="#38bdf8" transparent opacity={0.4} />
        </lineSegments>
      </mesh>

      {/* 2. Inner Glowing Nucleus (Knowledge Essence) */}
      <mesh ref={innerCoreRef}>
        <octahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial
          color="#2563eb"
          emissive="#06b6d4"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 3. Orbiting Data Ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.92, 0.008, 16, 80]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
      </mesh>

      {/* 4. Orbiting Data Ring 2 */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.18, 0.007, 16, 80]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.35} />
      </mesh>

      {/* 5. Floating Micro Data Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#0284c7"
          transparent
          opacity={0.65}
          sizeAttenuation
        />
      </points>

      {/* Soft inner lighting */}
      <pointLight position={[0, 0, 0]} color="#06b6d4" intensity={1.1} distance={4} />
      <pointLight position={[0, 0.8, 0]} color="#3b82f6" intensity={0.9} distance={4} />
    </group>
  );
}

// Scene Controller with Camera Parallax and Smooth Interaction
function SceneContent({
  onSelectSubject,
}: {
  onSelectSubject?: (node: SubjectNodeData) => void;
}) {
  const { camera, pointer } = useThree();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SubjectNodeData | null>(null);
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 8.4));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  const handleNodeClick = (node: SubjectNodeData) => {
    setSelectedNode(node);
    if (onSelectSubject) {
      onSelectSubject(node);
    }
    // Smoothly focus closer to inspected node without blocking view
    targetCamPos.current.set(
      node.position[0] * 0.35,
      node.position[1] * 0.35,
      7.0
    );
  };

  useFrame((_, delta) => {
    // Subtle mouse parallax
    const parallaxX = pointer.x * 0.45;
    const parallaxY = pointer.y * 0.35;

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetCamPos.current.x + parallaxX,
      2.5,
      delta
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      targetCamPos.current.y + parallaxY,
      2.5,
      delta
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      targetCamPos.current.z,
      2.5,
      delta
    );

    camera.lookAt(targetLookAt.current);
  });

  return (
    <>
      <ambientLight intensity={1.2} color="#f8fafc" />
      <directionalLight position={[5, 8, 5]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-5, -4, -3]} intensity={0.6} color="#dbeafe" />

      {/* Floating Central Knowledge Core (Sleek and Compact) */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.35}>
        <CentralKnowledgeCore />
      </Float>

      {/* 10 Orbiting Subject Nodes */}
      <group>
        {SUBJECT_NODES.map((node) => (
          <SubjectNode
            key={node.id}
            node={node}
            isHovered={hoveredId === node.id}
            isSelected={selectedNode?.id === node.id}
            onHover={setHoveredId}
            onClick={handleNodeClick}
          />
        ))}
      </group>
    </>
  );
}

// Fallback skeleton while 3D initializes
function CoreSkeletonFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="w-36 h-36 rounded-full border border-blue-200/60 animate-pulse flex items-center justify-center bg-blue-50/30">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-400/20 border border-cyan-300/40 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 animate-ping" />
        </div>
      </div>
      <div className="absolute text-xs font-semibold text-slate-400 tracking-wider">
        KNOWLEDGE CORE
      </div>
    </div>
  );
}

interface KnowledgeCoreSceneProps {
  className?: string;
  style?: React.CSSProperties;
  onSelectSubject?: (node: SubjectNodeData) => void;
}

export default function KnowledgeCoreScene({
  className = 'w-full h-[500px] lg:h-[580px]',
  style,
  onSelectSubject,
}: KnowledgeCoreSceneProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: 'transparent',
        ...style,
      }}
    >
      <Suspense fallback={<CoreSkeletonFallback />}>
        <Canvas
          camera={{ position: [0, 0, 8.4], fov: 40 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%' }}
        >
          <SceneContent onSelectSubject={onSelectSubject} />
        </Canvas>
      </Suspense>
    </div>
  );
}
