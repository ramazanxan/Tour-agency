'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Calendar, Check, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import type { Tour } from '@/lib/types';
import { formatPrice, formatDateRange } from '@/lib/utils';
import { GroupProgress } from '@/components/ui/GroupProgress';

export function BookingSidebar({ tour }: { tour: Tour }) {
  const router = useRouter();
  const future = tour.departures
    .filter((d) => new Date(d.dateStart).getTime() >= Date.now() && d.status !== 'cancelled')
    .sort((a, b) => +new Date(a.dateStart) - +new Date(b.dateStart));

  const [selected, setSelected] = useState(future[0]?.id ?? '');
  const dep = future.find((d) => d.id === selected);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_18px_50px_-24px_rgba(15,42,64,0.32)]">
      {/* Цена */}
      <div className="border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/80 px-6 pb-5 pt-6">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-slate-400">от</span>
          <span className="font-display text-[2rem] font-extrabold tracking-tight text-slate-900">
            {formatPrice(tour.price, tour.currency)}
          </span>
          <span className="text-sm text-slate-400">/ чел.</span>
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Calendar size={16} className="text-sunset-500" /> Дата выезда
        </p>
        <div className="space-y-2">
          {future.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
              Ближайшие даты уточняются. Оставьте заявку — компания свяжется с вами.
            </p>
          )}
          {future.map((d) => {
            const left = d.seatsTotal - d.seatsTaken;
            const active = d.id === selected;
            const sold = left <= 0;
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                disabled={sold}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                  active
                    ? 'border-slate-900 bg-slate-900/[0.03] ring-1 ring-slate-900/10'
                    : 'border-slate-200 hover:border-slate-300'
                } ${sold ? 'cursor-not-allowed opacity-45' : ''}`}
              >
                <span className="font-semibold text-slate-800">
                  {formatDateRange(d.dateStart, d.dateEnd)}
                </span>
                <span className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${left <= 3 && !sold ? 'text-sunset-600' : 'text-slate-400'}`}>
                    {sold ? 'мест нет' : `${left} мест`}
                  </span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full transition ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-transparent'}`}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {dep && (
          <div className="mt-4">
            <GroupProgress taken={dep.seatsTaken} total={dep.seatsTotal} min={dep.minGroupSize} />
          </div>
        )}

        <button
          disabled={!dep}
          onClick={() => router.push(`/booking/${tour.slug}?dep=${selected}`)}
          className="group mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sunset-500 to-sunset-600 py-4 font-semibold text-white shadow-lg shadow-sunset-500/25 transition-all hover:shadow-xl hover:shadow-sunset-500/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Забронировать
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </button>

        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-emerald-500" /> Бронь без предоплаты
          </p>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={14} className="text-lake-500" /> Подтверждение в течение 24 часов
          </p>
        </div>
      </div>
    </div>
  );
}
