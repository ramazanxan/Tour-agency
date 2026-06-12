'use client';

import { useEffect, useState } from 'react';
import {
  Phone, Users, Check, X, Eye, EyeOff, Plus, Trash2, LogOut, Calendar,
  Inbox, Map, MessageSquare, Building2, BarChart3, Instagram, Facebook,
  Youtube, Globe, Send, MessageCircle, Music2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  getTours, addTour, removeTour, setTourStatus, getProfile, saveProfile,
  EMPTY_SOCIALS, type AgencyTour, type TourTypeId, type CompanyProfile, type CompanySocials,
} from '@/lib/companyStore';
import {
  companyBookings as seedBookings, STATUS_LABELS, STATUS_COLORS, type BookingRow,
} from '@/lib/dashboard-mock';
import {
  getThreadsForCompany, seedDemoChat, unreadFor,
} from '@/lib/chatStore';
import { ChatPanel } from '@/components/chat/ChatPanel';
import type { BookingStatus } from '@/lib/types';
import { formatPrice, formatDateRange } from '@/lib/utils';

type Tab = 'requests' | 'tours' | 'departures' | 'chat' | 'profile' | 'stats';

const TYPE_LABELS: Record<TourTypeId, string> = {
  trekking: 'Треккинг', horse: 'Конный', jeep: 'Джип-тур',
  camping: 'Кемпинг', cultural: 'Культурный', gastro: 'Гастро', ski: 'Горнолыжный',
};

export function DashboardClient() {
  const { account, logout } = useAuth();
  const companyId = account?.companyId ?? 'demo';
  const companyName = account?.name ?? 'Демо-компания';
  const [tab, setTab] = useState<Tab>('requests');
  const [tours, setTours] = useState<AgencyTour[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>(seedBookings);
  const [unread, setUnread] = useState(0);

  useEffect(() => { setTours(getTours(companyId)); }, [companyId]);
  useEffect(() => {
    seedDemoChat(companyId, companyName);
    const sync = () => setUnread(unreadFor(getThreadsForCompany(companyId), 'company'));
    sync();
    window.addEventListener('jolu-chat', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('jolu-chat', sync); window.removeEventListener('storage', sync); };
  }, [companyId, companyName]);

  const refresh = () => setTours(getTours(companyId));
  const newCount = bookings.filter((b) => b.status === 'pending').length;

  const TABS: { id: Tab; label: string; Icon: typeof Inbox; badge?: number }[] = [
    { id: 'requests', label: 'Заявки', Icon: Inbox, badge: newCount },
    { id: 'tours', label: 'Туры', Icon: Map },
    { id: 'departures', label: 'Выезды', Icon: Calendar },
    { id: 'chat', label: 'Чат', Icon: MessageSquare, badge: unread },
    { id: 'profile', label: 'Профиль', Icon: Building2 },
    { id: 'stats', label: 'Статистика', Icon: BarChart3 },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Шапка */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-lake-600">
              <span className="h-1 w-1 rounded-full bg-sunset-500" /> Кабинет компании
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">{companyName}</h1>
            <p className="text-sm text-slate-500">Бесплатный тариф · без комиссии за размещение</p>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
            <LogOut size={15} /> Выйти
          </button>
        </div>

        {/* Таб-бар */}
        <div className="no-scrollbar mb-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-sm">
          {TABS.map(({ id, label, Icon, badge }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                tab === id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}>
              <Icon size={16} className={tab === id ? 'text-sunset-300' : 'text-slate-400'} />
              {label}
              {badge ? <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sunset-500 px-1.5 text-[11px] font-bold text-white">{badge}</span> : null}
            </button>
          ))}
        </div>

        {tab === 'requests' && <RequestsTab bookings={bookings} setBookings={setBookings} />}
        {tab === 'tours' && <ToursTab companyId={companyId} tours={tours} refresh={refresh} />}
        {tab === 'departures' && <DeparturesTab tours={tours} />}
        {tab === 'chat' && <ChatPanel viewer="company" load={() => getThreadsForCompany(companyId)} />}
        {tab === 'profile' && <ProfileTab companyId={companyId} fallbackName={companyName} />}
        {tab === 'stats' && <StatsTab tours={tours} bookings={bookings} />}
      </div>
    </div>
  );
}

// ── Заявки (CRM) ────────────────────────────────────────────
function RequestsTab({ bookings, setBookings }: { bookings: BookingRow[]; setBookings: (b: BookingRow[]) => void }) {
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  function setStatus(id: string, status: BookingStatus) {
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status } : b)));
  }
  const list = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'pending', 'confirmed', 'prepaid', 'completed', 'cancelled'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${filter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
            {s === 'all' ? 'Все' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {list.map((b) => <RequestCard key={b.id} booking={b} onStatus={setStatus} />)}
        {list.length === 0 && <p className="py-10 text-center text-slate-400">Заявок с этим статусом нет.</p>}
      </div>
    </>
  );
}

