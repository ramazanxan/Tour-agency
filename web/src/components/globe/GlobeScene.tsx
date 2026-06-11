'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars, useTexture, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import {
  countries,
  regionsForMode,
  getCountry,
  type Country,
  type Place,
  type SceneMode,
} from '@/lib/places';

export type Stage = 'globe' | 'country' | 'region';

const R = 1;
const DIST: Record<Stage, number> = { globe: 3.6, country: 2.05, region: 1.62 };
const TILT = 0.36; // наклон оси ~23°
const EARTH_TEX = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const BUMP_TEX = 'https://unpkg.com/three-globe/example/img/earth-topology.png';

// Переиспользуемые векторы — без аллокаций в кадре (меньше нагрузка на GC, важно для мобильных)
const _wp = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _toCam = new THREE.Vector3();

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
function Earth({ earthRef }: { earthRef: React.MutableRefObject<THREE.Mesh | null> }) {
  const [map, bump] = useTexture([EARTH_TEX, BUMP_TEX]);
  useEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
  }, [map]);

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[R, 96, 96]} />
        <meshStandardMaterial
          map={map}
          bumpMap={bump}
          bumpScale={0.018}
          metalness={0.05}
          roughness={0.95}
        />
      </mesh>
      {/* Атмосферное свечение по лимбу */}
      <mesh scale={1.022}>
        <sphereGeometry args={[R, 64, 64]} />
        <meshBasicMaterial color="#7ec8f0" transparent opacity={0.16} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh scale={1.18}>
        <sphereGeometry args={[R, 64, 64]} />
        <meshBasicMaterial color="#2b76ab" transparent opacity={0.10} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// ── Маркер (страна или место) ───────────────────────────────
