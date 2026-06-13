'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronDown, MapPin, Play, Route, Hotel, X, Search, Plus, Minus, Hand } from 'lucide-react';
import {
  countries,
  allPlaces,
  getCountry,
  regionsForMode,
  MODES,
  type Country,
  type Place,
  type SceneMode,
} from '@/lib/places';
import { getTourBySlug } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import type { Stage } from './GlobeScene';

const GlobeScene = dynamic(() => import('./GlobeScene').then((m) => m.GlobeScene), {
  ssr: false,
  loading: () => <GlobeLoader />,
});

function GlobeLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-lake-950">
      <div className="flex flex-col items-center gap-3 text-white/70">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm tracking-wide">Загружаем планету…</p>
      </div>
    </div>
  );
}

const fmt = (n: number, c: 'KGS' | 'USD') => formatPrice(n, c);

export function GlobeExperience() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);
  const [stage, setStage] = useState<Stage>('globe');
  const [countryId, setCountryId] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [mode, setMode] = useState<SceneMode>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);

  const country = countryId ? getCountry(countryId) : null;
  const place = country?.regions.find((r) => r.id === placeId) ?? null;
  const places = country ? regionsForMode(country, mode) : [];

  // Рендерим WebGL-сцену только пока герой на экране — иначе глобус «съедает»
  // кадры и параллакс гор начинает лагать при прокрутке.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: '120px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function selectCountry(c: Country) { setCountryId(c.id); setMode('all'); setStage('country'); }
  function selectPlace(p: Place) { setPlaceId(p.id); setStage('region'); }
  function goToPlace(c: Country, p: Place) { setCountryId(c.id); setMode('all'); setPlaceId(p.id); setStage('region'); }
  function back() {
    if (stage === 'region') { setStage('country'); setPlaceId(null); }
    else if (stage === 'country') { setStage('globe'); setCountryId(null); }
  }
  const zoom = (dir: -1 | 1) =>
    window.dispatchEvent(new CustomEvent('jolu-globe-zoom', { detail: dir }));

  return (
    <section ref={sectionRef} className="relative h-[calc(100svh-4rem)] min-h-[560px] w-full overflow-hidden bg-lake-950">
      <div className="absolute inset-0">
        <GlobeScene
          active={active}
          stage={stage}
          mode={mode}
          countryId={countryId}
          placeId={placeId}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          onSelectCountry={selectCountry}
          onSelectPlace={selectPlace}
        />
      </div>

      {/* Поиск стран и мест — как в Google Earth */}
      <GlobeSearch onCountry={selectCountry} onPlace={goToPlace} />

      {/* Зум + подсказка «крутите» */}
      <div className="pointer-events-auto absolute bottom-[88px] right-3 z-20 flex flex-col items-center gap-2 sm:right-5">
        <button onClick={() => zoom(-1)} aria-label="Приблизить"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-md transition-colors hover:bg-white/22">
          <Plus size={18} />
        </button>
        <button onClick={() => zoom(1)} aria-label="Отдалить"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-md transition-colors hover:bg-white/22">
          <Minus size={18} />
        </button>
        <span className="mt-1 hidden items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white/70 backdrop-blur sm:flex">
          <Hand size={11} /> крутите
        </span>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-lake-950/40 via-transparent to-lake-950/85" />

      {/* breadcrumb + back */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
          {stage === 'globe' ? 'Планета Земля' : stage === 'country' ? country?.name : `${country?.name} · ${place?.name}`}
        </span>
        {stage !== 'globe' && (
          <button onClick={back}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20">
            <ArrowLeft size={16} /> Назад
          </button>
        )}
      </div>

      {/* INTRO (globe) */}
      <AnimatePresence>
        {stage === 'globe' && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -24 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-x-0 top-[9%] z-10 px-6 text-center"
          >
            {/* радиальный скрим для читаемости поверх планеты */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[140%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(8,24,38,0.55)_0%,transparent_62%)]" />
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.8 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.32em] text-sunset-200 backdrop-blur-sm"
            >
              <span className="h-1 w-1 rounded-full bg-sunset-400" /> Центральная Азия · 4 страны
            </motion.p>
            <h1 className="font-display text-balance text-[2.6rem] font-extrabold leading-[0.98] tracking-tightest text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)] sm:text-7xl">
              Откройте мир<br className="hidden sm:block" /> на{' '}
              <span className="bg-gradient-to-r from-sunset-300 via-sunset-400 to-sunset-300 bg-clip-text text-transparent">живой планете</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-balance text-[15px] leading-relaxed text-white/75">
              Выберите страну на глобусе — камера отправится в кинематографическое путешествие к лучшим маршрутам.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODE CHIPS (country) */}
      <AnimatePresence>
        {stage === 'country' && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : 20 }}
            className="pointer-events-auto absolute inset-x-0 bottom-[176px] z-10 flex justify-center px-4 sm:bottom-[120px]"
          >
            <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-2xl bg-white/10 p-1.5 backdrop-blur-md">
              {MODES.map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    mode === m.id ? 'bg-white text-slate-900' : 'text-white/85 hover:bg-white/10'
                  }`}>
                  <span aria-hidden>{m.emoji}</span> {m.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SELECTION RAIL (globe → countries, country → places) */}
      <AnimatePresence mode="wait">
        {stage !== 'region' && (
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: reduce ? 0 : 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : 40 }}
            transition={{ duration: 0.45 }}
            className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 px-4 pb-5"
          >
            <div className="no-scrollbar mx-auto flex max-w-6xl gap-3 overflow-x-auto pb-1">
              {stage === 'globe'
                ? countries.map((c) => (
                    <RailCard
                      key={c.id} title={c.name} subtitle={c.tagline} flagCode={c.id}
                      active={hoveredId === c.id}
                      onHover={() => setHoveredId(c.id)} onLeave={() => setHoveredId(null)}
                      onClick={() => selectCountry(c)}
                    />
                  ))
                : places.map((p) => (
                    <RailCard
                      key={p.id} title={p.name} subtitle={p.blurb} image={p.photos[0]}
                      active={hoveredId === p.id}
                      onHover={() => setHoveredId(p.id)} onLeave={() => setHoveredId(null)}
                      onClick={() => selectPlace(p)}
                    />
                  ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REGION PANEL */}
      <AnimatePresence>
        {stage === 'region' && place && country && (
          <RegionPanel place={place} country={country} onClose={back} onVideo={setVideo} reduce={!!reduce} />
        )}
      </AnimatePresence>

      {/* scroll cue */}
      {stage === 'globe' && (
        <div className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/40 sm:flex">
          <span className="text-[10px] uppercase tracking-widest">Листайте сайт вниз</span>
          <ChevronDown size={16} className="animate-bounce" />
        </div>
      )}

      <AnimatePresence>{video && <VideoModal src={video} onClose={() => setVideo(null)} />}</AnimatePresence>
    </section>
  );
}

// Поиск стран и мест на глобусе
function GlobeSearch({
  onCountry, onPlace,
}: {
  onCountry: (c: Country) => void;
  onPlace: (c: Country, p: Place) => void;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [] as { type: 'country'; c: Country }[] | { type: 'place'; c: Country; p: Place }[];
    const match = (txt: string) => txt.toLowerCase().includes(s);
    const cs = countries
      .filter((c) => match(c.name) || match(c.nameEn))
      .map((c) => ({ type: 'country' as const, c }));
    const ps = allPlaces
      .filter((p) => match(p.name) || match(p.nameEn))
      .map((p) => ({ type: 'place' as const, c: getCountry(p.countryId)!, p }));
    return [...cs, ...ps].slice(0, 7);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function pick(r: { type: 'country'; c: Country } | { type: 'place'; c: Country; p: Place }) {
    if (r.type === 'country') onCountry(r.c);
    else onPlace(r.c, r.p);
    setQ('');
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="pointer-events-auto absolute left-1/2 top-3 z-30 w-[min(92vw,22rem)] -translate-x-1/2 sm:top-5">
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/55 px-4 py-2.5 text-white shadow-lg backdrop-blur-md">
        <Search size={16} className="shrink-0 text-white/60" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Найти страну или место…"
          className="w-full bg-transparent text-sm placeholder:text-white/45 focus:outline-none"
        />
        {q && (
          <button onClick={() => { setQ(''); setOpen(false); }} aria-label="Очистить" className="shrink-0 text-white/50 hover:text-white">
            <X size={15} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="mt-2 overflow-hidden rounded-2xl border border-white/12 bg-slate-950/80 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            {results.map((r) => (
              <li key={r.type === 'country' ? `c-${r.c.id}` : `p-${r.p.id}`}>
                <button
                  onClick={() => pick(r)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
                >
                  <Flag code={r.c.id} className="h-3.5 w-5 shrink-0 rounded-[2px] ring-1 ring-white/20" />
                  <span className="min-w-0 flex-1 truncate">
                    {r.type === 'country' ? r.c.name : r.p.name}
                  </span>
                  <span className="shrink-0 text-xs text-white/45">
                    {r.type === 'country' ? 'Страна' : r.c.name}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// Настоящий SVG-флаг (эмодзи-флаги не рендерятся на Windows)
function Flag({ code, className = '' }: { code: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt=""
      aria-hidden
      className={`object-cover ${className}`}
    />
  );
}

function RailCard({
  title, subtitle, flagCode, image, active, onHover, onLeave, onClick,
}: {
  title: string; subtitle: string; flagCode?: string; image?: string;
  active: boolean; onHover: () => void; onLeave: () => void; onClick: () => void;
}) {
  return (
    <button
      onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}
      className={`group relative flex w-60 shrink-0 items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left backdrop-blur-xl transition-all duration-300 ${
        active
          ? 'border-white/60 bg-white/[0.18] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)] -translate-y-1'
          : 'border-white/10 bg-white/[0.07] hover:border-white/30 hover:bg-white/[0.12]'
      }`}
    >
      {flagCode ? (
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/20">
          <Flag code={flagCode} className="h-full w-full" />
        </span>
      ) : image ? (
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15">
          <Image src={image} alt={title} fill sizes="44px" className="object-cover" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display font-bold tracking-tight text-white">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-white/65">{subtitle}</span>
      </span>
      <ArrowLeft size={16} className="shrink-0 rotate-180 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white" />
    </button>
  );
}

function RegionPanel({
  place, country, onClose, onVideo, reduce,
}: {
  place: Place; country: Country; onClose: () => void; onVideo: (s: string) => void; reduce: boolean;
}) {
  const tours = place.tourSlugs.map(getTourBySlug).filter((t): t is NonNullable<typeof t> => Boolean(t));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.aside
      role="dialog" aria-modal="true" aria-label={place.name}
      initial={{ x: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 260 }}
      className="absolute inset-x-0 bottom-0 z-20 max-h-[82svh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[430px] sm:rounded-l-3xl sm:rounded-tr-none sm:p-6"
    >
      <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
        <X size={18} />
      </button>

      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-sunset-600">
        <Flag code={country.id} className="h-3.5 w-5 rounded-[2px] ring-1 ring-black/10" /> {country.name}
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900">{place.name}</h2>
      <p className="mt-2 text-slate-600">{place.blurb}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {place.photos.map((p, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
            <Image src={p} alt={`${place.name} ${i + 1}`} fill sizes="140px" className="object-cover transition-transform duration-500 hover:scale-110" />
          </div>
        ))}
      </div>

      {place.video360 && (
        <button onClick={() => onVideo(place.video360!)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          <Play size={16} /> Видео 360°
        </button>
      )}

      {tours.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-900"><Route size={18} className="text-lake-600" /> Маршруты</h3>
          <div className="space-y-2">
            {tours.map((t) => (
              <Link key={t!.id} href={`/tours/${t!.slug}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:border-lake-300 hover:bg-lake-50">
                <span className="text-sm font-medium text-slate-800">{t!.title}</span>
                <span className="shrink-0 text-sm font-semibold text-slate-900">{formatPrice(t!.price, t!.currency)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-900"><Hotel size={18} className="text-lake-600" /> Где остановиться</h3>
        <div className="space-y-2">
          {place.hotels.map((h) => (
            <div key={h.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
              <span className="text-slate-700">{h.name}</span>
              <span className="font-semibold text-slate-900">от {fmt(h.priceFrom, h.currency)}</span>
            </div>
          ))}
        </div>
      </div>

      <Link href="/tours"
        className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-sunset-500 py-3 font-semibold text-white hover:bg-sunset-600">
        <MapPin size={16} /> Смотреть туры
      </Link>
    </motion.aside>
  );
}

function VideoModal({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      role="dialog" aria-modal="true" aria-label="360° видео"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}
    >
      <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-black" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25">
          <X size={18} />
        </button>
        <iframe src={src} title="360° видео" className="h-full w-full" allow="accelerometer; gyroscope; autoplay; encrypted-media" allowFullScreen />
      </div>
    </motion.div>
  );
}
