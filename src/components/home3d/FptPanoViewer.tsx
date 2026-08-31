import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  Compass,
  Footprints,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  ArrowRight,
  RotateCw,
  Eye,
  BookOpen,
  School,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export type PanoSceneId = 'alpha_gate' | 'alpha_hall' | 'campus_sky';

interface PanoSceneConfig {
  id: PanoSceneId;
  name: string;
  locationName: string;
  tag: string;
  description: string;
  faces: [string, string, string, string, string, string]; // [right, left, top, bottom, front, back]
  initialRotationY: number;
  hotspots: {
    id: string;
    title: string;
    subtitle: string;
    tag: string;
    position: [number, number, number];
    targetScene?: PanoSceneId;
  }[];
}

const PANO_SCENES: Record<PanoSceneId, PanoSceneConfig> = {
  alpha_gate: {
    id: 'alpha_gate',
    name: 'Trước Tòa Nhà Alpha',
    locationName: 'Sân Quảng Trường Tòa Alpha',
    tag: 'BIỂU TƯỢNG FPTU',
    description: 'Toàn cảnh trước tòa nhà Alpha, cụm chữ FPT UNIVERSITY và sân bóng rổ.',
    faces: [
      '/fpt-tour/alpha_gate_1.jpg', // right (+x)
      '/fpt-tour/alpha_gate_3.jpg', // left (-x)
      '/fpt-tour/alpha_gate_4.jpg', // top (+y)
      '/fpt-tour/alpha_gate_5.jpg', // bottom (-y)
      '/fpt-tour/alpha_gate_0.jpg', // front (+z)
      '/fpt-tour/alpha_gate_2.jpg', // back (-z)
    ],
    initialRotationY: 0,
    hotspots: [
      {
        id: 'enter_hall',
        title: 'Bước Vào Sảnh Penrose',
        subtitle: 'Khám phá bên trong sảnh chính tòa nhà Alpha',
        tag: 'LỐI VÀO SẢNH',
        position: [6, 1.2, -18],
        targetScene: 'alpha_hall',
      },
      {
        id: 'overview_sky',
        title: 'Xem Toàn Cảnh Campus',
        subtitle: 'Góc nhìn từ trên cao bao quát khuôn viên Hòa Lạc',
        tag: 'TOP VIEW',
        position: [-16, 5, -12],
        targetScene: 'campus_sky',
      },
      {
        id: 'fpt_subjects',
        title: 'Kho Đề Thi Môn FPT',
        subtitle: 'PRF192, PRO192, MAD101, MAS291, CEA201, OSG202...',
        tag: 'TQMASTER FPT',
        position: [0, -2, -16],
      },
    ],
  },
  alpha_hall: {
    id: 'alpha_hall',
    name: 'Sảnh Penrose Tòa Alpha',
    locationName: 'Sảnh Chính & Khu Trưng Bày',
    tag: 'SẢNH TRUYỀN THỐNG',
    description: 'Sảnh Penrose với hoa văn fractal toán học độc đáo, phòng tuyển sinh và dịch vụ sinh viên.',
    faces: [
      '/fpt-tour/alpha_hall_1.jpg',
      '/fpt-tour/alpha_hall_3.jpg',
      '/fpt-tour/alpha_hall_4.jpg',
      '/fpt-tour/alpha_hall_5.jpg',
      '/fpt-tour/alpha_hall_0.jpg',
      '/fpt-tour/alpha_hall_2.jpg',
    ],
    initialRotationY: Math.PI / 4,
    hotspots: [
      {
        id: 'back_to_gate',
        title: 'Bước Ra Sân Trước',
        subtitle: 'Quay lại quảng trường và cụm chữ FPT University',
        tag: 'LỐI RA',
        position: [-10, 0.5, 16],
        targetScene: 'alpha_gate',
      },
      {
        id: 'sky_tour',
        title: 'Toàn Cảnh Ngoài Trời',
        subtitle: 'Ngắm nhìn không gian xanh Đại học FPT',
        tag: 'CAMPUS VIEW',
        position: [14, 2, -12],
        targetScene: 'campus_sky',
      },
      {
        id: 'fpt_exam_hub',
        title: 'Tài Liệu Ôn Tập FPTU',
        subtitle: 'Tổng hợp đề thi thử PE, FE, Quiz điểm 9+ GPA',
        tag: 'KHO ĐỀ THI',
        position: [2, 0.8, -18],
      },
    ],
  },
  campus_sky: {
    id: 'campus_sky',
    name: 'Toàn Cảnh Campus Hòa Lạc',
    locationName: 'Góc Nhìn Toàn Cảnh Trên Cao',
    tag: 'BIRD-EYE VIEW',
    description: 'Khuôn viên 30ha xanh mướt của ĐH FPT: Hồ Sen, Đồi Thông, Tòa Beta, Gamma, Ký túc xá.',
    faces: [
      '/fpt-tour/campus_sky_1.jpg',
      '/fpt-tour/campus_sky_3.jpg',
      '/fpt-tour/campus_sky_4.jpg',
      '/fpt-tour/campus_sky_5.jpg',
      '/fpt-tour/campus_sky_0.jpg',
      '/fpt-tour/campus_sky_2.jpg',
    ],
    initialRotationY: 0,
    hotspots: [
      {
        id: 'down_to_alpha',
        title: 'Đáp Xuống Tòa Alpha',
        subtitle: 'Đến ngay trước cổng và cụm chữ 3D FPT University',
        tag: 'TÒA ALPHA',
        position: [-5, -6, -18],
        targetScene: 'alpha_gate',
      },
      {
        id: 'down_to_hall',
        title: 'Vào Sảnh Penrose',
        subtitle: 'Tham quan không gian bên trong sảnh chính',
        tag: 'SẢNH PENROSE',
        position: [8, -5, -16],
        targetScene: 'alpha_hall',
      },
    ],
  },
};

