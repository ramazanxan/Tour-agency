'use client';

import { useMemo, useState } from 'react';
import { Phone, Users, Check, X, Eye, EyeOff } from 'lucide-react';
import type { Tour, BookingStatus } from '@/lib/types';
import {
  companyBookings as seedBookings,
  STATUS_LABELS,
  STATUS_COLORS,
  type BookingRow,
} from '@/lib/dashboard-mock';
import { formatPrice, formatDateRange } from '@/lib/utils';

type Tab = 'requests' | 'tours' | 'departures';

export function DashboardClient({ tours }: { tours: Tour[] }) {
  const [tab, setTab] = useState<Tab>('requests');
  const [bookings, setBookings] = useState<BookingRow[]>(seedBookings);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');

  const stats = useMemo(() => {
    const newCount = bookings.filter((b) => b.status === 'pending').length;
    const peopleSoon = bookings
      .filter((b) => b.status === 'confirmed' || b.status === 'prepaid')
      .reduce((s, b) => s + b.adults + b.children, 0);
    const gmv = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((s, b) => s + b.totalPrice, 0);
    return { newCount, peopleSoon, gmv };
  }, [bookings]);

  function setStatus(id: string, status: BookingStatus) {
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  const filtered = statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Кабинет компании</h1>
          <p className="text-sm text-slate-500">Jol Travel · бесплатный тариф (до 3 туров)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Новые заявки" value={stats.newCount} accent="text-sunset-600" />
        <Stat label="Человек к выезду" value={stats.peopleSoon} accent="text-lake-600" />
        <Stat label="Активных туров" value={tours.length} accent="text-slate-800" />
        <Stat label="Сумма заявок" value={formatPrice(stats.gmv)} accent="text-emerald-600" small />
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-slate-100">
        {([
          ['requests', 'Заявки'],
          ['tours', 'Туры'],
          ['departures', 'Выезды'],
        ] as [Tab, string][]).map(([t, l]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t ? 'border-lake-600 text-lake-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {(['all', 'pending', 'confirmed', 'prepaid', 'completed', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  statusFilter === s ? 'bg-lake-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'Все' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filtered.map((b) => (
              <RequestCard key={b.id} booking={b} onStatus={setStatus} />
            ))}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-slate-400">Заявок с этим статусом нет.</p>
            )}
          </div>
        </>
      )}

      {tab === 'tours' && (
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Тур</th>
                <th className="px-4 py-3 font-medium">Цена</th>
                <th className="px-4 py-3 font-medium">Выездов</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{t.title}</td>
                  <td className="px-4 py-3 text-slate-600">{formatPrice(t.price, t.currency)}</td>
                  <td className="px-4 py-3 text-slate-600">{t.departures.length}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      Опубликован
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'departures' && (
        <div className="space-y-3">
          {tours.flatMap((t) =>
            t.departures.map((d) => {
              const pct = Math.round((d.seatsTaken / d.seatsTotal) * 100);
              let color = 'bg-emerald-500', emoji = '🟢';
              if (d.seatsTaken >= d.seatsTotal) { color = 'bg-rose-500'; emoji = '🔴'; }
              else if (pct >= 80) { color = 'bg-amber-500'; emoji = '🟡'; }
              else if (d.seatsTaken < d.minGroupSize) { color = 'bg-slate-400'; emoji = '⚪'; }
              return (
                <div key={d.id} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4">
                  <span className="text-lg">{emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{t.title}</p>
                    <p className="text-sm text-slate-500">{formatDateRange(d.dateStart, d.dateEnd)}</p>
                  </div>
                  <div className="w-40">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>{d.seatsTaken}/{d.seatsTotal}</span>
                      <span>мин. {d.minGroupSize}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent, small }: { label: string; value: string | number; accent: string; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-extrabold ${accent} ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}

function RequestCard({ booking: b, onStatus }: { booking: BookingRow; onStatus: (id: string, s: BookingStatus) => void }) {
  // Телефон туриста открывается только после подтверждения (ТЗ 5.4)
  const phoneVisible = b.status !== 'pending' && b.status !== 'cancelled';
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status]}`}>
              {STATUS_LABELS[b.status]}
            </span>
            <span className="text-xs text-slate-400">#{b.id}</span>
          </div>
          <p className="font-semibold text-slate-800">{b.tourTitle}</p>
          <p className="text-sm text-slate-500">Выезд: {b.departureLabel}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="font-medium">{b.contactName}</span>
            <span className="flex items-center gap-1">
              <Phone size={14} />
              {phoneVisible ? (
                revealed ? b.contactPhone : (
                  <button onClick={() => setRevealed(true)} className="inline-flex items-center gap-1 text-lake-600 hover:underline">
                    <Eye size={13} /> показать
                  </button>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <EyeOff size={13} /> после подтверждения
                </span>
              )}
            </span>
            <span className="flex items-center gap-1"><Users size={14} /> {b.adults} взр.{b.children ? `, ${b.children} дет.` : ''}</span>
            <span className="font-semibold text-slate-800">{formatPrice(b.totalPrice)}</span>
          </div>

          {b.note && (
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">💬 {b.note}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {b.status === 'pending' && (
            <>
              <button onClick={() => onStatus(b.id, 'confirmed')}
                className="flex items-center gap-1.5 rounded-lg bg-lake-600 px-3 py-2 text-sm font-semibold text-white hover:bg-lake-700">
                <Check size={15} /> Подтвердить
              </button>
              <button onClick={() => onStatus(b.id, 'cancelled')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50">
                <X size={15} /> Отклонить
              </button>
            </>
          )}
          {b.status === 'confirmed' && (
            <button onClick={() => onStatus(b.id, 'prepaid')}
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700">
              Отметить предоплату
            </button>
          )}
          {b.status === 'prepaid' && (
            <button onClick={() => onStatus(b.id, 'completed')}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Завершить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