function Pin({
  lat,
  lng,
  name,
  color,
  flag,
  big,
  selected,
  hovered,
  showName,
  occludeRef,
  onClick,
  onOver,
  onOut,
}: {
  lat: number;
  lng: number;
  name: string;
  color: string;
  flag?: string;
  big?: boolean;
  selected?: boolean;
  hovered?: boolean;
  showName: boolean;
  occludeRef: React.MutableRefObject<THREE.Mesh | null>;
  onClick: () => void;
  onOver: () => void;
  onOut: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => latLngToVec3(lat, lng, R * 1.012), [lat, lng]);
  const active = selected || hovered;
  const dotR = big ? 0.02 : 0.013;

  useFrame((state) => {
    // Пульсация
    if (haloRef.current) {
      const t = (Math.sin(state.clock.elapsedTime * 2.2) + 1) / 2;
      haloRef.current.scale.setScalar(1 + t * (active ? 2.8 : big ? 2 : 1.4));
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.55;
    }
    // Скрываем маркеры на обратной стороне планеты (без аллокаций)
    if (groupRef.current) {
      groupRef.current.getWorldPosition(_wp);
      _normal.copy(_wp).normalize();
      _toCam.copy(state.camera.position).sub(_wp).normalize();
      groupRef.current.visible = _normal.dot(_toCam) > -0.08;
    }
  });

  return (
    <group ref={groupRef} position={pos}>
      <mesh>
        <sphereGeometry args={[dotR, 18, 18]} />
        <meshBasicMaterial color={active ? '#ffffff' : color} toneMapped={false} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[dotR, 18, 18]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} />
      </mesh>
      {/* Невидимая зона клика побольше */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onOver(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onOut(); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[big ? 0.06 : 0.045, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {(flag || showName || active) && (
        <Html
          center
          position={[0, big ? 0.05 : 0.035, 0]}
          occlude={[occludeRef as unknown as React.MutableRefObject<THREE.Object3D>]}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold shadow-lg backdrop-blur transition-colors ${
              active
                ? 'bg-white text-slate-900 ring-2 ring-white/60'
                : flag
                ? 'bg-slate-900/70 text-white'
                : 'bg-white/85 text-slate-800'
            }`}
          >
            {flag && <span aria-hidden>{flag}</span>}
            {(showName || active) && <span>{name}</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Камера ──────────────────────────────────────────────────
function CameraRig({ stage, focusDir }: { stage: Stage; focusDir: THREE.Vector3 | null }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, DIST.globe));
  useFrame(() => {
    if (stage === 'globe' || !focusDir) target.current.set(0, 0, DIST.globe);
    else target.current.copy(focusDir).multiplyScalar(DIST[stage]);
    camera.position.lerp(target.current, 0.05);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── Сцена ───────────────────────────────────────────────────
function Scene({
  stage,
  mode,
  countryId,
  placeId,
  hoveredId,
  onHover,
  onSelectCountry,
  onSelectPlace,
}: {
  stage: Stage;
  mode: SceneMode;
  countryId: string | null;
  placeId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelectCountry: (c: Country) => void;
  onSelectPlace: (p: Place) => void;
}) {
  const spin = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const [focusDir, setFocusDir] = useState<THREE.Vector3 | null>(null);
  const spinning = stage === 'globe';
  const country = countryId ? getCountry(countryId) : null;

  useFrame((_, delta) => {
    if (spin.current && spinning) spin.current.rotation.y += delta * 0.045;
  });

  useEffect(() => {
    if (!spin.current) return;
    if (stage === 'globe') { setFocusDir(null); return; }
    const here =
      stage === 'region' && country
        ? country.regions.find((r) => r.id === placeId)
        : country;
    if (!here) return;
    const local = latLngToVec3(here.lat, here.lng, 1).normalize();
    const q = spin.current.getWorldQuaternion(new THREE.Quaternion());
    setFocusDir(local.applyQuaternion(q));
  }, [stage, placeId, country]);

  const visiblePlaces = useMemo(
    () => (country ? regionsForMode(country, mode) : []),
    [country, mode]
  );

  return (
    <>
      <ambientLight intensity={0.32} />
      <directionalLight position={[-4, 1.5, 3]} intensity={2.1} color="#fff4e6" />
      <directionalLight position={[3, -1, -2]} intensity={0.35} color="#9ec9ff" />
      <Stars radius={60} depth={40} count={2600} factor={4.5} saturation={0} fade speed={0.5} />

      {/* tilt → spin → Earth + pins */}
      <group rotation={[TILT, 0, 0]}>
        <group ref={spin}>
          <Earth earthRef={earthRef} />

          {stage === 'globe' &&
            countries.map((c) => (
              <Pin
                key={c.id}
                lat={c.lat}
                lng={c.lng}
                name={c.name}
                color={c.accent}
                flag={c.flag}
                big
                showName={false}
                hovered={hoveredId === c.id}
                occludeRef={earthRef}
                onClick={() => onSelectCountry(c)}
                onOver={() => onHover(c.id)}
                onOut={() => onHover(null)}
              />
            ))}

          {stage !== 'globe' &&
            visiblePlaces.map((p) => (
              <Pin
                key={p.id}
                lat={p.lat}
                lng={p.lng}
                name={p.name}
                color={country?.accent ?? '#fc5212'}
                showName={hoveredId === p.id}
                hovered={hoveredId === p.id}
                selected={placeId === p.id}
                occludeRef={earthRef}
                onClick={() => onSelectPlace(p)}
                onOver={() => onHover(p.id)}
                onOut={() => onHover(null)}
              />
            ))}
        </group>
      </group>

      <CameraRig stage={stage} focusDir={focusDir} />
    </>
  );
}

export function GlobeScene(props: {
  stage: Stage;
  mode: SceneMode;
  countryId: string | null;
  placeId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelectCountry: (c: Country) => void;
  onSelectPlace: (p: Place) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, DIST.globe], fov: 34 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => { document.body.style.cursor = 'auto'; }}
    >
      <AdaptiveDpr pixelated />
      <Scene {...props} />
    </Canvas>
  );
}
