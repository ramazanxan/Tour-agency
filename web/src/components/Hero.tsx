'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { CategoryChips } from './CategoryChips';

export function Hero() {
  const router = useRouter();
  const [q, setQ] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    router.push(`/tours${params.toString() ? `?${params}` : ''}`);
  }

  return (
    <section className="relative overflow-hidden">
      {/* Фоновое видео гор (autoplay, muted, loop) с фолбэком-постером */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1454942901704-3c44c11b2ad1?auto=format&fit=crop&w=1600&q=80"
      >
        <source
          src="https://cdn.coverr.co/videos/coverr-mountain-lake-5244/1080p.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-lake-900/60 via-lake-900/40 to-lake-900/70" />

      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
        <h1 className="text-balance text-3xl font-extrabold leading-tight text-white sm:text-5xl">
          Куда хотите поехать?
        </h1>
        <p className="mt-3 text-balance text-base text-white/85 sm:text-lg">
          Все туры по Кыргызстану в одном месте. Сравнивайте, бронируйте, путешествуйте.
        </p>

        <form onSubmit={submit} className="mx-auto mt-7 flex max-w-xl items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-1 shadow-lg">
            <Search size={20} className="text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Иссык-Куль, Сон-Куль, треккинг…"
              className="h-12 flex-1 bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="h-14 rounded-2xl bg-sunset-500 px-6 font-semibold text-white shadow-lg transition-colors hover:bg-sunset-600"
          >
            Найти
          </button>
        </form>

        <div className="mx-auto mt-6 max-w-2xl">
          <CategoryChips />
        </div>
      </div>
    </section>
  );
}
