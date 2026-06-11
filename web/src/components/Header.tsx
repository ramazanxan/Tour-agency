'use client';

import Link from 'next/link';
import { Menu, Mountain, User } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lake-600 text-white">
            <Mountain size={20} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-lake-800">
            Jolu
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/tours" className="hover:text-lake-700">Каталог</Link>
          <Link href="/#destinations" className="hover:text-lake-700">Направления</Link>
          <Link href="/#season" className="hover:text-lake-700">Сезон сейчас</Link>
          <Link href="/for-companies" className="hover:text-lake-700">Туркомпаниям</Link>
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/account"
            className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block"
            aria-label="Личный кабинет"
          >
            <User size={20} />
          </Link>
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Меню"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-100 px-4 py-3 text-sm font-medium text-slate-600 md:hidden">
          <Link href="/tours" className="rounded-lg px-2 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>Каталог</Link>
          <Link href="/#destinations" className="rounded-lg px-2 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>Направления</Link>
          <Link href="/#season" className="rounded-lg px-2 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>Сезон сейчас</Link>
          <Link href="/for-companies" className="rounded-lg px-2 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>Туркомпаниям</Link>
          <Link href="/account" className="rounded-lg px-2 py-2 hover:bg-slate-50" onClick={() => setOpen(false)}>Личный кабинет</Link>
        </nav>
      )}
    </header>
  );
}
