'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronDown, MapPin, Play, Route, Hotel, X } from 'lucide-react';
import { MODES, regions, type Region, type SceneMode } from '@/lib/regions';
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

export function GlobeExperience() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>('globe');
  const [mode, setMode] = useState<SceneMode>('all');
  const [selected, setSelected] = useState<Region | null>(null);
  const [video, setVideo] = useState<string | null>(null);

  function selectCountry() {
    setStage('country');
  }
  function selectRegion(r: Region) {
    setSelected(r);
    setStage('region');
  }
  function back() {
    if (stage === 'region') { setStage('country'); setSelected(null); }
    else if (stage === 'country') { setStage('globe'); }
  }

  return (
    <section className="relative h-[calc(100svh-4rem)] min-h-[560px] w-full overflow-hidden bg-lake-950">
      {/* 3D canvas */}
      <div className="absolute inset-0">
        <GlobeScene
          stage={stage}
          mode={mode}
          selectedId={selected?.id ?? null}
          onSelectCountry={selectCountry}
          onSelectRegion={selectRegion}
        />
      </div>

      {/* Виньетка для читаемости текста */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-lake-950/50 via-transparent to-lake-950/70" />

      {/* Хлебные крошки / назад */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
        <span className="pointer-events-none rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
          {stage === 'globe' ? 'Планета' : stage === 'country' ? 'Кыргызстан' : selected?.name}
        </span>
        {stage !== 'globe' && (
          <button
            onClick={back}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <ArrowLeft size={16} /> Назад
          </button>
        )}
      </div>

      {/* Заголовок-интро на стадии глобуса */}
      <AnimatePresence>
        {stage === 'globe' && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -20 }}
            transition={{ duration: 0.7 }}
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6 text-center"
          >
            <h1 className="text-balance text-3xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-5xl">
              Вся красота Кыргызстана —<br className="hidden sm:block" /> на одной планете
            </h1>
            <p className="mx-auto mt-4 max-w-md text-balance text-white/80">
              Найдите Кыргызстан на глобусе и нажмите, чтобы отправиться в путешествие.
            </p>
            <motion.div
              animate={reduce ? {} : { y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="mt-8 inline-flex items-center gap-2 text-sm text-white/60"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-sunset-400" /> Нажмите на метку страны
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Переключатель режимов (страна/регион) */}
      <AnimatePresence>
        {stage !== 'globe' && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : 30 }}
            className="pointer-events-auto absolute inset-x-0 bottom-6 z-10 flex justify-center px-4"
          >
            <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-2xl bg-white/10 p-1.5 backdrop-blur-md">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    mode === m.id ? 'bg-white text-slate-900' : 'text-white/85 hover:bg-white/10'
                  }`}
                >
                  <span aria-hidden>{m.emoji}</span> {m.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Подсказка на стадии страны */}
      <AnimatePresence>
        {stage === 'country' && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 top-24 text-center text-sm text-white/70"
          >
            Выберите место — камера отправится к нему
          </motion.p>
        )}
      </AnimatePresence>

      {/* Панель региона */}
      <AnimatePresence>
        {stage === 'region' && selected && (
          <RegionPanel region={selected} onClose={back} onVideo={setVideo} reduce={!!reduce} />
        )}
      </AnimatePresence>

      {/* Скролл-подсказка вниз к сайту */}
      <div className="pointer-events-none absolute bottom-4 right-4 hidden flex-col items-center gap-1 text-white/50 sm:flex">
        <span className="text-[11px] uppercase tracking-widest">Скролл</span>
        <ChevronDown size={16} className="animate-bounce" />
      </div>

      {/* 360° видео-модал */}
      <AnimatePresence>
        {video && <VideoModal src={video} onClose={() => setVideo(null)} />}
      </AnimatePresence>
    </section>
  );
}

function RegionPanel({
  region,
  onClose,
  onVideo,
  reduce,
}: {
  region: Region;
  onClose: () => void;
  onVideo: (src: string) => void;
  reduce: boolean;
}) {
  const tours = region.tourSlugs.map(getTourBySlug).filter(Boolean);

  return (
    <motion.aside
      initial={{ x: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }}
      transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      className="absolute inset-x-0 bottom-0 z-20 max-h-[80svh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-l-3xl sm:rounded-tr-none sm:p-6"
    >
      <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
        <X size={18} />
      </button>

      <div className="mb-1 flex items-center gap-1.5 text-sm text-sunset-600">
        <MapPin size={15} /> Кыргызстан
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900">{region.name}</h2>
      <p className="mt-2 text-slate-600">{region.blurb}</p>

      {/* Галерея */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {region.photos.map((p, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
            <Image src={p} alt={`${region.name} ${i + 1}`} fill sizes="140px" className="object-cover" />
          </div>
        ))}
      </div>

      {region.video360 && (
        <button
          onClick={() => onVideo(region.video360!)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Play size={16} /> Видео 360°
        </button>
      )}

      {/* Маршруты */}
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

      {/* Отели */}
      <div className="mt-6">
        <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-900"><Hotel size={18} className="text-lake-600" /> Где остановиться</h3>
        <div className="space-y-2">
          {region.hotels.map((h) => (
            <div key={h.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
              <span className="text-slate-700">{h.name}</span>
              <span className="font-semibold text-slate-900">от {formatPrice(h.priceFrom)}</span>
            </div>
          ))}
        </div>
      </div>

      <Link href={`/tours?destination=${region.id}`}
        className="mt-6 flex w-full items-center justify-center rounded-xl bg-sunset-500 py-3 font-semibold text-white hover:bg-sunset-600">
        Все туры сюда
      </Link>
    </motion.aside>
  );
}

function VideoModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
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

export { regions };
