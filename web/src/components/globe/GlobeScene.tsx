'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars, useTexture, OrbitControls, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
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
// Дистанции камеры до центра планеты на каждой стадии
const DIST: Record<Stage, number> = { globe: 3.4, country: 1.75, region: 1.4 };
const MIN_DIST = 1.18; // нельзя залететь под поверхность
const MAX_DIST = 3.4; // дальше — отдаём прокрутку странице
const TILT = 0.41; // наклон оси ~23.5°
const TILT_EULER = new THREE.Euler(TILT, 0, 0);

// Направление на Солнце по умолчанию (3/4 — виден и день, и кромка ночи с огнями городов)
const DEFAULT_SUN = new THREE.Vector3(1.0, 0.35, 0.65).normalize();
const sunDir = DEFAULT_SUN.clone();

// Набор реалистичной Земли — хостится локально в /public
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

/** Мировое направление на точку (с учётом наклона оси планеты). */
export function focusDirFor(lat: number, lng: number) {
  return latLngToVec3(lat, lng, 1).normalize().applyEuler(TILT_EULER);
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
        .replace(
          '#include <roughnessmap_fragment>',
          'float waterMask = texture2D(uWaterMap, vMapUv).r;\nfloat roughnessFactor = mix(0.93, 0.22, waterMask);'
        )
        .replace(
          '#include <metalnessmap_fragment>',
          'float metalnessFactor = mix(0.0, 0.45, waterMask);'
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          {
            float ndl = dot(normalize(vWNormal), normalize(uSunDir));
            float night = smoothstep(0.10, -0.30, ndl);
            vec3 cityLights = texture2D(uNightMap, vMapUv).rgb;
            cityLights = pow(cityLights, vec3(1.4)) * vec3(1.0, 0.85, 0.55);
            totalEmissiveRadiance += cityLights * night * uNightIntensity;
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

// ── Атмосфера: тонкое голубое сияние по кромке планеты (как на снимках NASA) ──
function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color('#7fb4f0') } },
        vertexShader: `
          varying vec3 vN;
          varying vec3 vP;
          void main() {
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vP = mv.xyz;
            gl_Position = projectionMatrix * mv;
          }`,
        // Тонкая, плотная кромка у самого края диска (а не широкий «гало»),
        // как тонкая голубая линия атмосферы на снимках с орбиты.
        fragmentShader: `
          uniform vec3 uColor;
          varying vec3 vN;
          varying vec3 vP;
          void main() {
            vec3 viewDir = normalize(-vP);
            float fres = pow(1.0 - abs(dot(vN, viewDir)), 4.5);
            gl_FragColor = vec4(uColor, fres * 0.5);
          }`,
      }),
    []
  );
  return (
    <mesh material={material} scale={1.012}>
      <sphereGeometry args={[R, 64, 64]} />
    </mesh>
  );
}

// ── Облака: отдельная сфера, медленный дрейф ──
function Clouds() {
  const ref = useRef<THREE.Mesh>(null);
  const clouds = useTexture(TEX.clouds);

  const material = useMemo(() => {
    clouds.colorSpace = THREE.SRGBColorSpace;
    clouds.anisotropy = 8;
    return new THREE.MeshStandardMaterial({
      map: clouds,
      alphaMap: clouds,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
      roughness: 1,
      metalness: 0,
    });
  }, [clouds]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01;
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

// ── Камера: кинематографический «полёт» к стране/региону поверх OrbitControls ──
function CameraController({
  stage,
  focusDir,
  controlsRef,
}: {
  stage: Stage;
  focusDir: THREE.Vector3 | null;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const flying = useRef(true); // начинаем с интро-полёта
  const desired = useRef(new THREE.Vector3());

  // Любая смена фокуса/стадии запускает плавный полёт (на время отдаём управление камерой себе)
  useEffect(() => {
    flying.current = true;
    if (controlsRef.current) controlsRef.current.enabled = false;
  }, [stage, focusDir, controlsRef]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!flying.current) return;

    if (stage === 'globe' || !focusDir) {
      // вернуться к обзорному виду чуть сверху
      desired.current.set(0, 0.22, 1).normalize().multiplyScalar(DIST.globe);
    } else {
      desired.current.copy(focusDir).multiplyScalar(DIST[stage]);
    }

    camera.position.lerp(desired.current, 0.075);
    if (controls) controls.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);

    if (camera.position.distanceTo(desired.current) < 0.03) {
      flying.current = false;
      if (controls) {
        controls.target.set(0, 0, 0);
        controls.enabled = true;
        controls.update();
      }
    }
  });
  return null;
}

