'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mountain } from 'lucide-react';
import { useAuth, ROLE_META, type Role } from '@/lib/auth';

const ROLES: Role[] = ['tourist', 'company', 'admin'];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>('tourist');
  const [name, setName] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const finalName = name.trim() || ROLE_META[role].label;
    login({ role, name: finalName });
    router.push(ROLE_META[role].home);
  }

  return (
    <div className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden bg-lake-950 px-4 py-12">
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: 'radial-gradient(60% 60% at 50% 0%, #235e8c 0%, transparent 70%)' }}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lake-600 text-white">
            <Mountain size={18} />
          </span>
          <span className="text-xl font-extrabold text-lake-800">Jolu</span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900">Вход в кабинет</h1>
        <p className="mt-1 text-sm text-slate-500">Выберите роль — это демо-вход без пароля.</p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="grid gap-2">
            {ROLES.map((r) => {
              const m = ROLE_META[r];
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${
                    active ? 'border-lake-500 bg-lake-50' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl">{m.emoji}</span>
                  <span className="flex-1">
                    <span className="block font-semibold text-slate-900">{m.label}</span>
                    <span className="block text-xs text-slate-500">{m.desc}</span>
                  </span>
                  <span className={`h-5 w-5 rounded-full border-2 ${active ? 'border-lake-500 bg-lake-500' : 'border-slate-300'}`} />
                </button>
              );
            })}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Имя</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к вам обращаться?"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-lake-400"
            />
          </div>

          <button type="submit" className="h-12 w-full rounded-xl bg-sunset-500 font-semibold text-white hover:bg-sunset-600">
            Войти как {ROLE_META[role].label}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Нажимая «Войти», вы соглашаетесь с условиями. <Link href="/" className="text-lake-600 hover:underline">На главную</Link>
        </p>
      </div>
    </div>
  );
}
