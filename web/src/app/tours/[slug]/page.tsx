import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Check,
  X,
  MapPin,
  Star,
  Clock,
  Mountain,
  Languages,
  ShieldCheck,
  Backpack,
} from 'lucide-react';
import { tours } from '@/lib/mock-data';
import { fetchTourBySlug, fetchTours } from '@/lib/supabase-data';
import { DIFFICULTY_LABELS, TOUR_TYPE_LABELS } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { BookingSidebar } from '@/components/tour/BookingSidebar';
import { ProgramAccordion } from '@/components/tour/ProgramAccordion';
import { MeetingMap } from '@/components/tour/MeetingMap';
import { TourCard } from '@/components/TourCard';

export const revalidate = 60;

/** Pre-render mock slugs at build time; DB slugs are rendered on-demand. */
export function generateStaticParams() {
  return tours.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const tour = await fetchTourBySlug(params.slug);
  if (!tour) return { title: 'Тур не найден — Jolu' };
  const dest = tour._destination;
  return {
    title: `${tour.title} — ${dest?.name ?? ''} | Jolu`,
    description: `${tour.title}. ${tour.durationDays} дн., от ${tour.price} ${tour.currency}. ${tour.included.slice(0, 3).join(', ')}.`,
  };
}

export default async function TourPage({ params }: { params: { slug: string } }) {
  const tour = await fetchTourBySlug(params.slug);
  if (!tour) notFound();

  const company = tour._company;
  const dest = tour._destination;

  // Similar tours: fetch all published, exclude self, pick same type/destination
  const allTours = await fetchTours();
  const similar = allTours
    .filter(
      (t) =>
        t.id !== tour.id &&
        (t.type === tour.type || t.destinationId === tour.destinationId)
    )
    .slice(0, 3);

  const typeLabel = TOUR_TYPE_LABELS[tour.type].replace(/^\S+\s/, '');

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/" className="transition-colors hover:text-lake-600">Главная</Link>
        <span className="text-slate-300">/</span>
        <Link href="/tours" className="transition-colors hover:text-lake-600">Каталог</Link>
        <span className="text-slate-300">/</span>
        <span className="truncate text-slate-600">{tour.title}</span>
      </nav>

      {/* Gallery — bento */}
      <div className="mb-8 grid gap-2.5 sm:grid-cols-4 sm:grid-rows-2">
        <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl sm:col-span-2 sm:row-span-2 sm:aspect-auto">
          {tour.gallery[0] && (
            <Image
              src={tour.gallery[0].url}
              alt={tour.title}
              fill
              sizes="(max-width:768px)100vw,50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        {tour.gallery.slice(1, 5).map((m, i, arr) => {
          const more = tour.gallery.length - 5;
          const isLast = i === arr.length - 1 && more > 0;
          return (
            <div
              key={i}
              className="group relative hidden aspect-[4/3] overflow-hidden rounded-2xl sm:block"
            >
              <Image
                src={m.url}
                alt={`${tour.title} ${i + 2}`}
                fill
                sizes="25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {isLast && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-lg font-semibold text-white backdrop-blur-[2px]">
                  +{more} фото
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Main content */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="lake">{typeLabel}</Badge>
            <Badge variant="outline">
              <Mountain size={12} /> {DIFFICULTY_LABELS[tour.difficulty]}
            </Badge>
            <Badge variant="outline">
              <Clock size={12} /> {tour.durationDays} дн.
            </Badge>
            {tour.allInclusive && <Badge variant="success">Всё включено</Badge>}
            {tour.kidsFriendly && <Badge>Можно с детьми</Badge>}
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[2.5rem] sm:leading-[1.1]">
            {tour.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            {dest && (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-sunset-500" /> {dest.name}, {dest.region}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Star size={15} className="fill-amber-400 text-amber-400" /> <b className="font-semibold text-slate-700">{tour.rating}</b>
              {tour.reviewsCount > 0 && <span className="text-slate-400">· {tour.reviewsCount} отзывов</span>}
            </span>
            <span className="flex items-center gap-1.5">
              <Languages size={15} /> {tour.guideLangs.join(' / ')}
            </span>
          </div>

          {/* Программа */}
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold text-slate-900">Программа по дням</h2>
            <ProgramAccordion program={tour.program} />
          </section>

          {/* Включено / не включено */}
          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-5">
              <h3 className="mb-4 font-display text-base font-bold text-slate-900">Что включено</h3>
              <ul className="space-y-2.5">
                {tour.included.map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                      <Check size={13} strokeWidth={2.5} className="text-emerald-600" />
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-white p-5">
              <h3 className="mb-4 font-display text-base font-bold text-slate-900">Не включено</h3>
              <ul className="space-y-2.5">
                {tour.excluded.map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-sm text-slate-500">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50">
                      <X size={13} strokeWidth={2.5} className="text-rose-500" />
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Что взять */}
          <section className="mt-10">
            <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-slate-900">
              <Backpack size={20} className="text-lake-600" /> Что взять с собой
            </h3>
            <div className="flex flex-wrap gap-2">
              {tour.packingList.map((x) => (
                <span
                  key={x}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-600"
                >
                  {x}
                </span>
              ))}
            </div>
          </section>

          {/* Точка сбора */}
          <section className="mt-10">
            <h3 className="mb-4 font-display text-xl font-bold text-slate-900">Точка сбора</h3>
            <p className="mb-3 flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin size={16} className="text-sunset-500" /> {tour.meetingPoint}
            </p>
            <div className="overflow-hidden rounded-3xl border border-slate-200/70">
              <MeetingMap
                lat={tour.meetingLat}
                lng={tour.meetingLng}
                label={tour.meetingPoint}
              />
            </div>
          </section>

          {/* Компания */}
          {company && (
            <section className="mt-10">
              <h3 className="mb-4 font-display text-xl font-bold text-slate-900">Организатор</h3>
              <div className="flex items-center gap-4 rounded-3xl border border-slate-200/70 bg-white p-5">
                {company.logoUrl && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-slate-100">
                    <Image
                      src={company.logoUrl}
                      alt={company.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-slate-900">{company.name}</h4>
                    {company.isVerified && (
                      <Badge variant="lake">
                        <ShieldCheck size={12} /> Верифицирована
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                    <Star size={13} className="fill-amber-400 text-amber-400" /> {company.rating}
                    {company.toursDone > 0 && <span className="text-slate-400">· {company.toursDone} проведённых туров</span>}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">
                    {company.description}
                  </p>
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
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold tracking-tight text-slate-900">Похожие туры</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((t) => (
              <TourCard key={t.id} tour={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