// ── Зум колесом/жестом и кнопками (без захвата прокрутки страницы) ──
function ZoomHandler({ controlsRef }: { controlsRef: React.MutableRefObject<OrbitControlsImpl | null> }) {
  const { gl, camera } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const apply = (factor: number) => {
      const c = controlsRef.current;
      if (!c) return;
      const dir = camera.position.clone().sub(c.target);
      const nd = THREE.MathUtils.clamp(dir.length() * factor, MIN_DIST, MAX_DIST);
      camera.position.copy(c.target).add(dir.setLength(nd));
      c.update();
    };
    const onWheel = (e: WheelEvent) => {
      const c = controlsRef.current;
      if (!c || !c.enabled) return;
      const dist = camera.position.distanceTo(c.target);
      // у дальнего предела — прокрутка вниз листает страницу дальше
      if (e.deltaY > 0 && dist >= MAX_DIST - 0.02) return;
      e.preventDefault();
      apply(Math.exp(e.deltaY * 0.0011));
    };
    const onZoom = (e: Event) => apply((e as CustomEvent<number>).detail < 0 ? 0.82 : 1.22);
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('jolu-globe-zoom', onZoom);
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('jolu-globe-zoom', onZoom);
    };
  }, [gl, camera, controlsRef]);
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
  const earthRef = useRef<THREE.Mesh | null>(null);
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [focusDir, setFocusDir] = useState<THREE.Vector3 | null>(null);
  const [engaged, setEngaged] = useState(false);
  const country = countryId ? getCountry(countryId) : null;

  // На обзорной стадии возвращаем авто-вращение, если пользователь не трогал глобус вручную
  useEffect(() => { if (stage === 'globe') setEngaged(false); }, [stage]);

  // Туры турагентств → отметки на глобусе
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

  // Куда лететь камере (мировое направление с учётом наклона оси)
  useEffect(() => {
    if (stage === 'globe') { setFocusDir(null); return; }
    const here =
      stage === 'region' && country
        ? country.regions.find((r) => r.id === placeId)
        : country;
    if (!here) return;
    setFocusDir(focusDirFor(here.lat, here.lng));
  }, [stage, placeId, country]);

  const visiblePlaces = useMemo(
    () => (country ? regionsForMode(country, mode) : []),
    [country, mode]
  );

  return (
    <>
      <ambientLight intensity={0.1} color="#9bb8ff" />
      <directionalLight ref={lightRef} position={DEFAULT_SUN.clone().multiplyScalar(8)} intensity={3.4} color="#fff6ea" />
      <SunController stage={stage} focusDir={focusDir} lightRef={lightRef} />
      <Stars radius={70} depth={50} count={3000} factor={4} saturation={0} fade speed={0.4} />

      <group rotation={[TILT, 0, 0]}>
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

      <Atmosphere />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom={false} /* зум — собственный обработчик, чтобы не ломать прокрутку */
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        minDistance={MIN_DIST}
        maxDistance={MAX_DIST}
        autoRotate={stage === 'globe' && !engaged}
        autoRotateSpeed={0.42}
        onStart={() => setEngaged(true)}
      />
      <CameraController stage={stage} focusDir={focusDir} controlsRef={controlsRef} />
      <ZoomHandler controlsRef={controlsRef} />
    </>
  );
}

export function GlobeScene(props: {
  active?: boolean;
  stage: Stage;
  mode: SceneMode;
  countryId: string | null;
  placeId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelectCountry: (c: Country) => void;
  onSelectPlace: (p: Place) => void;
}) {
  const { active = true, ...scene } = props;
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0.4, 5.4], fov: 32 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onPointerMissed={() => { document.body.style.cursor = 'auto'; }}
    >
      <AdaptiveDpr pixelated />
      <Scene {...scene} />
    </Canvas>
  );
}
