'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronDown, MapPin, Play, Route, Hotel, X } from 'lucide-react';
import {
  countries,
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
  const [stage, setStage] = useState<Stage>('globe');
  const [countryId, setCountryId] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [mode, setMode] = useState<SceneMode>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);

  const country = countryId ? getCountry(countryId) : null;
  const place = country?.regions.find((r) => r.id === placeId) ?? null;
  const places = country ? regionsForMode(country, mode) : [];

  function selectCountry(c: Country) { setCountryId(c.id); setMode('all'); setStage('country'); }
  function selectPlace(p: Place) { setPlaceId(p.id); setStage('region'); }
  function back() {
    if (stage === 'region') { setStage('country'); setPlaceId(null); }
    else if (stage === 'country') { setStage('globe'); setCountryId(null); }
  }

  return (
    <section className="relative h-[calc(100svh-4rem)] min-h-[560px] w-full overflow-hidden bg-lake-950">
      <div className="absolute inset-0">
        <GlobeScene
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
            initial={{ opacity: 0, y: reduce ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -20 }}
            transition={{ duration: 0.7 }}
            className="pointer-events-none absolute inset-x-0 top-[16%] z-10 px-6 text-center"
          >
            <p className="mb-3 text-xs uppercase tracking-[0.35em] text-sunset-300">Путешествия Центральной Азии</p>
            <h1 className="text-balance text-3xl font-extrabold leading-[1.05] text-white drop-shadow-xl sm:text-6xl">
              Выберите страну<br className="hidden sm:block" /> на живой планете
            </h1>
            <p className="mx-auto mt-4 max-w-md text-balance text-white/80">
              Нажмите на метку страны или выберите её ниже — камера отправится в путешествие.
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
                      key={c.id} title={c.name} subtitle={c.tagline} flag={c.flag}
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

function RailCard({
  title, subtitle, flag, image, active, onHover, onLeave, onClick,
}: {
  title: string; subtitle: string; flag?: string; image?: string;
  active: boolean; onHover: () => void; onLeave: () => void; onClick: () => void;
}) {
  return (
    <button
      onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}
      className={`group relative flex w-56 shrink-0 items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left backdrop-blur-md transition-all ${
        active ? 'border-white/70 bg-white/20 scale-[1.02]' : 'border-white/10 bg-white/10 hover:bg-white/15'
      }`}
    >
      {flag ? (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl">{flag}</span>
      ) : image ? (
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
          <Image src={image} alt={title} fill sizes="44px" className="object-cover" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block truncate font-semibold text-white">{title}</span>
        <span className="block truncate text-xs text-white/70">{subtitle}</span>
      </span>
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

      <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-sunset-600">
        <span>{country.flag}</span> {country.name}
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
