'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Calendar, Check } from 'lucide-react';
import type { Tour } from '@/lib/types';
import { formatPrice, formatDateRange } from '@/lib/utils';
import { GroupProgress } from '@/components/ui/GroupProgress';
import { Button } from '@/components/ui/Button';

export function BookingSidebar({ tour }: { tour: Tour }) {
  const router = useRouter();
  const future = tour.departures
    .filter((d) => new Date(d.dateStart).getTime() >= Date.now() && d.status !== 'cancelled')
    .sort((a, b) => +new Date(a.dateStart) - +new Date(b.dateStart));

  const [selected, setSelected] = useState(future[0]?.id ?? '');
  const dep = future.find((d) => d.id === selected);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-sm text-slate-400">от</span>
        <span className="text-2xl font-extrabold text-slate-900">
          {formatPrice(tour.price, tour.currency)}
        </span>
        <span className="text-sm text-slate-400">/ чел.</span>
      </div>

      <div className="mb-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Calendar size={16} /> Выберите дату выезда
        </p>
        <div className="space-y-2">
          {future.length === 0 && (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
              Ближайшие даты уточняются. Оставьте заявку — компания свяжется с вами.
            </p>
          )}
          {future.map((d) => {
            const left = d.seatsTotal - d.seatsTaken;
            const active = d.id === selected;
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                disabled={left <= 0}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                  active ? 'border-lake-500 bg-lake-50' : 'border-slate-200 hover:border-lake-300'
                } ${left <= 0 ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="font-medium text-slate-800">
                  {formatDateRange(d.dateStart, d.dateEnd)}
                </span>
                <span className={left <= 3 ? 'text-rose-600' : 'text-slate-500'}>
                  {left <= 0 ? 'мест нет' : `${left} мест`}
                </span>
                {active && <Check size={16} className="text-lake-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {dep && (
        <div className="mb-4">
          <GroupProgress taken={dep.seatsTaken} total={dep.seatsTotal} min={dep.minGroupSize} />
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!dep}
        onClick={() => router.push(`/booking/${tour.slug}?dep=${selected}`)}
      >
        Забронировать
      </Button>

      <p className="mt-3 text-center text-xs text-slate-400">
        Бронь без предоплаты. Подтверждение в течение 24 часов.
      </p>
    </div>
  );
}
