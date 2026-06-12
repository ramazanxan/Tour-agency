'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, LogOut, Plus, ShieldCheck, Trash2, X, Building2, Map, MapPin, Users, BarChart3 } from 'lucide-react';
import { useAuth, type AgencyRecord } from '@/lib/auth';
import { tours as mockTours, destinations } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';

type Tab = 'agencies' | 'tours' | 'destinations' | 'tourists' | 'analytics';

const TABS: { id: Tab; label: string; Icon: typeof Building2 }[] = [
  { id: 'agencies', label: 'Турагентства', Icon: Building2 },
  { id: 'tours', label: 'Туры', Icon: Map },
  { id: 'destinations', label: 'Направления', Icon: MapPin },
  { id: 'tourists', label: 'Туристы', Icon: Users },
  { id: 'analytics', label: 'Аналитика', Icon: BarChart3 },
];

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function AdminClient() {
  const { account, agencies, tourists, createAgency, updateAgency, deleteAgency, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('agencies');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              <ShieldCheck size={13} className="text-slate-600" /> Администрирование
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">Панель платформы Jolu</h1>
            <p className="text-sm text-slate-500">{account?.name} · полный контроль над платформой</p>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
            <LogOut size={15} /> Выйти
          </button>
        </div>

        <div className="no-scrollbar mb-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-sm">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                tab === id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}>
              <Icon size={16} className={tab === id ? 'text-sunset-300' : 'text-slate-400'} />
              {label}
              {id === 'agencies' && agencies.length ? <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200 px-1.5 text-[11px] font-bold text-slate-600">{agencies.length}</span> : null}
            </button>
          ))}
        </div>

        {tab === 'agencies' && (
          <AgenciesTab agencies={agencies} createAgency={createAgency} updateAgency={updateAgency} deleteAgency={deleteAgency} />
        )}
        {tab === 'tours' && <ToursTab />}
        {tab === 'destinations' && <DestinationsTab />}
        {tab === 'tourists' && <TouristsTab tourists={tourists} />}
        {tab === 'analytics' && <AnalyticsTab agencyCount={agencies.length} touristCount={tourists.length} />}
      </div>
    </div>
  );
}

