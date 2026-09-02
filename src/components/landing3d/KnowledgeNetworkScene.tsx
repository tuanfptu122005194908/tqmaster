import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface NetworkNode {
  id: string;
  label: string;
  tier: 'SEMESTER' | 'SUBJECT' | 'TOPIC' | 'QUESTION' | 'EXAM';
  tierLabel: string;
  description: string;
  position: [number, number, number];
  color: string;
  connections: string[]; // child IDs
}

const NETWORK_DATA: NetworkNode[] = [
  // 1. SEMESTER
  {
    id: 'sem2',
    label: 'Kỳ 2 (SE / IT)',
    tier: 'SEMESTER',
    tierLabel: '01 SEMESTER',
    description: 'Nền tảng lập trình hướng đối tượng và kiến trúc máy tính',
    position: [-4.2, 0, 0],
    color: '#3b82f6',
    connections: ['sub_pro', 'sub_mad'],
  },
  // 2. SUBJECTS
  {
    id: 'sub_pro',
    label: 'PRO192 (Java OOP)',
    tier: 'SUBJECT',
    tierLabel: '02 SUBJECT',
    description: 'Lập trình Hướng đối tượng chuẩn FPT University',
    position: [-2.1, 1.3, 0.4],
    color: '#2563eb',
    connections: ['top_poly', 'top_coll'],
  },
  {
    id: 'sub_mad',
    label: 'MAD101 (Discrete Math)',
    tier: 'SUBJECT',
    tierLabel: '02 SUBJECT',
    description: 'Toán rời rạc và thuật toán logic',
    position: [-2.1, -1.3, -0.4],
    color: '#6366f1',
    connections: ['top_logic'],
  },
  // 3. TOPICS
  {
    id: 'top_poly',
    label: 'Polymorphism & Abstraction',
    tier: 'TOPIC',
    tierLabel: '03 TOPIC',
    description: 'Tính đa hình, abstract class và interface chuyên sâu',
    position: [0.1, 2.0, 0.6],
    color: '#06b6d4',
    connections: ['q_dispatch', 'q_interface'],
  },
  {
    id: 'top_coll',
    label: 'Java Collections API',
    tier: 'TOPIC',
    tierLabel: '03 TOPIC',
    description: 'ArrayList, HashMap, LinkedList và cấu trúc dữ liệu',
    position: [0.1, 0.7, -0.5],
    color: '#0891b2',
    connections: ['q_hashmap'],
  },
  {
    id: 'top_logic',
    label: 'Logic & Graph Theory',
    tier: 'TOPIC',
    tierLabel: '03 TOPIC',
    description: 'Mệnh đề logic, cây nhị phân và đồ thị',
    position: [0.1, -1.6, 0.3],
    color: '#8b5cf6',
    connections: ['q_graph'],
  },
  // 4. QUESTIONS
  {
    id: 'q_dispatch',
    label: 'Q12 Dynamic Dispatch Output',
    tier: 'QUESTION',
    tierLabel: '04 QUESTION',
    description: 'Xử lý ghi đè phương thức (Override) khi gọi runtime',
    position: [2.3, 2.2, 0.8],
    color: '#0284c7',
    connections: ['exam_mock1'],
  },
  {
    id: 'q_interface',
    label: 'Q28 Interface Default Methods',
    tier: 'QUESTION',
    tierLabel: '04 QUESTION',
    description: 'Quy tắc đa kế thừa hành vi với default method Java 8+',
    position: [2.3, 1.1, -0.2],
    color: '#0284c7',
    connections: ['exam_mock1'],
  },
  {
    id: 'q_hashmap',
    label: 'Q34 HashMap Collision & Put',
    tier: 'QUESTION',
    tierLabel: '04 QUESTION',
    description: 'Cơ chế hashCode() và equals() khi lưu trữ đối tượng',
    position: [2.3, 0.0, 0.5],
    color: '#0284c7',
    connections: ['exam_pe'],
  },
  {
    id: 'q_graph',
    label: 'Q19 Dijkstra Shortest Path',
    tier: 'QUESTION',
    tierLabel: '04 QUESTION',
    description: 'Thuật toán tìm đường đi ngắn nhất đồ thị có trọng số',
    position: [2.3, -1.6, -0.4],
    color: '#7c3aed',
    connections: ['exam_mock1'],
  },
  // 5. EXAM
  {
    id: 'exam_mock1',
    label: 'PRO192 Final Mock Exam #01',
    tier: 'EXAM',
    tierLabel: '05 EXAM',
    description: 'Đề thi trắc nghiệm chuẩn 40 câu có bấm giờ 60 phút',
    position: [4.4, 1.4, 0.2],
    color: '#10b981',
    connections: [],
  },
  {
    id: 'exam_pe',
    label: 'PRO192 Practical Exam (PE)',
    tier: 'EXAM',
    tierLabel: '05 EXAM',
    description: 'Bộ đề thi thực hành code NetBeans chấm tự động',
    position: [4.4, -0.5, -0.3],
    color: '#059669',
    connections: [],
  },
];

