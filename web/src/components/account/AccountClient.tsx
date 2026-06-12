'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Send, LogOut, Ticket, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/dashboard-mock';
import {
  ensureThread, sendMessage, getThreadsForTourist, unreadFor,
} from '@/lib/chatStore';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { formatPrice } from '@/lib/utils';
import type { BookingStatus } from '@/lib/types';

type Tab = 'bookings' | 'messages';

const demo: { id: string; tour: string; slug: string; date: string; people: string; total: number; status: BookingStatus }[] = [
  { id: 'b-2001', tour: 'Сон-Куль: 3 дня в юрте на джайлоо', slug: 'son-kul-yurts-3d', date: 'через 6 дней', people: '2 взрослых', total: 23000, status: 'confirmed' },
  { id: 'b-2002', tour: 'Каньон Сказка: тур одного дня', slug: 'skazka-day', date: 'через 2 дня', people: '4 взрослых, 2 детей', total: 13000, status: 'pending' },
  { id: 'b-2003', tour: 'Алтын-Арашан: тёплые источники', slug: 'altyn-arashan-2d', date: '2 недели назад', people: '2 взрослых', total: 9000, status: 'completed' },
];

export function AccountClient() {
  const { account, logout } = useAuth();
  const botUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'jolu_bot';
  const login = account?.login ?? 'guest';
  const name = account?.name ?? 'Гость';
  const [tab, setTab] = useState<Tab>('bookings');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const t = ensureThread({ companyId: 'demo', companyName: 'Jol Travel', touristLogin: login, touristName: name, tourTitle: 'Сон-Куль: 3 дня в юрте' });
    if (t.messages.length === 0) sendMessage(t.id, 'company', 'Здравствуйте! Спасибо за интерес к туру. Подскажу по датам и питанию — спрашивайте 🙌');
    const sync = () => setUnread(unreadFor(getThreadsForTourist(login), 'tourist'));
    sync();
    window.addEventListener('jolu-chat', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('jolu-chat', sync); window.removeEventListener('storage', sync); };
  }, [login, name]);

  const active = demo.filter((b) => b.status !== 'completed' && b.status !== 'cancelled');
  const past = demo.filter((b) => b.status === 'completed' || b.status === 'cancelled');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/60">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-lake-600">
              <span className="h-1 w-1 rounded-full bg-sunset-500" /> Личный кабинет
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">Привет, {name}</h1>
            <p className="text-sm text-slate-500">Логин: {login}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
            <LogOut size={15} /> Выйти
          </button>
        </div>

        <a href={`https://t.me/${botUser}?start=demo_token`} className="group mt-5 flex items-center gap-3 overflow-hidden rounded-2xl border border-lake-100 bg-gradient-to-r from-lake-50 to-white p-4 transition hover:border-lake-200">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-lake-500 to-lake-700 text-white shadow-md"><Send size={18} /></span>
          <div className="flex-1">
            <p className="font-semibold text-slate-800">Подключить Telegram</p>
            <p className="text-sm text-slate-500">Статусы броней и напоминания о турах — прямо в боте</p>
          </div>
          <ArrowRight size={18} className="text-lake-400 transition-transform group-hover:translate-x-1" />
        </a>

        {/* Табы */}
        <div className="mt-6 flex gap-1.5 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-sm">
          {([['bookings', 'Мои брони', Ticket], ['messages', 'Сообщения', MessageSquare]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                tab === id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}>
              <Icon size={16} className={tab === id ? 'text-sunset-300' : 'text-slate-400'} /> {label}
              {id === 'messages' && unread > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sunset-500 px-1.5 text-[11px] font-bold text-white">{unread}</span>}
            </button>
          ))}
        </div>

        {tab === 'bookings' ? (
          <div className="mt-6">
            <section>
              <h2 className="mb-3 font-display text-lg font-bold text-slate-900">Активные бронирования</h2>
              <div className="space-y-3">
                {active.map((b) => <Row key={b.id} b={b} />)}
                {active.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                    Нет активных броней. <Link href="/tours" className="font-medium text-lake-600 hover:underline">Выбрать тур →</Link>
                  </div>
                )}
              </div>
            </section>

            {past.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 font-display text-lg font-bold text-slate-900">История</h2>
                <div className="space-y-3">{past.map((b) => <Row key={b.id} b={b} />)}</div>
              </section>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <ChatPanel viewer="tourist" load={() => getThreadsForTourist(login)} />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ b }: { b: { id: string; tour: string; slug: string; date: string; people: string; total: number; status: BookingStatus } }) {
  return (
    <Link href={`/tours/${b.slug}`} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <span className={`mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status]}`}>{STATUS_LABELS[b.status]}</span>
        <p className="font-display font-bold text-slate-900">{b.tour}</p>
        <p className="text-sm text-slate-500">{b.date} · {b.people}</p>
      </div>
      <span className="font-display text-lg font-extrabold text-slate-900">{formatPrice(b.total)}</span>
    </Link>
  );
}
