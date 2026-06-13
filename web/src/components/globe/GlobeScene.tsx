'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars, useTexture, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import {
  countries,
  regionsForMode,
  getCountry,
  matchPlaceByName,
  type Country,
  type Place,
  type SceneMode,
} from '@/lib/places';
import { getAllAgencyTours } from '@/lib/companyStore';

interface AgencyMark { id: string; lat: number; lng: number; title: string; countryId: string }

export type Stage = 'globe' | 'country' | 'region';

const R = 1;
// Ближе на стадиях страны/региона — лучше видно рельеф, регионы и горы
const DIST: Record<Stage, number> = { globe: 3.9, country: 1.62, region: 1.3 };
const TILT = 0.41; // наклон оси ~23.5°

// Направление на Солнце по умолчанию (3/4 — виден и день, и кромка ночи с огнями городов)
const DEFAULT_SUN = new THREE.Vector3(1.0, 0.35, 0.65).normalize();
// Мутабельное направление: на стадии страны/региона солнце «подсвечивает» фокус,
// чтобы были видны рельеф, горы и регионы (а не ночная сторона).
const sunDir = DEFAULT_SUN.clone();

// Набор реалистичной Земли — хостится локально в /public для мгновенной и надёжной загрузки
// (бесоблачный день + ночные огни + облака + рельеф + маска воды/спекуляр)
const TEX = {
  day: '/textures/earth_day.jpg',
  night: '/textures/earth_night.png',
  clouds: '/textures/earth_clouds.png',
  bump: '/textures/earth_bump.jpg',
  water: '/textures/earth_specular.jpg',
};

// Переиспользуемые векторы — без аллокаций в кадре
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