// ── Турагентства ────────────────────────────────────────────
function AgenciesTab({
  agencies, createAgency, updateAgency, deleteAgency,
}: {
  agencies: AgencyRecord[];
  createAgency: ReturnType<typeof useAuth>['createAgency'];
  updateAgency: ReturnType<typeof useAuth>['updateAgency'];
  deleteAgency: ReturnType<typeof useAuth>['deleteAgency'];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ companyName: '', login: '', password: genPassword(), phone: '' });
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ login: string; password: string } | null>(null);
  const [reveal, setReveal] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = createAgency(form);
    if (!res.ok) { setError(res.error); return; }
    setCreated({ login: form.login.trim().toLowerCase(), password: form.password });
    setForm({ companyName: '', login: '', password: genPassword(), phone: '' });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">Создавайте аккаунты для туркомпаний и выдавайте им логин и пароль.</p>
        <button onClick={() => { setOpen(true); setCreated(null); setError(''); }}
          className="flex items-center gap-1.5 rounded-lg bg-lake-600 px-3 py-2 text-sm font-semibold text-white hover:bg-lake-700">
          <Plus size={16} /> Новое агентство
        </button>
      </div>

      {agencies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center text-slate-500">
          Пока нет ни одного агентства. Нажмите «Новое агентство», чтобы создать первый аккаунт.
        </div>
      ) : (
        <div className="space-y-3">
          {agencies.map((a) => (
            <div key={a.login} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{a.companyName}</p>
                  {a.verified
                    ? <span className="flex items-center gap-1 text-xs text-lake-600"><ShieldCheck size={12} /> верифицирована</span>
                    : <span className="text-xs text-amber-600">на модерации</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><KeyRound size={13} /> {a.login}</span>
                  <span className="flex items-center gap-1">
                    пароль: {reveal === a.login ? <code className="rounded bg-slate-100 px-1">{a.password}</code> : '••••••'}
                    <button onClick={() => setReveal(reveal === a.login ? null : a.login)} className="text-lake-600">
                      {reveal === a.login ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </span>
                  {a.phone && <span>{a.phone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateAgency(a.login, { verified: !a.verified })}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                  {a.verified ? 'Снять отметку' : 'Верифицировать'}
                </button>
                <button onClick={() => { if (confirm(`Удалить «${a.companyName}»?`)) deleteAgency(a.login); }}
                  className="rounded-lg border border-rose-200 p-2 text-rose-500 hover:bg-rose-50">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Новое турагентство</h3>
              <button onClick={() => setOpen(false)}><X className="text-slate-400" /></button>
            </div>

            {created ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="mb-2 flex items-center gap-1.5 font-semibold text-emerald-700"><Check size={16} /> Аккаунт создан</p>
                  <p className="text-sm text-slate-600">Передайте компании эти данные для входа:</p>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <CredRow label="Логин" value={created.login} />
                    <CredRow label="Пароль" value={created.password} />
                  </div>
                </div>
                <button onClick={() => { setOpen(false); setCreated(null); }}
                  className="h-11 w-full rounded-xl bg-lake-600 font-semibold text-white hover:bg-lake-700">Готово</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <Field label="Название компании" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} placeholder="Например, Jol Travel" />
                <Field label="Логин" value={form.login} onChange={(v) => setForm({ ...form, login: v })} placeholder="jol-travel" />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Пароль</label>
                  <div className="flex gap-2">
                    <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="h-11 flex-1 rounded-xl border border-slate-200 px-3 outline-none focus:border-lake-400" />
                    <button type="button" onClick={() => setForm({ ...form, password: genPassword() })}
                      className="rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">Сгенерировать</button>
                  </div>
                </div>
                <Field label="Телефон (необязательно)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+996 700 000 000" />
                {error && <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>}
                <button type="submit" className="h-11 w-full rounded-xl bg-sunset-500 font-semibold text-white hover:bg-sunset-600">Создать аккаунт</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CredRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
      <span className="text-slate-500">{label}:</span>
      <span className="flex items-center gap-2">
        <code className="font-semibold text-slate-900">{value}</code>
        <button onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
          className="text-lake-600">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
      </span>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-lake-400" />
    </div>
  );
}

// ── Туры (модерация демо-каталога) ──────────────────────────
function ToursTab() {
  const [state, setState] = useState<Record<string, 'published' | 'hidden'>>(
    Object.fromEntries(mockTours.map((t) => [t.id, 'published']))
  );
  return (
    <div className="space-y-3">
      {mockTours.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
          <div>
            <p className="font-semibold text-slate-800">{t.title}</p>
            <p className="text-sm text-slate-500">{formatPrice(t.price, t.currency)} · {t.durationDays} дн.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${state[t.id] === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {state[t.id] === 'published' ? 'Опубликован' : 'Скрыт'}
            </span>
            <button onClick={() => setState((s) => ({ ...s, [t.id]: s[t.id] === 'published' ? 'hidden' : 'published' }))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
              {state[t.id] === 'published' ? 'Скрыть' : 'Опубликовать'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Направления ─────────────────────────────────────────────
function DestinationsTab() {
  const [active, setActive] = useState<Record<string, boolean>>(Object.fromEntries(destinations.map((d) => [d.id, true])));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {destinations.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
          <div>
            <p className="font-semibold text-slate-800">{d.name}</p>
            <p className="text-sm text-slate-500">{d.region} · {d.toursCount} туров</p>
          </div>
          <label className="inline-flex cursor-pointer items-center">
            <input type="checkbox" className="peer sr-only" checked={active[d.id]} onChange={() => setActive((s) => ({ ...s, [d.id]: !s[d.id] }))} />
            <span className="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-lake-500 after:absolute after:ml-0.5 after:mt-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5 relative" />
          </label>
        </div>
      ))}
    </div>
  );
}

// ── Туристы ─────────────────────────────────────────────────
function TouristsTab({ tourists }: { tourists: { login: string; name: string; createdAt: string }[] }) {
  if (tourists.length === 0)
    return <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center text-slate-500">Туристы появятся здесь после первого входа на сайте.</div>;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr><th className="px-4 py-3 font-medium">Логин</th><th className="px-4 py-3 font-medium">Имя</th><th className="px-4 py-3 font-medium">Регистрация</th></tr>
        </thead>
        <tbody>
          {tourists.map((t) => (
            <tr key={t.login} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium text-slate-800">{t.login}</td>
              <td className="px-4 py-3 text-slate-600">{t.name}</td>
              <td className="px-4 py-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString('ru-RU')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Аналитика ───────────────────────────────────────────────
function AnalyticsTab({ agencyCount, touristCount }: { agencyCount: number; touristCount: number }) {
  const gmv = useMemo(() => mockTours.reduce((s, t) => s + t.price * 3, 0), []);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Турагентства" value={agencyCount} />
      <Stat label="Туристы" value={touristCount} />
      <Stat label="Активных туров" value={mockTours.length} />
      <Stat label="GMV (оценка)" value={formatPrice(gmv)} small />
      <Stat label="Заявок (демо)" value={42} />
      <Stat label="Конверсия → заявка" value="3.2%" />
      <Stat label="Повторные брони" value="17%" />
      <Stat label="Подписчиков бота" value={128} />
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-extrabold text-slate-800 ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}
