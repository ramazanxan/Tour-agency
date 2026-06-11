'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';

// Скрытая страница входа администратора. Нигде не ссылается в публичном UI.
export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = loginAdmin(login, password);
    if (!res.ok) { setError(res.error); return; }
    router.push('/admin');
  }

  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700"><ShieldCheck size={18} /></span>
          <span className="text-lg font-bold">Панель администратора</span>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input value={login} onChange={(e) => setLogin(e.target.value)} required autoComplete="username" placeholder="Логин"
            className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-white outline-none placeholder:text-slate-500 focus:border-slate-500" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" autoComplete="current-password" placeholder="Пароль"
            className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-white outline-none placeholder:text-slate-500 focus:border-slate-500" />
          {error && <p className="rounded-lg bg-rose-500/15 p-2.5 text-sm text-rose-300">{error}</p>}
          <button type="submit" className="h-12 w-full rounded-xl bg-white font-semibold text-slate-900 hover:bg-slate-100">Войти</button>
        </form>
      </div>
    </div>
  );
}
