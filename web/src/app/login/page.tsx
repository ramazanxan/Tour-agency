'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mountain, User, Building2 } from 'lucide-react';
import { useAuth, ROLE_META } from '@/lib/auth';

type Tab = 'tourist' | 'company';

export default function LoginPage() {
  const router = useRouter();
  const { loginTourist, loginCompany } = useAuth();
  const [tab, setTab] = useState<Tab>('tourist');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = tab === 'tourist' ? loginTourist(login) : loginCompany(login, password);
    if (!res.ok) { setError(res.error); return; }
    router.push(tab === 'tourist' ? ROLE_META.tourist.home : ROLE_META.company.home);
  }

  return (
    <div className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden bg-lake-950 px-4 py-12">
      <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(60% 60% at 50% 0%, #235e8c 0%, transparent 70%)' }} />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lake-600 text-white"><Mountain size={18} /></span>
          <span className="text-xl font-extrabold text-lake-800">Jolu</span>
        </div>

        {/* Переключатель: турист / компания */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          <button onClick={() => { setTab('tourist'); setError(''); }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors ${tab === 'tourist' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            <User size={16} /> Турист
          </button>
          <button onClick={() => { setTab('company'); setError(''); }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors ${tab === 'company' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            <Building2 size={16} /> Туркомпания
          </button>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900">
          {tab === 'tourist' ? 'Вход для туристов' : 'Кабинет компании'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {tab === 'tourist'
            ? 'Регистрация не нужна — просто придумайте логин. Под ним сохранятся ваши брони.'
            : 'Введите логин и пароль, которые выдал администратор платформы.'}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Логин</label>
            <input value={login} onChange={(e) => setLogin(e.target.value)} required autoComplete="username"
              placeholder={tab === 'tourist' ? 'например, aibek_2026' : 'логин компании'}
              className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-lake-400" />
          </div>
          {tab === 'company' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Пароль</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" autoComplete="current-password"
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-lake-400" />
            </div>
          )}

          {error && <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>}

          <button type="submit" className="h-12 w-full rounded-xl bg-sunset-500 font-semibold text-white hover:bg-sunset-600">
            {tab === 'tourist' ? 'Войти' : 'Войти в кабинет'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link href="/" className="text-lake-600 hover:underline">На главную</Link>
        </p>
      </div>
    </div>
  );
}
