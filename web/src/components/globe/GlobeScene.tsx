'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars, useTexture, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import { regions, regionsForMode, KYRGYZSTAN, type Region, type SceneMode } from '@/lib/regions';

export type Stage = 'globe' | 'country' | 'region';

const R = 1;
const DIST: Record<Stage, number> = { globe: 2.85, country: 1.95, region: 1.55 };
const EARTH_TEX = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

function latLngToVec3(lat: number, lng: number, r = R) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Земля + атмосфера ───────────────────────────────────────
function Earth() {
  const tex = useTexture(EARTH_TEX);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial map={tex} metalness={0.1} roughness={0.85} />
      </mesh>
      {/* Атмосферное свечение */}
      <mesh scale={1.18}>
        <sphereGeometry args={[R, 48, 48]} />
        <meshBasicMaterial color="#3fa0d6" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[R, 48, 48]} />
        <meshBasicMaterial color="#8fd0f5" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// ── Маркер точки ────────────────────────────────────────────
function Marker({
  region,
  label,
  highlight,
  onClick,
}: {
  region: { lat: number; lng: number; name: string };
  label: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const halo = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => latLngToVec3(region.lat, region.lng, R * 1.012), [region.lat, region.lng]);
  const color = highlight ? '#fc5212' : '#ffd9a8';

  useFrame((state) => {
    if (halo.current) {
      const t = (Math.sin(state.clock.elapsedTime * 2.4) + 1) / 2;
      const s = 1 + t * (highlight ? 2.4 : 1.4);
      halo.current.scale.setScalar(s);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.5;
    }
  });

  return (
    <group
      position={pos}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh>
        <sphereGeometry args={[highlight ? 0.018 : 0.012, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[highlight ? 0.018 : 0.012, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      {label && (
        <Html center distanceFactor={highlight ? 6 : 8} position={[0, highlight ? 0.06 : 0.04, 0]} zIndexRange={[10, 0]}>
          <span
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            className={`pointer-events-auto cursor-pointer select-none whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur ${
              highlight
                ? 'bg-sunset-500 text-white shadow-lg shadow-sunset-500/40'
                : 'bg-white/85 text-slate-800'
            }`}
          >
            {region.name}
          </span>
        </Html>
      )}
    </group>
  );
}

// ── Камера: облёт/наведение на точку ────────────────────────
function CameraRig({
  stage,
  focusDir,
  spinning,
}: {
  stage: Stage;
  focusDir: THREE.Vector3 | null;
  spinning: boolean;
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, DIST.globe));

  useFrame(() => {
    if (stage === 'globe' || !focusDir) {
      target.current.set(0, 0, DIST.globe);
    } else {
      target.current.copy(focusDir).multiplyScalar(DIST[stage]);
    }
    camera.position.lerp(target.current, 0.055);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── Сцена ───────────────────────────────────────────────────
function Scene({
  stage,
  mode,
  selectedId,
  onSelectCountry,
  onSelectRegion,
}: {
  stage: Stage;
  mode: SceneMode;
  selectedId: string | null;
  onSelectCountry: () => void;
  onSelectRegion: (r: Region) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [focusDir, setFocusDir] = useState<THREE.Vector3 | null>(null);
  const spinning = stage === 'globe';

  // Медленное вращение только на стадии глобуса
  useFrame((_, delta) => {
    if (group.current && spinning) {
      group.current.rotation.y += delta * 0.06;
    }
  });

  // Пересчёт точки фокуса при смене стадии/региона
  useEffect(() => {
    if (!group.current) return;
    if (stage === 'globe') { setFocusDir(null); return; }
    const ll =
      stage === 'region'
        ? regions.find((r) => r.id === selectedId) ?? KYRGYZSTAN
        : KYRGYZSTAN;
    const local = latLngToVec3(ll.lat, ll.lng, 1).normalize();
    const world = local.applyQuaternion(group.current.quaternion);
    setFocusDir(world);
  }, [stage, selectedId]);

  const visibleRegions = useMemo(() => regionsForMode(mode), [mode]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 3, 5]} intensity={1.3} />
      <Stars radius={50} depth={30} count={2200} factor={4} saturation={0} fade speed={0.6} />

      <group ref={group}>
        <Earth />

        {stage === 'globe' && (
          <Marker region={KYRGYZSTAN_LABEL} label highlight onClick={onSelectCountry} />
        )}

        {stage !== 'globe' &&
          visibleRegions.map((r) => (
            <Marker
              key={r.id}
              region={r}
              label
              highlight={r.id === selectedId}
              onClick={() => onSelectRegion(r)}
            />
          ))}
      </group>

      <CameraRig stage={stage} focusDir={focusDir} spinning={spinning} />
    </>
  );
}

const KYRGYZSTAN_LABEL = { ...KYRGYZSTAN, name: 'Кыргызстан' };

// ── Экспорт: Canvas-обёртка ─────────────────────────────────
export function GlobeScene(props: {
  stage: Stage;
  mode: SceneMode;
  selectedId: string | null;
  onSelectCountry: () => void;
  onSelectRegion: (r: Region) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, DIST.globe], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => { document.body.style.cursor = 'auto'; }}
    >
      <AdaptiveDpr pixelated />
      <Scene {...props} />
    </Canvas>
  );
}