// ── Земля: PBR + кастомный шейдер (терминатор день/ночь, огни городов, блик океана) ──
function Earth({ earthRef }: { earthRef: React.MutableRefObject<THREE.Mesh | null> }) {
  const [day, night, bump, water] = useTexture([TEX.day, TEX.night, TEX.bump, TEX.water]);

  const material = useMemo(() => {
    day.colorSpace = THREE.SRGBColorSpace;
    night.colorSpace = THREE.SRGBColorSpace;
    [day, night, bump, water].forEach((t) => {
      t.anisotropy = 8;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    });

    const mat = new THREE.MeshStandardMaterial({
      map: day,
      bumpMap: bump,
      bumpScale: 0.9,
      metalness: 0.1,
      roughness: 0.85,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunDir = { value: sunDir };
      shader.uniforms.uNightMap = { value: night };
      shader.uniforms.uWaterMap = { value: water };
      shader.uniforms.uNightIntensity = { value: 2.6 };

      // world normal / position для расчёта терминатора
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying vec3 vWNormal;\nvarying vec3 vWPos;'
        )
        .replace(
          '#include <beginnormal_vertex>',
          '#include <beginnormal_vertex>\nvWNormal = normalize(mat3(modelMatrix) * objectNormal);'
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform vec3 uSunDir;\nuniform sampler2D uNightMap;\nuniform sampler2D uWaterMap;\nuniform float uNightIntensity;\nvarying vec3 vWNormal;\nvarying vec3 vWPos;'
        )
        // Океан — гладкий и слегка металлический (зеркальный блик солнца), суша — матовая
        .replace(
          '#include <roughnessmap_fragment>',
          'float waterMask = texture2D(uWaterMap, vMapUv).r;\nfloat roughnessFactor = mix(0.93, 0.22, waterMask);'
        )
        .replace(
          '#include <metalnessmap_fragment>',
          'float metalnessFactor = mix(0.0, 0.45, waterMask);'
        )
        // Огни городов на ночной стороне + тёплое свечение у терминатора
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          {
            float ndl = dot(normalize(vWNormal), normalize(uSunDir));
            float night = smoothstep(0.10, -0.30, ndl);
            vec3 cityLights = texture2D(uNightMap, vMapUv).rgb;
            cityLights = pow(cityLights, vec3(1.4)) * vec3(1.0, 0.85, 0.55);
            totalEmissiveRadiance += cityLights * night * uNightIntensity;
            // мягкое тёплое свечение тонкой полосой заката на самом терминаторе
            float dusk = smoothstep(0.0, 0.16, ndl) * (1.0 - smoothstep(0.16, 0.40, ndl));
            totalEmissiveRadiance += vec3(1.0, 0.52, 0.30) * dusk * 0.14;
          }`
        );
    };

    return mat;
  }, [day, night, bump, water]);

  return (
    <mesh ref={earthRef} material={material}>
      <sphereGeometry args={[R, 128, 128]} />
    </mesh>
  );
}

// ── Облака: отдельная сфера, освещается тем же солнцем, медленный дрейф ──
function Clouds() {
  const ref = useRef<THREE.Mesh>(null);
  const clouds = useTexture(TEX.clouds);

  const material = useMemo(() => {
    clouds.colorSpace = THREE.SRGBColorSpace;
    clouds.anisotropy = 8;
    const mat = new THREE.MeshStandardMaterial({
      map: clouds,
      alphaMap: clouds,
      transparent: true,
      depthWrite: false,
      opacity: 0.92,
      roughness: 1,
      metalness: 0,
    });
    return mat;
  }, [clouds]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.012;
  });

  return (
    <mesh ref={ref} material={material} scale={1.006}>
      <sphereGeometry args={[R, 96, 96]} />
    </mesh>
  );
}

// ── Маркер (страна или место) ───────────────────────────────
function Pin({
  lat,
  lng,
  name,
  color,
  flagCode,
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
  flagCode?: string;
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
  const pos = useMemo(() => latLngToVec3(lat, lng, R * 1.01), [lat, lng]);
  const active = selected || hovered;
  // Маркеры заметно мельче — аккуратные точки, как в Apple/Google Maps
  const dotR = big ? 0.009 : 0.0065;

  useFrame((state) => {
    if (haloRef.current) {
      const t = (Math.sin(state.clock.elapsedTime * 2.2) + 1) / 2;
      haloRef.current.scale.setScalar(1 + t * (active ? 1.9 : big ? 1.3 : 1.0));
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.4;
    }
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
        <sphereGeometry args={[dotR, 16, 16]} />
        <meshBasicMaterial color={active ? '#ffffff' : color} toneMapped={false} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[dotR, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onOver(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onOut(); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[big ? 0.04 : 0.03, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {(flagCode || showName || active) && (
        <Html
          center
          position={[0, big ? 0.032 : 0.024, 0]}
          occlude={[occludeRef as unknown as React.MutableRefObject<THREE.Object3D>]}
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-1.5 pr-2.5 text-xs font-semibold shadow-lg backdrop-blur transition-colors ${
              active
                ? 'bg-white text-slate-900 ring-2 ring-white/60'
                : flagCode
                ? 'bg-slate-950/70 text-white ring-1 ring-white/15'
                : 'bg-white/90 px-2.5 text-slate-800'
            }`}
          >
            {flagCode && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://flagcdn.com/${flagCode}.svg`}
                alt=""
                aria-hidden
                className="h-3.5 w-5 rounded-[2px] object-cover ring-1 ring-white/30"
              />
            )}
            {(showName || active) && <span>{name}</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Маркер тура турагентства (мелкая золотая точка) ─────────
function AgencyMarker({
  mark, hovered, occludeRef, onOver, onOut,
}: {
  mark: AgencyMark;
  hovered: boolean;
  occludeRef: React.MutableRefObject<THREE.Mesh | null>;
  onOver: () => void;
  onOut: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pos = useMemo(() => latLngToVec3(mark.lat, mark.lng, R * 1.008), [mark.lat, mark.lng]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.getWorldPosition(_wp);
      _normal.copy(_wp).normalize();
      _toCam.copy(state.camera.position).sub(_wp).normalize();
      groupRef.current.visible = _normal.dot(_toCam) > -0.05;
    }
  });

  return (
    <group ref={groupRef} position={pos}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); onOver(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onOut(); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[hovered ? 0.0075 : 0.0055, 14, 14]} />
        <meshBasicMaterial color={hovered ? '#ffffff' : '#f5b301'} toneMapped={false} />
      </mesh>
      {hovered && (
        <Html center position={[0, 0.022, 0]} occlude={[occludeRef as unknown as React.MutableRefObject<THREE.Object3D>]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-lg">
            {mark.title}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Солнце: на globe — фикс. терминатор; при фокусе — подсвечивает регион ──
const _sunTarget = new THREE.Vector3();
function SunController({
  stage, focusDir, lightRef,
}: {
  stage: Stage;
  focusDir: THREE.Vector3 | null;
  lightRef: React.MutableRefObject<THREE.DirectionalLight | null>;
}) {
  useFrame(() => {
    if (stage !== 'globe' && focusDir) {
      // светим почти в лоб на регион, но с подмесом бокового угла — для объёма гор
      _sunTarget.copy(focusDir).normalize().lerp(DEFAULT_SUN, 0.28).normalize();
    } else {
      _sunTarget.copy(DEFAULT_SUN);
    }
    sunDir.lerp(_sunTarget, 0.05).normalize();
    if (lightRef.current) {
      lightRef.current.position.copy(sunDir).multiplyScalar(8);
      lightRef.current.target.position.set(0, 0, 0);
      lightRef.current.target.updateMatrixWorld();
    }
  });
  return null;
}

// ── Камера: кинематографический вход + плавный фокус ─────────
function CameraRig({ stage, focusDir }: { stage: Stage; focusDir: THREE.Vector3 | null }) {
  const { camera } = useThree();
  const intro = useRef(0); // 0→1 на старте
  const desired = useRef(new THREE.Vector3(0, 0, DIST.globe));

  useFrame((_, delta) => {
    intro.current = Math.min(1, intro.current + delta * 0.6);
    // в начале камера дальше и плавно (ease-out) подлетает к планете
    const introExtra = Math.pow(1 - intro.current, 3) * 2.6;

    let dist: number;
    if (stage === 'globe' || !focusDir) {
      desired.current.set(0, 0, 1);
      dist = DIST.globe;
    } else {
      // направление на выбранную страну/регион в мировых координатах
      desired.current.copy(focusDir).normalize();
      dist = DIST[stage];
    }
    desired.current.multiplyScalar(dist + introExtra);

    // быстрее на приближении к стране/региону — ощущается как «полёт» камеры
    const speed = stage === 'globe' ? 0.06 : 0.08;
    camera.position.lerp(desired.current, speed);
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
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const [focusDir, setFocusDir] = useState<THREE.Vector3 | null>(null);
  const spinning = stage === 'globe';
  const country = countryId ? getCountry(countryId) : null;

  // Туры турагентств → отметки на глобусе (по совпадению направления с известным местом)
  const [agencyMarks, setAgencyMarks] = useState<AgencyMark[]>([]);
  const [hoveredAgency, setHoveredAgency] = useState<string | null>(null);
  useEffect(() => {
    const load = () => {
      const marks: AgencyMark[] = [];
      getAllAgencyTours()
        .filter((t) => t.status === 'published')
        .forEach((t) => {
          const place = matchPlaceByName(t.destination);
          if (place) marks.push({ id: t.id, lat: place.lat, lng: place.lng, title: t.title, countryId: place.countryId });
        });
      setAgencyMarks(marks);
    };
    load();
    window.addEventListener('storage', load);
    window.addEventListener('jolu-tours', load);
    return () => { window.removeEventListener('storage', load); window.removeEventListener('jolu-tours', load); };
  }, []);

  const shownAgency = useMemo(
    () => (stage === 'globe' ? agencyMarks : agencyMarks.filter((m) => m.countryId === countryId)),
    [agencyMarks, stage, countryId]
  );

  useFrame((_, delta) => {
    if (spin.current && spinning) spin.current.rotation.y += delta * 0.035;
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
      {/* почти чёрный космос + холодный заполняющий свет от звёзд */}
      <ambientLight intensity={0.1} color="#9bb8ff" />
      {/* Солнце — направленный источник; при фокусе подсвечивает регион (SunController) */}
      <directionalLight ref={lightRef} position={DEFAULT_SUN.clone().multiplyScalar(8)} intensity={3.4} color="#fff6ea" />
      <SunController stage={stage} focusDir={focusDir} lightRef={lightRef} />
      <Stars radius={70} depth={50} count={3500} factor={4} saturation={0} fade speed={0.4} />

      <group rotation={[TILT, 0, 0]}>
        <group ref={spin}>
          <Earth earthRef={earthRef} />
          <Clouds />

          {stage === 'globe' &&
            countries.map((c) => (
              <Pin
                key={c.id}
                lat={c.lat}
                lng={c.lng}
                name={c.name}
                color={c.accent}
                flagCode={c.id}
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

          {/* Туры турагентств */}
          {shownAgency.map((m) => (
            <AgencyMarker
              key={m.id}
              mark={m}
              hovered={hoveredAgency === m.id}
              occludeRef={earthRef}
              onOver={() => setHoveredAgency(m.id)}
              onOut={() => setHoveredAgency(null)}
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
      camera={{ position: [0, 0, 6.2], fov: 32 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onPointerMissed={() => { document.body.style.cursor = 'auto'; }}
    >
      <AdaptiveDpr pixelated />
      <Scene {...props} />
    </Canvas>
  );
}
