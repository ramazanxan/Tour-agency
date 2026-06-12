import Image from 'next/image';
import Link from 'next/link';
import { Flame, MapPin } from 'lucide-react';
import { GlobeExperience } from '@/components/globe/GlobeExperience';
import { ParallaxBand } from '@/components/motion/ParallaxBand';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { TourCard } from '@/components/TourCard';
import { tours, destinations, nextDeparture } from '@/lib/mock-data';

function seasonalDestinations() {
  const month = new Date().getMonth() + 1;
  return destinations.filter((d) => month >= d.seasonFrom && month <= d.seasonTo).slice(0, 4);
}

function hotTours() {
  return [...tours]
    .filter((t) => {
      const d = nextDeparture(t);
      return d && d.seatsTaken < d.seatsTotal;
    })
    .sort((a, b) => +new Date(nextDeparture(a)!.dateStart) - +new Date(nextDeparture(b)!.dateStart))
    .slice(0, 3);
}

export default function HomePage() {
  const season = seasonalDestinations();
  const hot = hotTours();
  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date());

  return (
    <>
      {/* 3D-глобус — иммерсивный вход */}
      <GlobeExperience />

      {/* Сезон сейчас */}
      <section id="season" className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Сезон сейчас</h2>
            <p className="text-sm text-slate-500">Лучшие направления для поездки в {monthName}</p>
          </div>
        </Reveal>
        <RevealGroup className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {season.map((d) => (
            <RevealItem key={d.id}>
              <Link href={`/tours?destination=${d.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl">
                <Image src={d.coverUrl} alt={d.name} fill sizes="(max-width:768px)50vw,25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 p-4 text-white">
                  <h3 className="font-bold">{d.name}</h3>
                  <p className="text-xs text-white/80">{d.toursCount} туров</p>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Параллакс-полоса */}
      <ParallaxBand />

      {/* Горящие туры */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <div className="mb-6 flex items-center gap-2">
              <Flame className="text-sunset-500" />
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Горящие туры</h2>
            </div>
          </Reveal>
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hot.map((t) => (
              <RevealItem key={t.id}><TourCard tour={t} /></RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Популярные направления */}
      <section id="destinations" className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <div className="mb-6 flex items-center gap-2">
            <MapPin className="text-lake-600" />
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Популярные направления</h2>
          </div>
        </Reveal>
        <RevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {destinations.map((d) => (
            <RevealItem key={d.id}>
              <Link href={`/tours?destination=${d.slug}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm hover:shadow-md">
                <div className="relative h-16 w-16 overflow-hidden rounded-full">
                  <Image src={d.coverUrl} alt={d.name} fill sizes="64px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-lake-700">{d.name}</span>
                <span className="text-xs text-slate-400">{d.toursCount} туров</span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* CTA компаниям */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-center sm:px-12">
            {/* сияние */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-lake-500/20 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-sunset-500/20 blur-[90px]" />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-sunset-200">
                <span className="h-1 w-1 rounded-full bg-sunset-400" /> Для туркомпаний
              </span>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.05]">
                Разместите туры и получайте заявки
              </h2>
              <p className="max-w-xl text-white/65">
                Бесплатная публикация, единый кабинет для броней и заявок, прямой контакт с туристами. Без комиссии за размещение.
              </p>
              <Link
                href="/for-companies"
                className="group mt-2 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sunset-500 to-sunset-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-sunset-500/25 transition-all hover:shadow-xl hover:shadow-sunset-500/30"
              >
                Разместить туры
                <MapPin size={17} className="transition-transform group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
