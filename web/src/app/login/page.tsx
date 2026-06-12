'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mountain, Building2 } from 'lucide-react';
import { useAuth, ROLE_META } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { loginCompany } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = loginCompany(login, password);
    if (!res.ok) { setError(res.error); return; }
    router.push(ROLE_META.company.home);
  }

  return (
    <div className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden bg-lake-950 px-4 py-12">
      <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(60% 60% at 50% 0%, #235e8c 0%, transparent 70%)' }} />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lake-600 text-white"><Mountain size={18} /></span>
          <span className="text-xl font-extrabold text-lake-800">Jolu</span>
        </div>

        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-lake-50 px-3 py-1.5 text-sm font-semibold text-lake-700">
          <Building2 size={15} /> Кабинет туркомпании
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900">Вход для компаний</h1>
        <p className="mt-1 text-sm text-slate-500">
          Введите логин и пароль, которые выдал администратор платформы.
          Туристам вход не нужен — они бронируют без регистрации.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Логин</label>
            <input value={login} onChange={(e) => setLogin(e.target.value)} required autoComplete="username"
              placeholder="логин компании"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-lake-400" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Пароль</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" autoComplete="current-password"
              placeholder="••••••••"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-lake-400" />
          </div>

          {error && <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>}

          <button type="submit" className="h-12 w-full rounded-xl bg-sunset-500 font-semibold text-white hover:bg-sunset-600">
            Войти в кабинет
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Нет аккаунта? <Link href="/for-companies" className="text-lake-600 hover:underline">Разместить туры</Link>
          {' · '}
          <Link href="/" className="text-lake-600 hover:underline">На главную</Link>
        </p>
      </div>
    </div>
  );
}