function RequestCard({ booking: b, onStatus }: { booking: BookingRow; onStatus: (id: string, s: BookingStatus) => void }) {
  const phoneVisible = b.status !== 'pending' && b.status !== 'cancelled';
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status]}`}>{STATUS_LABELS[b.status]}</span>
            <span className="text-xs text-slate-400">#{b.id}</span>
          </div>
          <p className="font-display font-bold text-slate-900">{b.tourTitle}</p>
          <p className="text-sm text-slate-500">Выезд: {b.departureLabel}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="font-medium">{b.contactName}</span>
            <span className="flex items-center gap-1">
              <Phone size={14} />
              {phoneVisible
                ? (revealed ? b.contactPhone : <button onClick={() => setRevealed(true)} className="inline-flex items-center gap-1 text-lake-600 hover:underline"><Eye size={13} /> показать</button>)
                : <span className="inline-flex items-center gap-1 text-slate-400"><EyeOff size={13} /> после подтверждения</span>}
            </span>
            <span className="flex items-center gap-1"><Users size={14} /> {b.adults} взр.{b.children ? `, ${b.children} дет.` : ''}</span>
            <span className="font-semibold text-slate-800">{formatPrice(b.totalPrice)}</span>
          </div>
          {b.note && <p className="mt-2 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"><MessageCircle size={15} className="mt-0.5 shrink-0 text-slate-400" /> {b.note}</p>}
        </div>
        <div className="flex flex-col gap-2">
          {b.status === 'pending' && (
            <>
              <button onClick={() => onStatus(b.id, 'confirmed')} className="flex items-center gap-1.5 rounded-xl bg-lake-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-lake-700"><Check size={15} /> Подтвердить</button>
              <button onClick={() => onStatus(b.id, 'cancelled')} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"><X size={15} /> Отклонить</button>
            </>
          )}
          {b.status === 'confirmed' && <button onClick={() => onStatus(b.id, 'prepaid')} className="rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">Отметить предоплату</button>}
          {b.status === 'prepaid' && <button onClick={() => onStatus(b.id, 'completed')} className="rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Завершить</button>}
        </div>
      </div>
    </div>
  );
}

// ── Туры + конструктор ──────────────────────────────────────
type TourDraft = Omit<AgencyTour, 'id' | 'createdAt'>;
const EMPTY_TOUR: TourDraft = {
  title: '', type: 'trekking', destination: '', durationDays: 2,
  price: 5000, currency: 'KGS', seatsTotal: 10,
  dateStart: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), description: '', status: 'published',
};

function ToursTab({ companyId, tours, refresh }: { companyId: string; tours: AgencyTour[]; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_TOUR });
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.destination.trim()) { setError('Заполните название и направление'); return; }
    addTour(companyId, { ...form, price: Number(form.price), durationDays: Number(form.durationDays), seatsTotal: Number(form.seatsTotal) });
    setForm({ ...EMPTY_TOUR });
    setError('');
    setOpen(false);
    refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Размещайте и публикуйте туры через конструктор.</p>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sunset-500 to-sunset-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sunset-500/20 transition hover:shadow-lg"><Plus size={16} /> Новый тур</button>
      </div>

      {tours.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100"><Map size={26} className="text-slate-300" /></span>
          <h3 className="font-display text-lg font-bold text-slate-800">Пока нет туров</h3>
          <p className="mt-1 text-sm text-slate-500">Нажмите «Новый тур», чтобы разместить первый.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tours.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display font-bold text-slate-900">{t.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {t.status === 'published' ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{TYPE_LABELS[t.type]} · {t.destination} · {t.durationDays} дн. · {formatPrice(t.price, t.currency)} · {t.seatsTotal} мест</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setTourStatus(companyId, t.id, t.status === 'published' ? 'draft' : 'published'); refresh(); }}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                  {t.status === 'published' ? 'В черновик' : 'Опубликовать'}
                </button>
                <button onClick={() => { if (confirm('Удалить тур?')) { removeTour(companyId, t.id); refresh(); } }}
                  className="rounded-xl border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-50"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">Конструктор тура</h3>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <In label="Название" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Сон-Куль: 3 дня в юрте" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Тип</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TourTypeId })}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-lake-400">
                    {(Object.keys(TYPE_LABELS) as TourTypeId[]).map((k) => <option key={k} value={k}>{TYPE_LABELS[k]}</option>)}
                  </select>
                </div>
                <In label="Направление" value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} placeholder="Сон-Куль" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <InNum label="Дней" value={form.durationDays} onChange={(v) => setForm({ ...form, durationDays: v })} />
                <InNum label="Цена" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Валюта</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as 'KGS' | 'USD' })}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-lake-400">
                    <option value="KGS">сом</option><option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InNum label="Мест всего" value={form.seatsTotal} onChange={(v) => setForm({ ...form, seatsTotal: v })} />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Дата выезда</label>
                  <input type="date" value={form.dateStart} onChange={(e) => setForm({ ...form, dateStart: e.target.value })}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-lake-400" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Описание</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-lake-400" placeholder="Кратко о туре, что входит…" />
              </div>
              {error && <p className="rounded-xl bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>}
              <button type="submit" className="h-12 w-full rounded-xl bg-gradient-to-r from-sunset-500 to-sunset-600 font-semibold text-white shadow-md transition hover:shadow-lg">Разместить тур</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function In({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-lake-400" />
    </div>
  );
}
function InNum({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-lake-400" />
    </div>
  );
}

// ── Выезды ──────────────────────────────────────────────────
function DeparturesTab({ tours }: { tours: AgencyTour[] }) {
  if (tours.length === 0)
    return <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-14 text-center text-slate-500">Создайте туры — их выезды появятся здесь.</div>;
  return (
    <div className="space-y-3">
      {tours.map((t) => {
        const end = new Date(new Date(t.dateStart).getTime() + (t.durationDays - 1) * 864e5).toISOString().slice(0, 10);
        return (
          <div key={t.id} className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lake-50 text-lake-600"><Calendar size={18} /></span>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{t.title}</p>
              <p className="text-sm text-slate-500">{formatDateRange(t.dateStart, end)} · {t.seatsTotal} мест</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Набор открыт</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Профиль + соцсети ───────────────────────────────────────
const SOCIAL_FIELDS: { key: keyof CompanySocials; label: string; Icon: typeof Instagram; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', Icon: Instagram, placeholder: '@company' },
  { key: 'telegram', label: 'Telegram', Icon: Send, placeholder: '@company' },
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, placeholder: '+996 700 000 000' },
  { key: 'facebook', label: 'Facebook', Icon: Facebook, placeholder: 'facebook.com/…' },
  { key: 'youtube', label: 'YouTube', Icon: Youtube, placeholder: 'youtube.com/@…' },
  { key: 'tiktok', label: 'TikTok', Icon: Music2, placeholder: '@company' },
  { key: 'website', label: 'Сайт', Icon: Globe, placeholder: 'https://…' },
];

function ProfileTab({ companyId, fallbackName }: { companyId: string; fallbackName: string }) {
  const [p, setP] = useState<CompanyProfile>({ companyName: fallbackName, description: '', phone: '', socials: { ...EMPTY_SOCIALS } });
  const [saved, setSaved] = useState(false);
  useEffect(() => { setP(getProfile(companyId, fallbackName)); }, [companyId, fallbackName]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    saveProfile(companyId, p);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }
  const setSocial = (k: keyof CompanySocials, v: string) => setP({ ...p, socials: { ...p.socials, [k]: v } });

  return (
    <form onSubmit={save} className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-display text-base font-bold text-slate-900">О компании</h3>
        <div className="space-y-3">
          <In label="Название компании" value={p.companyName} onChange={(v) => setP({ ...p, companyName: v })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Описание</label>
            <textarea value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-lake-400" placeholder="О компании, опыт, специализация…" />
          </div>
          <In label="Телефон" value={p.phone} onChange={(v) => setP({ ...p, phone: v })} placeholder="+996 700 000 000" />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <h3 className="mb-1 font-display text-base font-bold text-slate-900">Соцсети и контакты</h3>
        <p className="mb-4 text-sm text-slate-500">Добавьте свои ссылки — они появятся на странице ваших туров.</p>
        <div className="space-y-2.5">
          {SOCIAL_FIELDS.map(({ key, label, Icon, placeholder }) => (
            <div key={key} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 transition focus-within:border-lake-400">
              <Icon size={17} className="shrink-0 text-slate-400" />
              <input
                value={p.socials[key]}
                onChange={(e) => setSocial(key, e.target.value)}
                placeholder={`${label} · ${placeholder}`}
                className="h-11 w-full bg-transparent text-sm outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 lg:col-span-2">
        <button type="submit" className="h-12 rounded-xl bg-slate-900 px-6 font-semibold text-white transition hover:bg-slate-800">Сохранить профиль</button>
        {saved && <span className="flex items-center gap-1 text-sm font-medium text-emerald-600"><Check size={16} /> Сохранено</span>}
      </div>
    </form>
  );
}

// ── Статистика ──────────────────────────────────────────────
function StatsTab({ tours, bookings }: { tours: AgencyTour[]; bookings: BookingRow[] }) {
  const revenue = bookings.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + b.totalPrice, 0);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Мои туры" value={tours.length} />
      <Stat label="Заявок всего" value={bookings.length} />
      <Stat label="Выручка (демо)" value={formatPrice(revenue)} small />
      <Stat label="Конверсия" value="3.4%" />
      <Stat label="Просмотры (нед.)" value={1240} />
      <Stat label="В избранном" value={87} />
      <Stat label="Средний чек" value={formatPrice(8500)} small />
      <Stat label="Рейтинг" value="4.8 ★" />
    </div>
  );
}
function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-display font-extrabold text-slate-900 ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}
