import Image from 'next/image';
import Link from 'next/link';
import { Flame, MapPin } from 'lucide-react';
import { Hero } from '@/components/Hero';
import { TourCard } from '@/components/TourCard';
import { tours, destinations, nextDeparture } from '@/lib/mock-data';

// «Сезон сейчас» — подборка по текущему месяцу (ТЗ 2.1.1)
function seasonalDestinations() {
  const month = new Date().getMonth() + 1;
  return destinations.filter((d) => month >= d.seasonFrom && month <= d.seasonTo).slice(0, 4);
}

// «Горящие туры» — ближайший выезд со свободными местами
function hotTours() {
  return [...tours]
    .filter((t) => {
      const d = nextDeparture(t);
      return d && d.seatsTaken < d.seatsTotal;
    })
    .sort((a, b) => {
      const da = nextDeparture(a)!.dateStart;
      const db = nextDeparture(b)!.dateStart;
      return +new Date(da) - +new Date(db);
    })
    .slice(0, 3);
}

export default function HomePage() {
  const season = seasonalDestinations();
  const hot = hotTours();
  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date());

  return (
    <>
      <Hero />

      {/* Сезон сейчас */}
      <section id="season" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Сезон сейчас</h2>
            <p className="text-sm text-slate-500">
              Лучшие направления для поездки в {monthName}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {season.map((d) => (
            <Link
              key={d.id}
              href={`/tours?destination=${d.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl"
            >
              <Image
                src={d.coverUrl}
                alt={d.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 p-4 text-white">
                <h3 className="font-bold">{d.name}</h3>
                <p className="text-xs text-white/80">{d.toursCount} туров</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Горящие туры */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex items-center gap-2">
            <Flame className="text-sunset-500" />
            <h2 className="text-2xl font-extrabold text-slate-900">Горящие туры</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hot.map((t) => (
              <TourCard key={t.id} tour={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Популярные направления */}
      <section id="destinations" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center gap-2">
          <MapPin className="text-lake-600" />
          <h2 className="text-2xl font-extrabold text-slate-900">Популярные направления</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {destinations.map((d) => (
            <Link
              key={d.id}
              href={`/tours?destination=${d.slug}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm hover:shadow-md"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-full">
                <Image src={d.coverUrl} alt={d.name} fill sizes="64px" className="object-cover" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-lake-700">{d.name}</span>
              <span className="text-xs text-slate-400">{d.toursCount} туров</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA компаниям */}
      <section className="bg-lake-700 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
          <h2 className="text-2xl font-extrabold">Вы — туркомпания?</h2>
          <p className="max-w-xl text-white/85">
            Разместите туры бесплатно, получайте заявки и управляйте ими в одном кабинете.
          </p>
          <Link
            href="/for-companies"
            className="rounded-xl bg-sunset-500 px-6 py-3 font-semibold text-white hover:bg-sunset-600"
          >
            Разместить туры
          </Link>
        </div>
      </section>
    </>
  );
}
