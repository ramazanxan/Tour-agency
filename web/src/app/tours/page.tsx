import { CatalogClient } from '@/components/catalog/CatalogClient';
import { fetchTours } from '@/lib/supabase-data';
import type { TourType } from '@/lib/types';

export const revalidate = 60; // ISR: re-render at most every 60 s

export const metadata = {
  title: 'Каталог туров по Кыргызстану — Jolu',
  description:
    'Все туры по Кыргызстану: треккинг, конные, джип-туры, Иссык-Куль, Сон-Куль. Фильтры по цене, датам и сложности.',
};

export default async function ToursPage({
  searchParams,
}: {
  searchParams: { type?: string; destination?: string; q?: string };
}) {
  const tours = await fetchTours();

  return (
    <div>
      <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-white to-slate-50">
        {/* тонкая декоративная сетка-сияние */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-lake-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-sunset-200/25 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-9 pt-11">
          <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-lake-600">
            <span className="h-1 w-1 rounded-full bg-sunset-500" /> Каталог · Центральная Азия
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Найдите своё путешествие
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-500">
            Треккинг, конные и джип-туры, горные озёра и древние города — отфильтруйте по дате, цене и сложности и забронируйте онлайн.
          </p>
        </div>
      </div>
      <CatalogClient
        tours={tours}
        initial={{
          type: searchParams.type as TourType | undefined,
          destination: searchParams.destination,
          q: searchParams.q,
        }}
      />
    </div>
  );
}
