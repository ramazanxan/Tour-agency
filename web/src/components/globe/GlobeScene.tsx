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
const DIST: Record<Stage, number> = { globe: 3.9, country: 2.05, region: 1.62 };
const TILT = 0.41; // наклон оси ~23.5°

// Направление на Солнце в мировых координатах (3/4 — виден и день, и кромка ночи с огнями городов)
const SUN_DIR = new THREE.Vector3(1.0, 0.35, 0.65).normalize();

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
      bumpScale: 0.6,
      metalness: 0.1,
      roughness: 0.85,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunDir = { value: SUN_DIR };
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
  const pos = useMemo(() => latLngToVec3(lat, lng, R * 1.012), [lat, lng]);
  const active = selected || hovered;
  const dotR = big ? 0.018 : 0.012;

  useFrame((state) => {
    if (haloRef.current) {
      const t = (Math.sin(state.clock.elapsedTime * 2.2) + 1) / 2;
      haloRef.current.scale.setScalar(1 + t * (active ? 2.8 : big ? 2 : 1.4));
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.55;
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
        <sphereGeometry args={[dotR, 18, 18]} />
        <meshBasicMaterial color={active ? '#ffffff' : color} toneMapped={false} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[dotR, 18, 18]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} />
      </mesh>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onOver(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onOut(); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[big ? 0.06 : 0.045, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {(flagCode || showName || active) && (
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

// ── Камера: кинематографический вход + плавный фокус ─────────
function CameraRig({ stage, focusDir }: { stage: Stage; focusDir: THREE.Vector3 | null }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, DIST.globe));
  const intro = useRef(0); // 0→1 на старте

  useFrame((_, delta) => {
    intro.current = Math.min(1, intro.current + delta * 0.5);
    // ease-out cubic для входа
    const e = 1 - Math.pow(1 - intro.current, 3);

    if (stage === 'globe' || !focusDir) target.current.set(0, 0, DIST.globe);
    else target.current.copy(focusDir).multiplyScalar(DIST[stage]);

    // на входе камера стартует дальше и приближается
    const introDist = THREE.MathUtils.lerp(6.2, 0, 1 - e);
    const dir = target.current.clone().normalize();
    const wanted = target.current.clone().add(dir.multiplyScalar(introDist));

    camera.position.lerp(wanted, stage === 'globe' && intro.current < 1 ? 0.12 : 0.055);
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
      <ambientLight intensity={0.08} color="#9bb8ff" />
      {/* Солнце — основной направленный источник, совпадает с терминатором */}
      <directionalLight position={SUN_DIR.clone().multiplyScalar(8)} intensity={3.4} color="#fff6ea" />
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
