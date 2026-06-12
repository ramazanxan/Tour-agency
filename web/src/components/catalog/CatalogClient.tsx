'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  SlidersHorizontal, X, Search, Check, Mountain, Tent, Car, Landmark,
  UtensilsCrossed, Snowflake, Compass, ChevronDown,
} from 'lucide-react';
import type { Difficulty, GuideLang, Tour, TourType } from '@/lib/types';
import { DIFFICULTY_LABELS } from '@/lib/types';
import { destinations, nextDeparture } from '@/lib/mock-data';
import { TourCard } from '@/components/TourCard';
import { formatPrice } from '@/lib/utils';

type Sort = 'popular' | 'price_asc' | 'price_desc' | 'soonest' | 'rating';

// Чистые подписи типов (без эмодзи) + иконка
const TYPE_META: Record<TourType, { label: string; Icon: typeof Mountain }> = {
  trekking: { label: 'Треккинг', Icon: Mountain },
  horse: { label: 'Конный', Icon: Compass },
  jeep: { label: 'Джип-тур', Icon: Car },
  camping: { label: 'Кемпинг', Icon: Tent },
  cultural: { label: 'Культурный', Icon: Landmark },
  gastro: { label: 'Гастро', Icon: UtensilsCrossed },
  ski: { label: 'Горнолыжный', Icon: Snowflake },
};
const TYPES = Object.keys(TYPE_META) as TourType[];

const DURATIONS: [string, string][] = [
  ['1', '1 день'], ['weekend', 'Выходные'], ['3-7', '3–7 дней'], ['7+', '7+ дней'],
];

const SORT_LABELS: Record<Sort, string> = {
  popular: 'Популярные',
  price_asc: 'Сначала дешевле',
  price_desc: 'Сначала дороже',
  soonest: 'Ближайший выезд',
  rating: 'Высокий рейтинг',
};

interface Filters {
  types: TourType[];
  destinations: string[];
  difficulties: Difficulty[];
  langs: GuideLang[];
  durations: string[];
  maxPrice: number;
  kidsFriendly: boolean;
  allInclusive: boolean;
  smallGroup: boolean;
}

const MAX = 40000;
const EMPTY: Filters = {
  types: [], destinations: [], difficulties: [], langs: [], durations: [],
  maxPrice: MAX, kidsFriendly: false, allInclusive: false, smallGroup: false,
};

function inDuration(days: number, bucket: string) {
  if (bucket === '1') return days === 1;
  if (bucket === 'weekend') return days === 2;
  if (bucket === '3-7') return days >= 3 && days <= 7;
  if (bucket === '7+') return days > 7;
  return true;
}

