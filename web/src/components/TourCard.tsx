import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Clock, Users, ArrowUpRight } from 'lucide-react';
import type { Tour } from '@/lib/types';
import { TOUR_TYPE_LABELS } from '@/lib/types';
import { getDestination, getCompany, nextDeparture } from '@/lib/mock-data';
import { formatPrice, formatDateShort } from '@/lib/utils';

// Чистая подпись типа без эмодзи (эмодзи выглядят шаблонно и непредсказуемо рендерятся)
const cleanType = (t: Tour['type']) => TOUR_TYPE_LABELS[t].replace(/^\S+\s/, '');

export function TourCard({ tour }: { tour: Tour }) {
  const dest = getDestination(tour.destinationId);
  const company = getCompany(tour.companyId);
  const dep = nextDeparture(tour);
  const seatsLeft = dep ? dep.seatsTotal - dep.seatsTaken : 0;
  const urgent = dep && seatsLeft <= 3 && seatsLeft > 0;
  const guaranteed = dep?.status === 'confirmed';

  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70 shadow-[0_12px_40px_-18px_rgba(15,42,64,0.28)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-24px_rgba(15,42,64,0.38)] hover:ring-slate-300/80"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={tour.gallery[0].url}
          alt={tour.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
        />
        {/* кинематографический скрим снизу */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent" />

        {/* тип тура — стеклянный чип */}
        <span className="absolute left-3.5 top-3.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/25 backdrop-blur-md">
          {cleanType(tour.type)}
        </span>

        {/* рейтинг */}
        <span className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-md">
          <Star size={12} className="fill-amber-300 text-amber-300" /> {tour.rating}
        </span>

        {/* статус выезда */}
        {(urgent || guaranteed) && (
          <span
            className={`absolute left-3.5 top-12 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-md ${
              urgent ? 'bg-sunset-500/90 text-white' : 'bg-emerald-500/90 text-white'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            {urgent ? `Осталось ${seatsLeft} мест` : 'Гарантированный выезд'}
          </span>
        )}

        {/* направление поверх изображения */}
        <div className="absolute inset-x-3.5 bottom-3.5 flex items-center gap-1.5 text-white">
          <MapPin size={14} className="shrink-0 opacity-90" />
          <span className="truncate text-sm font-medium drop-shadow">{dest?.name}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[17px] font-bold leading-snug tracking-tight text-slate-900 line-clamp-2 transition-colors group-hover:text-lake-700">
          {tour.title}
        </h3>

        <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock size={13} /> {tour.durationDays} дн.</span>
          <span className="flex items-center gap-1"><Star size={13} className="text-slate-400" /> {tour.reviewsCount} отзывов</span>
          {tour.smallGroup && <span className="flex items-center gap-1"><Users size={13} /> до 8</span>}
        </div>

        {company?.isVerified && (
          <p className="mt-2 text-xs text-slate-400">
            {company.name} <span className="font-semibold text-lake-600">✓ проверено</span>
          </p>
        )}

        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <span className="text-[11px] uppercase tracking-wide text-slate-400">от</span>
            <p className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
              {formatPrice(tour.price, tour.currency)}
            </p>
            {dep && (
              <span className="text-[11px] text-slate-400">ближайший выезд {formatDateShort(dep.dateStart)}</span>
            )}
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-all duration-300 group-hover:bg-sunset-500 group-hover:scale-105">
            <ArrowUpRight size={18} className="transition-transform duration-300 group-hover:rotate-45" />
          </span>
        </div>
      </div>
    </Link>
  );
}
