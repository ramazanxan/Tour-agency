'use client';

import { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { Difficulty, GuideLang, Tour, TourType } from '@/lib/types';
import { DIFFICULTY_LABELS, TOUR_TYPE_LABELS } from '@/lib/types';
import { destinations, nextDeparture } from '@/lib/mock-data';
import { TourCard } from '@/components/TourCard';
import { formatPrice } from '@/lib/utils';

type Sort = 'popular' | 'price_asc' | 'price_desc' | 'soonest' | 'rating';

interface Filters {
  types: TourType[];
  destinations: string[]; // slugs
  difficulties: Difficulty[];
  langs: GuideLang[];
  durations: string[]; // '1' | 'weekend' | '3-7' | '7+'
  maxPrice: number;
  kidsFriendly: boolean;
  allInclusive: boolean;
  smallGroup: boolean;
}

const EMPTY: Filters = {
  types: [],
  destinations: [],
  difficulties: [],
  langs: [],
  durations: [],
  maxPrice: 40000,
  kidsFriendly: false,
  allInclusive: false,
  smallGroup: false,
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
    (filters.maxPrice < 40000 ? 1 : 0);

  const FilterPanel = (
    <div className="space-y-6">
      <FilterGroup title="Тип тура">
        {(Object.keys(TOUR_TYPE_LABELS) as TourType[]).map((t) => (
          <CheckRow key={t} label={TOUR_TYPE_LABELS[t]} checked={filters.types.includes(t)}
            onChange={() => setFilters((f) => ({ ...f, types: toggle(f.types, t) }))} />
        ))}
      </FilterGroup>

      <FilterGroup title="Направление">
        {destinations.map((d) => (
          <CheckRow key={d.id} label={d.name} checked={filters.destinations.includes(d.slug)}
            onChange={() => setFilters((f) => ({ ...f, destinations: toggle(f.destinations, d.slug) }))} />
        ))}
      </FilterGroup>

      <FilterGroup title="Длительность">
        {[['1', '1 день'], ['weekend', 'Выходные'], ['3-7', '3–7 дней'], ['7+', '7+ дней']].map(([v, l]) => (
          <CheckRow key={v} label={l} checked={filters.durations.includes(v)}
            onChange={() => setFilters((f) => ({ ...f, durations: toggle(f.durations, v) }))} />
        ))}
      </FilterGroup>

      <FilterGroup title={`Цена до ${formatPrice(filters.maxPrice)}`}>
        <input type="range" min={2000} max={40000} step={500} value={filters.maxPrice}
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

      {activeCount > 0 && (
        <button onClick={() => { setFilters(EMPTY); setQ(''); }}
          className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700">
          <X size={14} /> Сбросить фильтры
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск туров…"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-lake-400" />
      </div>

      <div className="flex gap-8">
        {/* Desktop filters */}
        <aside className="sticky top-20 hidden h-fit w-64 shrink-0 lg:block">{FilterPanel}</aside>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="text-sm text-slate-500">Найдено: <b className="text-slate-800">{filtered.length}</b></p>
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium lg:hidden">
                <SlidersHorizontal size={16} /> Фильтры {activeCount > 0 && `(${activeCount})`}
              </button>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none">
                <option value="popular">Популярные</option>
                <option value="price_asc">Цена ↑</option>
                <option value="price_desc">Цена ↓</option>
                <option value="soonest">Ближайший выезд</option>
                <option value="rating">Рейтинг</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center text-slate-500">
              По вашим фильтрам туров не найдено. Попробуйте сбросить часть фильтров.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t) => <TourCard key={t.id} tour={t} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Фильтры</h3>
              <button onClick={() => setMobileOpen(false)}><X /></button>
            </div>
            {FilterPanel}
            <button onClick={() => setMobileOpen(false)}
              className="mt-6 h-12 w-full rounded-xl bg-sunset-500 font-semibold text-white">
              Показать {filtered.length} туров
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-slate-800">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
      <input type="checkbox" checked={checked} onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 accent-lake-600" />
      {label}
    </label>
  );
}
