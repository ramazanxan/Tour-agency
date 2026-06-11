'use client';

import { useState } from 'react';
import { Check, ShieldCheck, X } from 'lucide-react';
import type { Company, Tour } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

type Tab = 'companies' | 'tours' | 'analytics';
type ModState = 'pending' | 'approved' | 'rejected';

export function AdminClient({ companies, tours }: { companies: Company[]; tours: Tour[] }) {
  const [tab, setTab] = useState<Tab>('companies');
  const [companyState, setCompanyState] = useState<Record<string, ModState>>(
    Object.fromEntries(companies.map((c) => [c.id, c.isVerified ? 'approved' : 'pending']))
  );
  const [tourState, setTourState] = useState<Record<string, ModState>>(
    Object.fromEntries(tours.map((t) => [t.id, 'approved']))
  );

  const gmv = tours.reduce((s, t) => s + t.price * 3, 0); // грубая оценка для демо

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Админ-панель</h1>
      <p className="text-sm text-slate-500">Модерация и аналитика платформы</p>

      <div className="mb-5 mt-6 flex gap-1 border-b border-slate-100">
        {([
          ['companies', 'Компании'],
          ['tours', 'Туры'],
          ['analytics', 'Аналитика'],
        ] as [Tab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
              tab === t ? 'border-lake-600 text-lake-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'companies' && (
        <div className="space-y-3">
          {companies.map((c) => {
            const state = companyState[c.id];
            return (
              <div key={c.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{c.name}</p>
                    {state === 'approved' && <span className="flex items-center gap-1 text-xs text-lake-600"><ShieldCheck size={13} /> верифицирована</span>}
                    {state === 'rejected' && <span className="text-xs text-rose-500">отклонена</span>}
                  </div>
                  <p className="text-sm text-slate-500">{c.phone} · {c.toursDone} туров · ⭐ {c.rating}</p>
                </div>
                {state === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => setCompanyState((s) => ({ ...s, [c.id]: 'approved' }))}
                      className="flex items-center gap-1 rounded-lg bg-lake-600 px-3 py-2 text-sm font-semibold text-white hover:bg-lake-700">
                      <Check size={15} /> Верифицировать
                    </button>
                    <button onClick={() => setCompanyState((s) => ({ ...s, [c.id]: 'rejected' }))}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50">
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setCompanyState((s) => ({ ...s, [c.id]: 'pending' }))}
                    className="text-sm text-slate-400 hover:text-slate-600">сбросить</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'tours' && (
        <div className="space-y-3">
          {tours.map((t) => {
            const state = tourState[t.id];
            return (
              <div key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
                <div>
                  <p className="font-semibold text-slate-800">{t.title}</p>
                  <p className="text-sm text-slate-500">{formatPrice(t.price, t.currency)} · {t.durationDays} дн.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    state === 'approved' ? 'bg-emerald-100 text-emerald-700' : state === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {state === 'approved' ? 'Опубликован' : state === 'rejected' ? 'Отклонён' : 'На модерации'}
                  </span>
                  <button onClick={() => setTourState((s) => ({ ...s, [t.id]: state === 'approved' ? 'rejected' : 'approved' }))}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                    {state === 'approved' ? 'Снять' : 'Опубликовать'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card label="Компаний" value={companies.length} />
          <Card label="Активных туров" value={tours.length} />
          <Card label="GMV (оценка)" value={formatPrice(gmv)} small />
          <Card label="Конверсия → заявка" value="3.2%" />
        </div>
      )}
    </div>
  );
}

function Card({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-extrabold text-slate-800 ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}
