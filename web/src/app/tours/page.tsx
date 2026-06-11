import { CatalogClient } from '@/components/catalog/CatalogClient';
import { tours } from '@/lib/mock-data';
import type { TourType } from '@/lib/types';

export const metadata = {
  title: 'Каталог туров по Кыргызстану — Jolu',
  description: 'Все туры по Кыргызстану: треккинг, конные, джип-туры, Иссык-Куль, Сон-Куль. Фильтры по цене, датам и сложности.',
};

export default function ToursPage({
  searchParams,
}: {
  searchParams: { type?: string; destination?: string; q?: string };
}) {
  return (
    <div>
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Каталог туров</h1>
          <p className="text-sm text-slate-500">Выберите тур по Кыргызстану и забронируйте онлайн</p>
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