// Sub-component: Panorama 360 Cube Box with Ultra-Crisp Texture Filtering
function PanoCube({
  sceneConfig,
  opacity = 1,
}: {
  sceneConfig: PanoSceneConfig;
  opacity?: number;
}) {
  const { gl } = useThree();
  const maxAnisotropy = gl.capabilities.getMaxAnisotropy();

  const materials = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return sceneConfig.faces.map((url) => {
      const tex = loader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = Math.min(maxAnisotropy, 16);
      return new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.BackSide,
        transparent: true,
        opacity: opacity,
        depthWrite: false,
      });
    });
  }, [sceneConfig.faces, opacity, maxAnisotropy]);

  useEffect(() => {
    materials.forEach((m) => {
      m.opacity = opacity;
    });
  }, [materials, opacity]);

  return (
    <mesh
      geometry={new THREE.BoxGeometry(60, 60, 60)}
      material={materials}
      rotation={[0, sceneConfig.initialRotationY, 0]}
      scale={[-1, 1, 1]}
    />
  );
}

// Sub-component: Interactive 360 Hotspot Pin
function PanoHotspot({
  hotspot,
  onTrigger,
  onOpenExams,
}: {
  hotspot: PanoSceneConfig['hotspots'][0];
  onTrigger?: (targetScene: PanoSceneId) => void;
  onOpenExams?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 3;
    if (ringRef.current) {
      const s = 1 + Math.sin(t) * 0.25;
      ringRef.current.scale.set(s, s, s);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (hotspot.targetScene && onTrigger) {
      onTrigger(hotspot.targetScene);
    } else if (onOpenExams) {
      onOpenExams();
    }
  };

  return (
    <group position={hotspot.position}>
      <Billboard follow>
        {/* Core clickable circle */}
        <mesh
          onClick={handleClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <circleGeometry args={[0.55, 32]} />
          <meshBasicMaterial color="#ff6600" transparent opacity={0.95} side={THREE.DoubleSide} />
        </mesh>

        {/* Pulsing outer ring */}
        <mesh ref={ringRef}>
          <ringGeometry args={[0.65, 0.85, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>

        {/* Center dot */}
        <mesh position={[0, 0, 0.02]}>
          <circleGeometry args={[0.22, 24]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>

        {/* Popover Card */}
        <Html position={[0, 1.1, 0]} center distanceFactor={15} zIndexRange={[100, 0]}>
          <div
            onClick={handleClick}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              minWidth: '220px',
              padding: '10px 14px',
              borderRadius: '16px',
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(16px)',
              border: hovered ? '2px solid #ff6600' : '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: hovered
                ? '0 12px 32px rgba(0, 0, 0, 0.7), 0 0 22px rgba(255, 102, 0, 0.5)'
                : '0 8px 24px rgba(0, 0, 0, 0.5)',
              transform: hovered ? 'scale(1.06) translateY(-4px)' : 'scale(1)',
              transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: '#fb923c',
                  background: 'rgba(234, 88, 12, 0.25)',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                {hotspot.tag}
              </span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            </div>

            <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 900, lineHeight: 1.2, marginBottom: 2 }}>
              {hotspot.title}
            </div>

            <div style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: 1.35, fontWeight: 500 }}>
              {hotspot.subtitle}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
                marginTop: 6,
                paddingTop: 5,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span>{hotspot.targetScene ? 'Bước tới góc nhìn này' : 'Khám phá môn học'}</span>
              <ArrowRight size={12} />
            </div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

// Sub-component: Camera Manager & Auto-rotation
function CameraController({
  autoRotate,
  userInteracting,
}: {
  autoRotate: boolean;
  userInteracting: boolean;
}) {
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (controlsRef.current && autoRotate && !userInteracting) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.5;
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={false}
      enablePan={false}
      rotateSpeed={-0.35}
      dampingFactor={0.08}
      enableDamping
    />
  );
}

interface FptPanoViewerProps {
  className?: string;
  style?: React.CSSProperties;
  onExploreExams?: () => void;
}

export default function FptPanoViewer({
  className,
  style,
  onExploreExams,
}: FptPanoViewerProps) {
  const [currentSceneId, setCurrentSceneId] = useState<PanoSceneId>('alpha_gate');
  const [autoRotate, setAutoRotate] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sceneConfig = PANO_SCENES[currentSceneId];

  const handleSwitchScene = (sceneId: PanoSceneId) => {
    setCurrentSceneId(sceneId);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#090d16',
        borderRadius: isFullscreen ? 0 : 'inherit',
        ...style,
      }}
      onPointerDown={() => setIsInteracting(true)}
      onPointerUp={() => setIsInteracting(false)}
    >
      {/* ── Three.js 360 Canvas with Ultra-Crisp Rendering ── */}
      <Canvas
        camera={{ position: [0, 0, 0.1], fov: 55 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          precision: 'highp',
        }}
        dpr={[1, 2.5]}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
      >
        <CameraController autoRotate={autoRotate} userInteracting={isInteracting} />

        {/* 360 Photo Spherical Cube */}
        <PanoCube key={sceneConfig.id} sceneConfig={sceneConfig} />

        {/* Hotspots for the current scene */}
        {sceneConfig.hotspots.map((h) => (
          <PanoHotspot
            key={h.id}
            hotspot={h}
            onTrigger={handleSwitchScene}
            onOpenExams={onExploreExams}
          />
        ))}
      </Canvas>

      {/* ── Top Header Bar: Campus Info & Viewport Switcher ── */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 30,
        }}
      >
        {/* Left Badge: Location */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            borderRadius: 14,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 102, 0, 0.4)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6600', boxShadow: '0 0 10px #ff6600' }} />
          <span style={{ color: '#ffffff', fontSize: 12, fontWeight: 900, letterSpacing: '0.02em' }}>
            {sceneConfig.name}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
          <span style={{ color: '#fed7aa', fontSize: 11.5, fontWeight: 700 }}>
            {sceneConfig.tag}
          </span>
        </div>

        {/* Right Controls: Auto-rotate & Fullscreen */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {/* Rotate toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Tắt tự động xoay' : 'Bật tự động xoay 360°'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 10,
              background: autoRotate ? 'rgba(255, 102, 0, 0.25)' : 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              border: autoRotate ? '1.5px solid #ff6600' : '1px solid rgba(255, 255, 255, 0.15)',
              color: autoRotate ? '#ff9a4d' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RotateCw size={14} style={{ animation: autoRotate ? 'spin 6s linear infinite' : 'none' }} />
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* ── Bottom Step / View Selector Floating Nav ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(16px)',
          padding: '6px 8px',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 102, 0, 0.25)',
          zIndex: 30,
          maxWidth: '92%',
        }}
      >
        {(
          [
            { id: 'alpha_gate', label: '1. Sân Tòa Alpha', icon: <School size={13} /> },
            { id: 'alpha_hall', label: '2. Sảnh Penrose', icon: <Footprints size={13} /> },
            { id: 'campus_sky', label: '3. Toàn Cảnh Campus', icon: <Eye size={13} /> },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => handleSwitchScene(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 14,
              fontSize: 12,
              fontWeight: 800,
              color: currentSceneId === item.id ? '#ffffff' : '#94a3b8',
              background:
                currentSceneId === item.id
                  ? 'linear-gradient(135deg, #ff6600 0%, #ea580c 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: currentSceneId === item.id ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              boxShadow: currentSceneId === item.id ? '0 4px 14px rgba(234, 88, 12, 0.45)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
              whiteSpace: 'nowrap',
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Floating prompt helper */}
      <div
        style={{
          position: 'absolute',
          bottom: 64,
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          zIndex: 20,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(8px)',
          borderRadius: 20,
          padding: '4px 12px',
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        💡 Kéo chuột để xoay 360° • Nhấp điểm tròn để bước tới góc nhìn
      </div>
    </div>
  );
}
