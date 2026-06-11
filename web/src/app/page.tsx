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
      <section className="bg-lake-700 py-16 text-white">
        <Reveal className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Вы — туркомпания?</h2>
          <p className="max-w-xl text-white/85">
            Разместите туры бесплатно, получайте заявки и управляйте ими в одном кабинете.
          </p>
          <Link href="/for-companies" className="rounded-xl bg-sunset-500 px-6 py-3 font-semibold text-white hover:bg-sunset-600">
            Разместить туры
          </Link>
        </Reveal>
      </section>
    </>
  );
}
