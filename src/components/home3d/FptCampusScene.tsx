import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import * as THREE from 'three';
import AlphaBuilding from './AlphaBuilding';
import FptSign3D from './FptSign3D';
import CampusGround from './CampusGround';
import CampusSky, { TimeOfDay } from './CampusSky';
import TourHotspots, { HotspotData } from './TourHotspots';
import { Sun, Moon, Sunset, Footprints, RotateCcw, Play, Pause, Maximize2, Compass } from 'lucide-react';

interface Waypoint {
  name: string;
  camPos: [number, number, number];
  lookAt: [number, number, number];
  description: string;
}

const WAYPOINTS: Waypoint[] = [
  {
    name: 'Quảng Trường Toàn Cảnh',
    camPos: [0, 5.2, 14],
    lookAt: [0, 3.2, -14],
    description: 'Ngắm toàn cảnh sân trước, sân bóng rổ và tòa nhà Alpha FPT.',
  },
  {
    name: 'Chân Biểu Tượng FPT',
    camPos: [0, 2.3, -1],
    lookAt: [0, 3.8, -18],
    description: 'Tiến sát cụm chữ 3D FPT UNIVERSITY và hàng cây cọ.',
  },
  {
    name: 'Chân Cổng Tòa Alpha',
    camPos: [0, 1.9, -15.5],
    lookAt: [0, 2.8, -30],
    description: 'Đứng ngay trước vòm cổng chính bước vào sảnh tòa Alpha.',
  },
];

interface SceneContentProps {
  currentStep: number;
  mouse: React.MutableRefObject<{ x: number; y: number; isDown: boolean }>;
  timeOfDay: TimeOfDay;
  onSelectHotspot: (h: HotspotData) => void;
  activeHotspotId: string | null;
  autoTour: boolean;
}

function SceneContent({
  currentStep,
  mouse,
  timeOfDay,
  onSelectHotspot,
  activeHotspotId,
  autoTour,
}: SceneContentProps) {
  const currentTargetPos = useRef(new THREE.Vector3(...WAYPOINTS[0].camPos));
  const currentLookAt = useRef(new THREE.Vector3(...WAYPOINTS[0].lookAt));

  useFrame((state, delta) => {
    const wp = WAYPOINTS[currentStep] || WAYPOINTS[0];
    const targetCam = new THREE.Vector3(...wp.camPos);
    const targetLook = new THREE.Vector3(...wp.lookAt);

    // If auto-touring, add gentle continuous walking bob and lateral sway
    const t = state.clock.elapsedTime;
    let swayX = 0;
    let swayY = 0;
    if (autoTour) {
      swayX = Math.sin(t * 0.8) * 0.6;
      swayY = Math.abs(Math.sin(t * 1.6)) * 0.15;
    }

    // Mouse parallax offset
    const mouseOffsetX = mouse.current.x * (currentStep === 2 ? 1.2 : 2.5);
    const mouseOffsetY = mouse.current.y * 1.0;

    targetCam.x += mouseOffsetX + swayX;
    targetCam.y += mouseOffsetY + swayY;

    // Smooth lerp camera position
    state.camera.position.lerp(targetCam, Math.min(delta * 3.2, 0.1));

    // Smooth lerp camera lookAt target
    currentLookAt.current.lerp(
      new THREE.Vector3(targetLook.x + mouseOffsetX * 0.4, targetLook.y + mouseOffsetY * 0.3, targetLook.z),
      Math.min(delta * 4, 0.15)
    );
    state.camera.lookAt(currentLookAt.current);
  });

  return (
    <group>
      {/* Dynamic Sky and Lighting */}
      <CampusSky timeOfDay={timeOfDay} />

      {/* Main Architectural Models */}
      <AlphaBuilding position={[0, 0, -26]} />
      <FptSign3D position={[0, 0.4, -8.5]} />
      <CampusGround />

      {/* 360 Tour Hotspots */}
      <TourHotspots
        onSelectHotspot={onSelectHotspot}
        activeHotspotId={activeHotspotId}
      />
    </group>
  );
}

interface FptCampusSceneProps {
  className?: string;
  style?: React.CSSProperties;
  onExploreExams?: () => void;
}