// Draw connection vectors and pulses
function NetworkConnections({
  nodes,
  hoveredId,
}: {
  nodes: NetworkNode[];
  hoveredId: string | null;
}) {
  const pulsesRef = useRef<THREE.Group>(null);

  // Map of id -> node
  const nodeMap = useMemo(() => {
    const map = new Map<string, NetworkNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Edges list
  const edges = useMemo(() => {
    const result: { from: NetworkNode; to: NetworkNode; id: string }[] = [];
    nodes.forEach((fromNode) => {
      fromNode.connections.forEach((targetId) => {
        const toNode = nodeMap.get(targetId);
        if (toNode) {
          result.push({
            from: fromNode,
            to: toNode,
            id: `${fromNode.id}->${toNode.id}`,
          });
        }
      });
    });
    return result;
  }, [nodes, nodeMap]);

  useFrame((state) => {
    if (pulsesRef.current) {
      const t = state.clock.elapsedTime * 1.5;
      pulsesRef.current.children.forEach((pulse, idx) => {
        const edge = edges[idx % edges.length];
        if (edge) {
          const progress = (t * 0.4 + idx * 0.2) % 1;
          const p1 = new THREE.Vector3(...edge.from.position);
          const p2 = new THREE.Vector3(...edge.to.position);
          pulse.position.lerpVectors(p1, p2, progress);
        }
      });
    }
  });

  return (
    <group>
      {/* Static line segments */}
      {edges.map((edge) => {
        const isHighlighted =
          hoveredId === edge.from.id || hoveredId === edge.to.id;
        const geom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...edge.from.position),
          new THREE.Vector3(...edge.to.position),
        ]);

        return (
          <primitive
            key={edge.id}
            object={
              new THREE.Line(
                geom,
                new THREE.LineBasicMaterial({
                  color: isHighlighted ? '#06b6d4' : '#cbd5e1',
                  transparent: true,
                  opacity: isHighlighted ? 0.9 : 0.45,
                  linewidth: isHighlighted ? 2 : 1,
                })
              )
            }
          />
        );
      })}

      {/* Animated signal pulses moving through edges */}
      <group ref={pulsesRef}>
        {edges.map((edge) => (
          <mesh key={`pulse-${edge.id}`}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Single Network Node
function GraphNode({
  node,
  isHovered,
  onHover,
}: {
  node: NetworkNode;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetScale = isHovered ? 1.4 : 1.0;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 10
      );
    }
  });

  const nodeRadius =
    node.tier === 'SEMESTER' || node.tier === 'EXAM'
      ? 0.26
      : node.tier === 'SUBJECT'
      ? 0.22
      : 0.18;

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.id);
        }}
        onPointerOut={() => onHover(null)}
        cursor="pointer"
      >
        <sphereGeometry args={[nodeRadius, 32, 32]} />
        <meshPhysicalMaterial
          color={isHovered ? '#ffffff' : '#f8fafc'}
          emissive={node.color}
          emissiveIntensity={isHovered ? 0.9 : 0.4}
          roughness={0.15}
          metalness={0.1}
          clearcoat={0.7}
        />
      </mesh>

      {/* Outer subtle glow ring */}
      <mesh>
        <sphereGeometry args={[nodeRadius * 1.35, 16, 16]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={isHovered ? 0.4 : 0.15}
        />
      </mesh>

      {/* HTML Label */}
      <Html position={[0, -0.4, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
        <div
          onMouseEnter={() => onHover(node.id)}
          onMouseLeave={() => onHover(null)}
          className={`select-none transition-all duration-200 cursor-pointer ${
            isHovered ? 'scale-110 -translate-y-1' : 'opacity-90'
          }`}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm flex items-center gap-1.5 whitespace-nowrap transition-all ${
              isHovered
                ? 'bg-blue-600 text-white shadow-blue-500/30 ring-2 ring-blue-300'
                : 'bg-white/95 text-slate-800 border border-slate-200 shadow-slate-100'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: node.color }}
            />
            <span>{node.label}</span>
          </div>

          {isHovered && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-3 py-2 bg-slate-900/95 text-white rounded-xl shadow-xl text-left border border-slate-700/60 backdrop-blur-md z-50 animate-in fade-in duration-150"
              style={{ minWidth: 200, maxWidth: 240 }}
            >
              <div className="text-[9px] uppercase tracking-wider text-cyan-300 font-bold mb-0.5">
                {node.tierLabel}
              </div>
              <div className="text-[12px] font-bold text-white leading-tight">
                {node.label}
              </div>
              <div className="text-[11px] text-slate-300 mt-1 leading-snug">
                {node.description}
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

function NetworkSceneContent() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      <ambientLight intensity={1.2} color="#ffffff" />
      <directionalLight position={[5, 10, 7]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-5, -5, -4]} intensity={0.5} color="#e2e8f0" />

      {/* Layer Labels in Background */}
      <Html position={[-4.2, 2.7, 0]} center distanceFactor={8}>
        <div className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200">
          01 SEMESTER
        </div>
      </Html>
      <Html position={[-2.1, 2.7, 0]} center distanceFactor={8}>
        <div className="text-[10px] font-extrabold tracking-widest text-blue-500 uppercase bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200">
          02 SUBJECT
        </div>
      </Html>
      <Html position={[0.1, 2.7, 0]} center distanceFactor={8}>
        <div className="text-[10px] font-extrabold tracking-widest text-cyan-600 uppercase bg-cyan-50/80 px-2 py-0.5 rounded border border-cyan-200">
          03 TOPIC
        </div>
      </Html>
      <Html position={[2.3, 2.7, 0]} center distanceFactor={8}>
        <div className="text-[10px] font-extrabold tracking-widest text-sky-600 uppercase bg-sky-50/80 px-2 py-0.5 rounded border border-sky-200">
          04 QUESTION
        </div>
      </Html>
      <Html position={[4.4, 2.7, 0]} center distanceFactor={8}>
        <div className="text-[10px] font-extrabold tracking-widest text-emerald-600 uppercase bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200">
          05 EXAM
        </div>
      </Html>

      {/* Nodes & Edges */}
      <NetworkConnections nodes={NETWORK_DATA} hoveredId={hoveredId} />

      <group>
        {NETWORK_DATA.map((node) => (
          <GraphNode
            key={node.id}
            node={node}
            isHovered={hoveredId === node.id}
            onHover={setHoveredId}
          />
        ))}
      </group>
    </>
  );
}

export default function KnowledgeNetworkScene({
  className = 'w-full h-[480px] lg:h-[540px]',
}: {
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: 'transparent' }}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-slate-400">
            Loading Knowledge Network 3D Graph...
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 0, 7.8], fov: 48 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.8]}
          style={{ width: '100%', height: '100%' }}
        >
          <NetworkSceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
}
