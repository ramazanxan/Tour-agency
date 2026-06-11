import Link from 'next/link';
import { Send } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/dashboard-mock';
import { formatPrice } from '@/lib/utils';
import type { BookingStatus } from '@/lib/types';

export const metadata = { title: 'Личный кабинет — Jolu' };

// Демо-брони туриста (в проде — выборка по user_id).
const myBookings: {
  id: string; tour: string; slug: string; date: string; people: string;
  total: number; status: BookingStatus;
}[] = [
  { id: 'b-2001', tour: 'Сон-Куль: 3 дня в юрте на джайлоо', slug: 'son-kul-yurts-3d', date: 'через 6 дней', people: '2 взрослых', total: 23000, status: 'confirmed' },
  { id: 'b-2002', tour: 'Каньон Сказка: тур одного дня', slug: 'skazka-day', date: 'через 2 дня', people: '4 взрослых, 2 детей', total: 13000, status: 'pending' },
  { id: 'b-2003', tour: 'Алтын-Арашан: тёплые источники', slug: 'altyn-arashan-2d', date: '2 недели назад', people: '2 взрослых', total: 9000, status: 'completed' },
];

export default function AccountPage() {
  const botUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'jolu_bot';
  const active = myBookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled');
  const past = myBookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Мои бронирования</h1>

      {/* Подключение Telegram */}
      <a
        href={`https://t.me/${botUser}?start=demo_token`}
        className="mt-4 flex items-center gap-3 rounded-2xl border border-lake-100 bg-lake-50 p-4 hover:bg-lake-100"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lake-600 text-white">
          <Send size={18} />
        </span>
        <div>
          <p className="font-semibold text-slate-800">Подключить Telegram</p>
          <p className="text-sm text-slate-500">Статусы броней и напоминания о турах — в боте</p>
        </div>
      </a>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Активные</h2>
        <div className="space-y-3">
          {active.map((b) => <BookingRow key={b.id} b={b} />)}
          {active.length === 0 && <Empty />}
        </div>
      </section>

      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Прошедшие</h2>
          <div className="space-y-3">
            {past.map((b) => <BookingRow key={b.id} b={b} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingRow({ b }: { b: { id: string; tour: string; slug: string; date: string; people: string; total: number; status: BookingStatus } }) {
  return (
    <Link href={`/tours/${b.slug}`} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 hover:shadow-sm">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status]}`}>
            {STATUS_LABELS[b.status]}
          </span>
        </div>
        <p className="font-semibold text-slate-800">{b.tour}</p>
        <p className="text-sm text-slate-500">{b.date} · {b.people}</p>
      </div>
      <span className="font-bold text-slate-900">{formatPrice(b.total)}</span>
    </Link>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
      У вас пока нет активных броней.{' '}
      <Link href="/tours" className="font-medium text-lake-600 hover:underline">Выбрать тур →</Link>
    </div>
  );
}