export default function FptCampusScene({ className, style, onExploreExams }: FptCampusSceneProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [autoTour, setAutoTour] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<HotspotData | null>(null);
  const mouse = useRef({ x: 0, y: 0, isDown: false });

  // Auto-tour timer
  useEffect(() => {
    if (!autoTour) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % WAYPOINTS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoTour]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouse.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * -2;
  };

  const handleMouseLeave = () => {
    mouse.current.x = 0;
    mouse.current.y = 0;
  };

  const stepForward = () => {
    setCurrentStep((prev) => Math.min(prev + 1, WAYPOINTS.length - 1));
  };

  const stepBackward = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleHotspotSelect = (h: HotspotData) => {
    setActiveHotspot(h);
    setCurrentStep(h.cameraTargetStep);
  };

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#090d16',
        borderRadius: 'inherit',
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── 3D Canvas Canvas ── */}
      <Canvas
        shadows
        camera={{ position: [0, 5.2, 14], fov: 52 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <React.Suspense fallback={null}>
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
          <SceneContent
            currentStep={currentStep}
            mouse={mouse}
            timeOfDay={timeOfDay}
            onSelectHotspot={handleHotspotSelect}
            activeHotspotId={activeHotspot?.id || null}
            autoTour={autoTour}
          />
        </React.Suspense>
      </Canvas>

      {/* ── Top Floating Overlay: Campus Tag & Time Switcher ── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 18,
          right: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 30,
        }}
      >
        {/* Left Badge: Campus Hanoi Indicator */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            borderRadius: 14,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 102, 0, 0.35)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6600', boxShadow: '0 0 10px #ff6600' }} />
          <span style={{ color: '#ffffff', fontSize: 12, fontWeight: 800, letterSpacing: '0.02em' }}>
            FPT University Hòa Lạc
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
          <span style={{ color: '#fed7aa', fontSize: 11.5, fontWeight: 600 }}>
            {WAYPOINTS[currentStep].name}
          </span>
        </div>

        {/* Right Controls: Time of Day Selector */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            padding: '4px 6px',
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {(
            [
              { id: 'day', icon: <Sun size={14} />, label: 'Ngày' },
              { id: 'sunset', icon: <Sunset size={14} />, label: 'Chiều' },
              { id: 'night', icon: <Moon size={14} />, label: 'Đêm' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeOfDay(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                color: timeOfDay === item.id ? '#ffffff' : '#94a3b8',
                background: timeOfDay === item.id ? '#ff6600' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom Interactive Walk-in HUD Controller ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          padding: '8px 14px',
          borderRadius: 22,
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5), 0 0 25px rgba(255, 102, 0, 0.2)',
          zIndex: 30,
          maxWidth: '92%',
        }}
      >
        {/* Step Backward Button */}
        <button
          onClick={stepBackward}
          disabled={currentStep === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 14,
            fontSize: 12.5,
            fontWeight: 800,
            color: currentStep === 0 ? '#475569' : '#e2e8f0',
            background: currentStep === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <RotateCcw size={14} />
          <span>Lùi lại</span>
        </button>

        {/* Step Waypoint Indicator Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px' }}>
          {WAYPOINTS.map((wp, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              title={wp.name}
              style={{
                width: currentStep === idx ? 24 : 8,
                height: 8,
                borderRadius: 99,
                background: currentStep === idx ? '#ff6600' : 'rgba(255,255,255,0.25)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: currentStep === idx ? '0 0 10px #ff6600' : 'none',
              }}
            />
          ))}
        </div>

        {/* Step Forward / Walk In Button */}
        <button
          onClick={stepForward}
          disabled={currentStep === WAYPOINTS.length - 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 14,
            fontSize: 12.5,
            fontWeight: 900,
            color: '#ffffff',
            background: currentStep === WAYPOINTS.length - 1
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #ff6600 0%, #ea580c 100%)',
            border: 'none',
            cursor: currentStep === WAYPOINTS.length - 1 ? 'default' : 'pointer',
            boxShadow: currentStep === WAYPOINTS.length - 1 ? 'none' : '0 6px 18px rgba(234, 88, 12, 0.45)',
            transition: 'all 0.25s ease',
          }}
        >
          <Footprints size={15} />
          <span>{currentStep === WAYPOINTS.length - 1 ? 'Đã tới cổng' : 'Bước tới'}</span>
        </button>

        {/* Auto Tour Toggle Button */}
        <button
          onClick={() => setAutoTour(!autoTour)}
          title="Tự động tham quan"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 12,
            background: autoTour ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            border: autoTour ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: autoTour ? '#38bdf8' : '#cbd5e1',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {autoTour ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>

      {/* Floating Info Card when at Foot of Alpha Gate */}
      {currentStep === 2 && (
        <div
          style={{
            position: 'absolute',
            bottom: 74,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255, 102, 0, 0.5)',
            borderRadius: 18,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 12px 30px rgba(0,0,0,0.6), 0 0 20px rgba(255, 102, 0, 0.3)',
            animation: 'fadeInUp 0.4s ease',
            zIndex: 30,
            maxWidth: '90%',
          }}
        >
          <div>
            <div style={{ color: '#fb923c', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Chào mừng bạn đến với Tòa Nhà Alpha
            </div>
            <div style={{ color: '#ffffff', fontSize: 13.5, fontWeight: 800 }}>
              Sẵn sàng ôn thi bứt phá điểm A/A+ các môn FPT?
            </div>
          </div>
          {onExploreExams && (
            <button
              onClick={onExploreExams}
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 800,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
              }}
            >
              Vào Kho Đề Thi
            </button>
          )}
        </div>
      )}
    </div>
  );
}
