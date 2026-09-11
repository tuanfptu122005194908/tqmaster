import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@/components/SafeCanvas';
import { Float, RoundedBox, Environment, Lightformer, ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Step = 'cart' | 'checkout' | 'confirm' | 'done';

const PALETTE = ['#6366f1', '#22c55e', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];

/** Các khối "môn học" bay lơ lửng — số lượng theo số món trong giỏ */
function FloatingPackages({ count }: { count: number }) {
  const items = useMemo(() => {
    const n = Math.max(3, Math.min(count || 3, 6));
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return {
        pos: [Math.cos(a) * 2.6, (i % 2 === 0 ? 0.35 : -0.3), Math.sin(a) * 1.1 - 0.3] as [number, number, number],
        color: PALETTE[i % PALETTE.length],
        speed: 1 + (i % 3) * 0.35,
        scale: 0.5 + ((i * 7) % 3) * 0.08,
      };
    });
  }, [count]);

  return (
    <>
      {items.map((it, i) => (
        <Float key={i} speed={it.speed} rotationIntensity={0.7} floatIntensity={0.9}>
          <RoundedBox args={[1, 1, 1]} radius={0.16} smoothness={4} position={it.pos} scale={it.scale} castShadow>
            <meshPhysicalMaterial
              color={it.color}
              roughness={0.28}
              metalness={0.05}
              clearcoat={0.8}
              clearcoatRoughness={0.25}
            />
          </RoundedBox>
        </Float>
      ))}
    </>
  );
}

/** Vật thể trung tâm đổi theo bước: túi hàng → thẻ → dấu tích */
function CenterPiece({ step }: { step: Step }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.45;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.08;
  });

  return (
    <group ref={group}>
      {step === 'cart' && (
        <RoundedBox args={[1.5, 1.35, 1.5]} radius={0.22} smoothness={5} castShadow>
          <meshPhysicalMaterial color="#4f46e5" roughness={0.22} clearcoat={1} clearcoatRoughness={0.15} />
        </RoundedBox>
      )}

      {step === 'checkout' && (
        <group rotation={[-0.35, 0, 0.12]}>
          <RoundedBox args={[2.1, 1.32, 0.12]} radius={0.09} smoothness={5} castShadow>
            <meshPhysicalMaterial color="#4f46e5" roughness={0.2} clearcoat={1} clearcoatRoughness={0.1} />
          </RoundedBox>
          <mesh position={[0, 0.18, 0.075]}>
            <planeGeometry args={[2.1, 0.32]} />
            <meshStandardMaterial color="#1e1b4b" roughness={0.5} />
          </mesh>
          <mesh position={[-0.62, -0.28, 0.075]}>
            <planeGeometry args={[0.42, 0.3]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.35} metalness={0.6} />
          </mesh>
        </group>
      )}

      {(step === 'confirm' || step === 'done') && (
        <group>
          <mesh castShadow>
            <torusGeometry args={[0.95, 0.16, 24, 72]} />
            <meshPhysicalMaterial
              color={step === 'done' ? '#22c55e' : '#4f46e5'}
              roughness={0.2}
              clearcoat={1}
              metalness={0.15}
            />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.22, 0.9, 0.22]} />
            <meshPhysicalMaterial color={step === 'done' ? '#22c55e' : '#4f46e5'} roughness={0.25} clearcoat={1} />
          </mesh>
          <mesh position={[-0.28, -0.24, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.22, 0.52, 0.22]} />
            <meshPhysicalMaterial color={step === 'done' ? '#22c55e' : '#4f46e5'} roughness={0.25} clearcoat={1} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export interface CheckoutHero3DProps {
  step: Step;
  title: string;
  subtitle?: string;
  itemCount?: number;
}

/**
 * Banner 3D nền sáng cho luồng giỏ hàng / thanh toán.
 * Tự động bỏ qua hiệu ứng nếu thiết bị không hỗ trợ WebGL (SafeCanvas).
 */
export default function CheckoutHero3D({ step, title, subtitle, itemCount = 3 }: CheckoutHero3DProps) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'calc(var(--radius) * 3)',
        overflow: 'hidden',
        marginBottom: 'var(--space-6)',
        background:
          'linear-gradient(135deg, hsl(var(--primary-subtle)) 0%, #ffffff 55%, hsl(var(--primary-subtle)) 100%)',
        border: '1px solid hsl(var(--primary) / 0.12)',
        boxShadow: '0 10px 40px hsl(var(--primary) / 0.08)',
        minHeight: 190,
      }}
    >
      {/* Lớp 3D */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0.6, 7], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.85} />
            <directionalLight position={[4, 6, 5]} intensity={1.5} castShadow />
            <directionalLight position={[-5, 2, -3]} intensity={0.5} color="#c7d2fe" />
            <Environment resolution={64}>
              <Lightformer intensity={2.4} position={[0, 4, 2]} scale={[10, 6, 1]} />
              <Lightformer intensity={1.1} color="#a5b4fc" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[16, 2, 1]} />
            </Environment>
            <group position={[1.9, -0.1, 0]}>
              <CenterPiece step={step} />
              <FloatingPackages count={itemCount} />
            </group>
            <ContactShadows position={[1.9, -1.55, 0]} opacity={0.22} blur={2.6} scale={11} far={4} />
          </Suspense>
        </Canvas>
      </div>

      {/* Nội dung chữ */}
      <div
        style={{
          position: 'relative',
          padding: 'var(--space-8) var(--space-6)',
          maxWidth: 460,
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            margin: 0,
            color: 'hsl(var(--foreground))',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: 'var(--space-2) 0 0',
              color: 'hsl(var(--muted-fg))',
              fontSize: '0.9375rem',
              lineHeight: 1.55,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
