import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, X, MapPin, Star, Clock, Mountain, Languages, ShieldCheck, Backpack } from 'lucide-react';
import { tours, getTourBySlug, getCompany, getDestination, getSimilarTours } from '@/lib/mock-data';
import { DIFFICULTY_LABELS, TOUR_TYPE_LABELS } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { BookingSidebar } from '@/components/tour/BookingSidebar';
import { ProgramAccordion } from '@/components/tour/ProgramAccordion';
import { MeetingMap } from '@/components/tour/MeetingMap';
import { TourCard } from '@/components/TourCard';

export function generateStaticParams() {
  return tours.map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const tour = getTourBySlug(params.slug);
  if (!tour) return { title: 'Тур не найден — Jolu' };
  const dest = getDestination(tour.destinationId);
  return {
    title: `${tour.title} — ${dest?.name} | Jolu`,
    description: `${tour.title}. ${tour.durationDays} дн., от ${tour.price} ${tour.currency}. ${tour.included.slice(0, 3).join(', ')}.`,
  };
}

export default function TourPage({ params }: { params: { slug: string } }) {
  const tour = getTourBySlug(params.slug);
  if (!tour) notFound();

  const company = getCompany(tour.companyId);
  const dest = getDestination(tour.destinationId);
  const similar = getSimilarTours(tour);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-lake-600">Главная</Link> ·{' '}
        <Link href="/tours" className="hover:text-lake-600">Каталог</Link> ·{' '}
        <span className="text-slate-600">{tour.title}</span>
      </nav>

      {/* Gallery */}
      <div className="mb-6 grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2 sm:aspect-auto">
          <Image src={tour.gallery[0].url} alt={tour.title} fill sizes="(max-width:768px)100vw,50vw" className="object-cover" priority />
        </div>
        {tour.gallery.slice(1, 5).map((m, i) => (
          <div key={i} className="relative hidden aspect-[4/3] overflow-hidden rounded-xl sm:block">
            <Image src={m.url} alt={`${tour.title} ${i + 2}`} fill sizes="25vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main content */}
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="lake">{TOUR_TYPE_LABELS[tour.type]}</Badge>
            <Badge variant="outline"><Mountain size={12} /> {DIFFICULTY_LABELS[tour.difficulty]}</Badge>
            <Badge variant="outline"><Clock size={12} /> {tour.durationDays} дн.</Badge>
            {tour.allInclusive && <Badge variant="success">Всё включено</Badge>}
            {tour.kidsFriendly && <Badge>Можно с детьми</Badge>}
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{tour.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><MapPin size={15} /> {dest?.name}, {dest?.region}</span>
            <span className="flex items-center gap-1"><Star size={15} className="fill-amber-400 text-amber-400" /> {tour.rating} · {tour.reviewsCount} отзывов</span>
            <span className="flex items-center gap-1"><Languages size={15} /> {tour.guideLangs.join(' / ')}</span>
          </div>

          {/* Программа по дням */}
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold text-slate-900">Программа тура</h2>
            <ProgramAccordion program={tour.program} />
          </section>

          {/* Что включено / не включено */}
          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-900">Что включено</h3>
              <ul className="space-y-2">
                {tour.included.map((x) => (
                  <li key={x} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check size={18} className="mt-0.5 shrink-0 text-emerald-500" /> {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-900">Не включено</h3>
              <ul className="space-y-2">
                {tour.excluded.map((x) => (
                  <li key={x} className="flex items-start gap-2 text-sm text-slate-700">
                    <X size={18} className="mt-0.5 shrink-0 text-rose-400" /> {x}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Что взять с собой */}
          <section className="mt-8">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
              <Backpack size={20} className="text-lake-600" /> Что взять с собой
            </h3>
            <div className="flex flex-wrap gap-2">
              {tour.packingList.map((x) => (
                <span key={x} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700">{x}</span>
              ))}
            </div>
          </section>

          {/* Точка сбора */}
          <section className="mt-8">
            <h3 className="mb-3 text-lg font-bold text-slate-900">Точка сбора</h3>
            <p className="mb-3 flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin size={16} className="text-sunset-500" /> {tour.meetingPoint}
            </p>
            <MeetingMap lat={tour.meetingLat} lng={tour.meetingLng} label={tour.meetingPoint} />
          </section>

          {/* Карточка компании */}
          {company && (
            <section className="mt-8">
              <h3 className="mb-3 text-lg font-bold text-slate-900">Организатор</h3>
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <Image src={company.logoUrl} alt={company.name} fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">{company.name}</h4>
                    {company.isVerified && (
                      <Badge variant="lake"><ShieldCheck size={12} /> Верифицирована</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    ⭐ {company.rating} · {company.toursDone} проведённых туров
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{company.description}</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sticky sidebar */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <BookingSidebar tour={tour} />
        </aside>
      </div>

      {/* Похожие туры */}
      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold text-slate-900">Похожие туры</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((t) => <TourCard key={t.id} tour={t} />)}
          </div>
        </section>
      )}
    </div>
  );
}
