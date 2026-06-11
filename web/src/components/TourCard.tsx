import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Clock, Users } from 'lucide-react';
import type { Tour } from '@/lib/types';
import { TOUR_TYPE_LABELS } from '@/lib/types';
import { getDestination, getCompany, nextDeparture } from '@/lib/mock-data';
import { formatPrice, formatDateShort } from '@/lib/utils';
import { Badge } from './ui/Badge';

export function TourCard({ tour }: { tour: Tour }) {
  const dest = getDestination(tour.destinationId);
  const company = getCompany(tour.companyId);
  const dep = nextDeparture(tour);
  const seatsLeft = dep ? dep.seatsTotal - dep.seatsTaken : 0;

  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={tour.gallery[0].url}
          alt={tour.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant="lake" className="bg-white/90 backdrop-blur">
            {TOUR_TYPE_LABELS[tour.type]}
          </Badge>
        </div>
        {dep && (
          <div className="absolute bottom-3 left-3">
            {seatsLeft <= 3 && seatsLeft > 0 ? (
              <Badge variant="danger" className="bg-white/90 backdrop-blur">
                🔥 Осталось {seatsLeft} мест
              </Badge>
            ) : dep.status === 'confirmed' ? (
              <Badge variant="success" className="bg-white/90 backdrop-blur">
                ✅ Гарантированный выезд
              </Badge>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={13} /> {dest?.name}
          {company?.isVerified && <span className="text-lake-600">· {company.name} ✓</span>}
        </div>

        <h3 className="mb-2 line-clamp-2 font-semibold text-slate-800 group-hover:text-lake-700">
          {tour.title}
        </h3>

        <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock size={13} /> {tour.durationDays} дн.</span>
          <span className="flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" /> {tour.rating} ({tour.reviewsCount})</span>
          {tour.smallGroup && <span className="flex items-center gap-1"><Users size={13} /> до 8</span>}
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="text-xs text-slate-400">от</span>
            <p className="text-lg font-extrabold text-slate-900">{formatPrice(tour.price, tour.currency)}</p>
          </div>
          {dep && (
            <span className="rounded-lg bg-lake-50 px-2 py-1 text-xs font-medium text-lake-700">
              ближ. {formatDateShort(dep.dateStart)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
