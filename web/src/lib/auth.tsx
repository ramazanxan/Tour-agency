'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Role = 'tourist' | 'company' | 'admin';

export interface Account {
  role: Role;
  name: string;
}

export const ROLE_META: Record<Role, { label: string; home: string; emoji: string; desc: string }> = {
  tourist: { label: 'Турист', home: '/account', emoji: '🧭', desc: 'Брони, избранное и история путешествий' },
  company: { label: 'Туркомпания', home: '/dashboard', emoji: '🏔️', desc: 'Туры, заявки и календарь выездов' },
  admin: { label: 'Админ-редактор', home: '/admin', emoji: '🛡️', desc: 'Модерация, направления и аналитика' },
};

interface AuthCtx {
  account: Account | null;
  ready: boolean;
  login: (a: Account) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ account: null, ready: false, login: () => {}, logout: () => {} });
const KEY = 'jolu.account';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setAccount(JSON.parse(raw));
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  function login(a: Account) {
    setAccount(a);
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* ignore */ }
  }
  function logout() {
    setAccount(null);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }

  return <Ctx.Provider value={{ account, ready, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
