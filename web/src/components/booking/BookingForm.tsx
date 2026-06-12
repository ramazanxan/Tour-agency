'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Check, Loader2, CalendarCheck } from 'lucide-react';
import type { Tour, Departure } from '@/lib/types';
import { formatPrice, formatDateRange } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function BookingForm({ tour, departure }: { tour: Tour; departure: Departure }) {
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'form' | 'sending' | 'done' | 'error'>('form');
  const [error, setError] = useState('');

  const childPrice = tour.priceChild ?? Math.round(tour.price * 0.7);
  const total = adults * tour.price + children * childPrice;
  const seatsLeft = departure.seatsTotal - departure.seatsTaken;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourSlug: tour.slug,
          departureId: departure.id,
          adults,
          children,
          contactName: name,
          contactPhone: phone,
          note,
          totalPrice: total,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Не удалось отправить заявку');
        setStatus('error');
        return;
      }
      setStatus('done');
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check size={28} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Заявка отправлена!</h2>
        <p className="mt-2 text-slate-600">
          Компания <b>свяжется с вами в течение 24 часов</b> по указанному телефону, чтобы подтвердить бронь.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/tours"><Button variant="lake">Смотреть другие туры</Button></Link>
          <Link href="/"><Button variant="outline">На главную</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Выбранная дата */}
        <div className="flex items-center gap-3 rounded-2xl border border-lake-100 bg-lake-50 p-4">
          <CalendarCheck className="text-lake-600" />
          <div>
            <p className="font-semibold text-slate-800">{formatDateRange(departure.dateStart, departure.dateEnd)}</p>
            <p className="text-sm text-slate-500">Свободно мест: {seatsLeft}</p>
          </div>
        </div>

        {/* Количество человек */}
        <div>
          <h3 className="mb-3 font-bold text-slate-900">Количество человек</h3>
          <div className="space-y-3">
            <Counter label="Взрослые" sub={formatPrice(tour.price)} value={adults} min={1}
              max={seatsLeft} onChange={setAdults} />
            <Counter label="Дети" sub={formatPrice(childPrice)} value={children} min={0}
              max={Math.max(0, seatsLeft - adults)} onChange={setChildren} />
          </div>
        </div>

        {/* Контакты */}
        <div>
          <h3 className="mb-3 font-bold text-slate-900">Ваши контакты</h3>
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Имя"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-lake-400" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel"
              placeholder="+996 700 000 000"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-lake-400" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="Комментарий (необязательно): пожелания, вопросы…"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-lake-400" />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Регистрация не нужна — просто оставьте имя и телефон, компания свяжется с вами.
          </p>
        </div>
      </div>

      {/* Итог */}
      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-bold text-slate-900">Ваша заявка</h3>
          <p className="mb-3 text-sm text-slate-600">{tour.title}</p>
          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
            <Row label={`Взрослые × ${adults}`} value={formatPrice(adults * tour.price)} />
            {children > 0 && <Row label={`Дети × ${children}`} value={formatPrice(children * childPrice)} />}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="font-bold text-slate-900">Итого</span>
            <span className="text-xl font-extrabold text-slate-900">{formatPrice(total)}</span>
          </div>

          {status === 'error' && (
            <p className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-600">{error}</p>
          )}

          <Button type="submit" size="lg" className="mt-4 w-full" disabled={status === 'sending'}>
            {status === 'sending' ? <><Loader2 size={18} className="animate-spin" /> Отправка…</> : 'Отправить заявку'}
          </Button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Оплата — напрямую компании после подтверждения. Без онлайн-оплаты.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Counter({ label, sub, value, min, max, onChange }: {
  label: string; sub: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
      <div>
        <p className="font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 disabled:opacity-40">
          <Minus size={16} />
        </button>
        <span className="w-5 text-center font-semibold">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 disabled:opacity-40">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