export function CatalogClient({
  tours,
  initial,
}: {
  tours: Tour[];
  initial: { type?: TourType; destination?: string; q?: string };
}) {
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY,
    types: initial.type ? [initial.type] : [],
    destinations: initial.destination ? [initial.destination] : [],
  });
  const [q, setQ] = useState(initial.q ?? '');
  const [sort, setSort] = useState<Sort>('popular');
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  const filtered = useMemo(() => {
    const destBySlug = new Map(destinations.map((d) => [d.slug, d.id]));
    const selDestIds = filters.destinations.map((s) => destBySlug.get(s));

    let result = tours.filter((t) => {
      if (filters.types.length && !filters.types.includes(t.type)) return false;
      if (selDestIds.length && !selDestIds.includes(t.destinationId)) return false;
      if (filters.difficulties.length && !filters.difficulties.includes(t.difficulty)) return false;
      if (filters.langs.length && !filters.langs.some((l) => t.guideLangs.includes(l))) return false;
      if (filters.durations.length && !filters.durations.some((d) => inDuration(t.durationDays, d))) return false;
      if (t.price > filters.maxPrice) return false;
      if (filters.kidsFriendly && !t.kidsFriendly) return false;
      if (filters.allInclusive && !t.allInclusive) return false;
      if (filters.smallGroup && !t.smallGroup) return false;
      if (q.trim()) {
        const hay = `${t.title} ${destinations.find((d) => d.id === t.destinationId)?.name ?? ''}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'soonest': {
          const da = nextDeparture(a)?.dateStart ?? '9999';
          const db = nextDeparture(b)?.dateStart ?? '9999';
          return +new Date(da) - +new Date(db);
        }
        default: return b.viewsCount - a.viewsCount;
      }
    });
    return result;
  }, [tours, filters, q, sort]);

  const activeCount =
    filters.types.length + filters.destinations.length + filters.difficulties.length +
    filters.langs.length + filters.durations.length +
    (filters.kidsFriendly ? 1 : 0) + (filters.allInclusive ? 1 : 0) + (filters.smallGroup ? 1 : 0) +
    (filters.maxPrice < MAX ? 1 : 0);

  // Чипсы активных фильтров (удаляемые)
  const destName = (slug: string) => destinations.find((d) => d.slug === slug)?.name ?? slug;
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...filters.types.map((t) => ({ key: `t-${t}`, label: TYPE_META[t].label, remove: () => setFilters((f) => ({ ...f, types: toggle(f.types, t) })) })),
    ...filters.destinations.map((d) => ({ key: `d-${d}`, label: destName(d), remove: () => setFilters((f) => ({ ...f, destinations: toggle(f.destinations, d) })) })),
    ...filters.difficulties.map((d) => ({ key: `df-${d}`, label: DIFFICULTY_LABELS[d], remove: () => setFilters((f) => ({ ...f, difficulties: toggle(f.difficulties, d) })) })),
    ...filters.durations.map((d) => ({ key: `du-${d}`, label: DURATIONS.find(([v]) => v === d)?.[1] ?? d, remove: () => setFilters((f) => ({ ...f, durations: toggle(f.durations, d) })) })),
    ...filters.langs.map((l) => ({ key: `l-${l}`, label: `Гид: ${l}`, remove: () => setFilters((f) => ({ ...f, langs: toggle(f.langs, l) })) })),
    ...(filters.maxPrice < MAX ? [{ key: 'price', label: `до ${formatPrice(filters.maxPrice)}`, remove: () => setFilters((f) => ({ ...f, maxPrice: MAX })) }] : []),
    ...(filters.kidsFriendly ? [{ key: 'kids', label: 'С детьми', remove: () => setFilters((f) => ({ ...f, kidsFriendly: false })) }] : []),
    ...(filters.allInclusive ? [{ key: 'all', label: 'Всё включено', remove: () => setFilters((f) => ({ ...f, allInclusive: false })) }] : []),
    ...(filters.smallGroup ? [{ key: 'small', label: 'Малая группа', remove: () => setFilters((f) => ({ ...f, smallGroup: false })) }] : []),
  ];

  const FilterPanel = (
    <div className="space-y-7">
      <FilterGroup title="Направление">
        {destinations.map((d) => (
          <CheckRow key={d.id} label={d.name} checked={filters.destinations.includes(d.slug)}
            onChange={() => setFilters((f) => ({ ...f, destinations: toggle(f.destinations, d.slug) }))} />
        ))}
      </FilterGroup>

      <FilterGroup title="Длительность">
        {DURATIONS.map(([v, l]) => (
          <CheckRow key={v} label={l} checked={filters.durations.includes(v)}
            onChange={() => setFilters((f) => ({ ...f, durations: toggle(f.durations, v) }))} />
        ))}
      </FilterGroup>

      <FilterGroup title="Цена">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">до</span>
          <span className="font-display font-bold text-slate-900">{formatPrice(filters.maxPrice)}</span>
        </div>
        <input type="range" min={2000} max={MAX} step={500} value={filters.maxPrice}
          onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
          className="w-full accent-sunset-500" />
      </FilterGroup>

      <FilterGroup title="Сложность">
        {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
          <CheckRow key={d} label={DIFFICULTY_LABELS[d]} checked={filters.difficulties.includes(d)}
            onChange={() => setFilters((f) => ({ ...f, difficulties: toggle(f.difficulties, d) }))} />
        ))}
      </FilterGroup>

      <FilterGroup title="Язык гида">
        {(['KG', 'RU', 'EN'] as GuideLang[]).map((l) => (
          <CheckRow key={l} label={l} checked={filters.langs.includes(l)}
            onChange={() => setFilters((f) => ({ ...f, langs: toggle(f.langs, l) }))} />
        ))}
      </FilterGroup>

      <FilterGroup title="Особенности">
        <CheckRow label="Можно с детьми" checked={filters.kidsFriendly}
          onChange={() => setFilters((f) => ({ ...f, kidsFriendly: !f.kidsFriendly }))} />
        <CheckRow label="Всё включено" checked={filters.allInclusive}
          onChange={() => setFilters((f) => ({ ...f, allInclusive: !f.allInclusive }))} />
        <CheckRow label="Маленькая группа (до 8)" checked={filters.smallGroup}
          onChange={() => setFilters((f) => ({ ...f, smallGroup: !f.smallGroup }))} />
      </FilterGroup>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Поиск */}
      <div className="relative mb-5">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Куда хотите поехать?"
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-[15px] shadow-sm outline-none ring-sunset-400/40 transition focus:border-sunset-300 focus:ring-4" />
      </div>

      {/* Быстрые пилюли-категории */}
      <div className="no-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
        {TYPES.map((t) => {
          const { label, Icon } = TYPE_META[t];
          const active = filters.types.includes(t);
          return (
            <button key={t} onClick={() => setFilters((f) => ({ ...f, types: toggle(f.types, t) }))}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}>
              <Icon size={15} className={active ? 'text-sunset-300' : 'text-slate-400'} /> {label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-8">
        {/* Desktop filters */}
        <aside className="sticky top-20 hidden h-fit w-64 shrink-0 lg:block">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">Фильтры</h3>
              {activeCount > 0 && (
                <button onClick={() => { setFilters(EMPTY); setQ(''); }}
                  className="text-xs font-medium text-sunset-600 hover:text-sunset-700">Сбросить</button>
              )}
            </div>
            {FilterPanel}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Тулбар */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Найдено <b className="font-display text-slate-900">{filtered.length}</b> {plural(filtered.length, ['тур', 'тура', 'туров'])}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 lg:hidden">
                <SlidersHorizontal size={16} /> Фильтры {activeCount > 0 && <span className="rounded-full bg-slate-900 px-1.5 text-xs text-white">{activeCount}</span>}
              </button>
              <div className="relative">
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
                  className="h-11 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-9 text-sm font-medium text-slate-700 outline-none ring-sunset-400/40 transition focus:border-sunset-300 focus:ring-4">
                  {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                    <option key={s} value={s}>{SORT_LABELS[s]}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Чипсы активных фильтров */}
          {chips.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button key={c.key} onClick={c.remove}
                  className="group flex items-center gap-1.5 rounded-full bg-lake-50 py-1.5 pl-3 pr-2 text-xs font-medium text-lake-700 ring-1 ring-lake-100 transition hover:bg-lake-100">
                  {c.label}
                  <X size={13} className="text-lake-400 transition group-hover:text-lake-700" />
                </button>
              ))}
              <button onClick={() => { setFilters(EMPTY); setQ(''); }}
                className="text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-700 hover:underline">очистить всё</button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 py-20 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <Compass size={26} className="text-slate-300" />
              </span>
              <h3 className="font-display text-lg font-bold text-slate-800">Туров не нашлось</h3>
              <p className="mt-1 max-w-xs text-sm text-slate-500">Попробуйте смягчить фильтры или сбросить их полностью.</p>
              <button onClick={() => { setFilters(EMPTY); setQ(''); }}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t, i) => (
                <motion.div key={t.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}>
                  <TourCard tour={t} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="absolute bottom-0 max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Фильтры</h3>
              <button onClick={() => setMobileOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X /></button>
            </div>
            {FilterPanel}
            <div className="sticky bottom-0 -mx-5 mt-6 flex gap-3 border-t border-slate-100 bg-white px-5 pt-4">
              {activeCount > 0 && (
                <button onClick={() => { setFilters(EMPTY); setQ(''); }}
                  className="h-12 flex-1 rounded-xl border border-slate-200 font-semibold text-slate-700">Сбросить</button>
              )}
              <button onClick={() => setMobileOpen(false)}
                className="h-12 flex-[2] rounded-xl bg-sunset-500 font-semibold text-white">
                Показать {filtered.length}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function plural(n: number, forms: [string, string, string]) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1];
  return forms[2];
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50">
      <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all ${
        checked ? 'border-sunset-500 bg-sunset-500' : 'border-slate-300 bg-white group-hover:border-slate-400'
      }`}>
        {checked && <Check size={13} strokeWidth={3} className="text-white" />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={checked ? 'font-medium text-slate-900' : ''}>{label}</span>
    </label>
  );
}
