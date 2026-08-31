import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { Sparkles, ArrowRight, BookOpen, Compass, Award, ExternalLink } from 'lucide-react';

export interface HotspotData {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  position: [number, number, number];
  cameraTargetStep: number;
}

export const HOTSPOTS: HotspotData[] = [
  {
    id: 'alpha-building',
    title: 'Tòa Nhà Alpha FPT',
    subtitle: 'Trung tâm hiệu bộ & giảng đường hiện đại, biểu tượng kiến trúc đại học FPT Hòa Lạc.',
    tag: 'KIẾN TRÚC BIỂU TƯỢNG',
    position: [0, 6.5, -24],
    cameraTargetStep: 2, // Archway foot
  },
  {
    id: 'fpt-sign',
    title: 'Biểu Tượng FPT University',
    subtitle: 'Điểm check-in rực rỡ sắc cam chào đón tân sinh viên và sĩ tử ôn thi.',
    tag: 'CHECK-IN POINT',
    position: [0, 2.2, -8.5],
    cameraTargetStep: 1, // Sign foot
  },
  {
    id: 'basketball-court',
    title: 'Sân Thể Thao & Bóng Rổ',
    subtitle: 'Không gian rèn luyện thể chất, tổ chức các giải đấu phong trào sôi động của FPTU.',
    tag: 'CAMPUS LIFE',
    position: [13, 2.8, -2],
    cameraTargetStep: 0,
  },
  {
    id: 'exam-hub',
    title: 'Kho Đề Thi Chuẩn FPT',
    subtitle: 'PRF192, PRO192, MAD101, MAS291, CEA201, CSI104... luyện thi 9+ GPA.',
    tag: 'TQMASTER EDUTECH',
    position: [-6, 3.2, -14],
    cameraTargetStep: 1,
  },
];

interface TourHotspotsProps {
  onSelectHotspot?: (hotspot: HotspotData) => void;
  activeHotspotId?: string | null;
}

export default function TourHotspots({ onSelectHotspot, activeHotspotId }: TourHotspotsProps) {
  return (
    <group>
      {HOTSPOTS.map((h) => (
        <HotspotItem
          key={h.id}
          hotspot={h}
          isActive={activeHotspotId === h.id}
          onSelect={() => onSelectHotspot?.(h)}
        />
      ))}
    </group>
  );
}

function HotspotItem({
  hotspot,
  isActive,
  onSelect,
}: {
  hotspot: HotspotData;
  isActive: boolean;
  onSelect: () => void;
}) {
  const outerRing = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 2.5;
    if (outerRing.current) {
      const scale = 1 + Math.sin(t) * 0.25;
      outerRing.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={hotspot.position}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Glowing concentric circle hotspot in 3D */}
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          style={{ cursor: 'pointer' }}
        >
          <circleGeometry args={[0.45, 32]} />
          <meshBasicMaterial
            color="#ff6600"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer Pulsing Ring */}
        <mesh ref={outerRing}>
          <ringGeometry args={[0.55, 0.72, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Center White Core Dot */}
        <mesh position={[0, 0, 0.02]}>
          <circleGeometry args={[0.2, 24]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>

        {/* HTML Popover tooltip when hovered or active */}
        <Html
          position={[0, 0.8, 0]}
          center
          distanceFactor={18}
          zIndexRange={[100, 0]}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              minWidth: '220px',
              padding: '10px 14px',
              borderRadius: '16px',
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(16px)',
              border: hovered || isActive ? '1.5px solid #ff6600' : '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: hovered || isActive
                ? '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 102, 0, 0.4)'
                : '0 8px 24px rgba(0, 0, 0, 0.4)',
              transform: hovered || isActive ? 'scale(1.06) translateY(-4px)' : 'scale(1)',
              transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: '#fb923c',
                  background: 'rgba(234, 88, 12, 0.2)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                }}
              >
                {hotspot.tag}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            </div>

            <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 800, lineHeight: 1.2, marginBottom: 2 }}>
              {hotspot.title}
            </div>

            <div style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: 1.35, fontWeight: 500 }}>
              {hotspot.subtitle}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
                marginTop: 6,
                paddingTop: 4,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span>Bước tới điểm này</span>
              <ArrowRight size={12} />
            </div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
}
