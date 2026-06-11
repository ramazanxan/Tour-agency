'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, Mountain, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth, ROLE_META } from '@/lib/auth';

const NAV = [
  { href: '/tours', label: 'Каталог' },
  { href: '/#destinations', label: 'Направления' },
  { href: '/for-companies', label: 'Туркомпаниям' },
];

export function Header() {
  const { account, logout, ready } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); setMenu(false); }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lake-600 text-white">
            <Mountain size={20} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-lake-800">Jolu</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-lake-700">{n.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {ready && account ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lake-100 text-sm">
                  {ROLE_META[account.role].emoji}
                </span>
                <span className="hidden max-w-[120px] truncate sm:block">{account.name}</span>
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{account.name}</p>
                    <p className="text-xs text-slate-500">{ROLE_META[account.role].label}</p>
                  </div>
                  <Link href={ROLE_META[account.role].home} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    Мой кабинет
                  </Link>
                  <button onClick={logout} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50">
                    <LogOut size={15} /> Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-lake-600 px-4 py-2 text-sm font-semibold text-white hover:bg-lake-700"
            >
              <User size={16} /> Войти
            </Link>
          )}

          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Меню">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-100 px-4 py-3 text-sm font-medium text-slate-600 md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-2 py-2 hover:bg-slate-50">{n.label}</Link>
          ))}
          {account && (
            <Link href={ROLE_META[account.role].home} className="rounded-lg px-2 py-2 hover:bg-slate-50">Мой кабинет</Link>
          )}
        </nav>
      )}
    </header>
  );
}
