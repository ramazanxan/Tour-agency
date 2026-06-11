'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Role = 'tourist' | 'company' | 'admin';

export interface Account {
  role: Role;
  login: string;
  name: string;
  companyId?: string; // для роли company
}

export const ROLE_META: Record<Role, { label: string; home: string; emoji: string }> = {
  tourist: { label: 'Турист', home: '/account', emoji: '🧭' },
  company: { label: 'Туркомпания', home: '/dashboard', emoji: '🏔️' },
  admin: { label: 'Админ', home: '/admin', emoji: '🛡️' },
};

// Записи реестра (localStorage-прототип; в проде — таблица users в Supabase).
export interface AgencyRecord {
  login: string;
  password: string;
  companyName: string;
  companyId: string;
  phone: string;
  verified: boolean;
  createdAt: string;
}
export interface TouristRecord {
  login: string;
  name: string;
  createdAt: string;
}

// Учётка администратора (прототип). В проде — серверный секрет / Supabase Auth.
const ADMIN_CREDENTIALS = { login: 'admin', password: 'jolu-admin-2026' };

const K = {
  session: 'jolu.session',
  agencies: 'jolu.agencies',
  tourists: 'jolu.tourists',
};

type Result = { ok: true } | { ok: false; error: string };

interface AuthCtx {
  account: Account | null;
  ready: boolean;
  agencies: AgencyRecord[];
  tourists: TouristRecord[];
  loginTourist: (login: string) => Result;
  loginCompany: (login: string, password: string) => Result;
  loginAdmin: (login: string, password: string) => Result;
  logout: () => void;
  createAgency: (data: { companyName: string; login: string; password: string; phone: string }) => Result;
  updateAgency: (login: string, patch: Partial<AgencyRecord>) => void;
  deleteAgency: (login: string) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}
const norm = (s: string) => s.trim().toLowerCase();
export const slug = (s: string) =>
  norm(s).replace(/[^a-z0-9а-я]+/gi, '-').replace(/^-+|-+$/g, '') || 'agency';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [agencies, setAgencies] = useState<AgencyRecord[]>([]);
  const [tourists, setTourists] = useState<TouristRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAccount(read<Account | null>(K.session, null));
    setAgencies(read<AgencyRecord[]>(K.agencies, []));
    setTourists(read<TouristRecord[]>(K.tourists, []));
    setReady(true);
  }, []);

  function setSession(a: Account | null) {
    setAccount(a);
    if (a) write(K.session, a);
    else { try { localStorage.removeItem(K.session); } catch { /* ignore */ } }
  }

  function loginTourist(loginRaw: string): Result {
    const login = norm(loginRaw);
    if (login.length < 2) return { ok: false, error: 'Логин слишком короткий' };
    // занят ли логин агентством/админом
    if (login === ADMIN_CREDENTIALS.login || agencies.some((a) => a.login === login))
      return { ok: false, error: 'Этот логин занят' };

    let rec = tourists.find((t) => t.login === login);
    if (!rec) {
      rec = { login, name: loginRaw.trim(), createdAt: new Date().toISOString() };
      const next = [...tourists, rec];
      setTourists(next);
      write(K.tourists, next);
    }
    setSession({ role: 'tourist', login: rec.login, name: rec.name });
    return { ok: true };
  }

  function loginCompany(loginRaw: string, password: string): Result {
    const login = norm(loginRaw);
    const rec = agencies.find((a) => a.login === login);
    if (!rec || rec.password !== password)
      return { ok: false, error: 'Неверный логин или пароль' };
    setSession({ role: 'company', login: rec.login, name: rec.companyName, companyId: rec.companyId });
    return { ok: true };
  }

  function loginAdmin(loginRaw: string, password: string): Result {
    if (norm(loginRaw) !== ADMIN_CREDENTIALS.login || password !== ADMIN_CREDENTIALS.password)
      return { ok: false, error: 'Неверный логин или пароль' };
    setSession({ role: 'admin', login: 'admin', name: 'Администратор' });
    return { ok: true };
  }

  function createAgency(data: { companyName: string; login: string; password: string; phone: string }): Result {
    const login = norm(data.login);
    if (login.length < 3) return { ok: false, error: 'Логин минимум 3 символа' };
    if (data.password.length < 4) return { ok: false, error: 'Пароль минимум 4 символа' };
    if (!data.companyName.trim()) return { ok: false, error: 'Укажите название компании' };
    if (login === ADMIN_CREDENTIALS.login || agencies.some((a) => a.login === login) || tourists.some((t) => t.login === login))
      return { ok: false, error: 'Логин уже занят' };

    const rec: AgencyRecord = {
      login,
      password: data.password,
      companyName: data.companyName.trim(),
      companyId: `agency-${slug(data.login)}-${Date.now().toString(36).slice(-4)}`,
      phone: data.phone.trim(),
      verified: true,
      createdAt: new Date().toISOString(),
    };
    const next = [...agencies, rec];
    setAgencies(next);
    write(K.agencies, next);
    return { ok: true };
  }

  function updateAgency(login: string, patch: Partial<AgencyRecord>) {
    const next = agencies.map((a) => (a.login === login ? { ...a, ...patch } : a));
    setAgencies(next);
    write(K.agencies, next);
  }
  function deleteAgency(login: string) {
    const next = agencies.filter((a) => a.login !== login);
    setAgencies(next);
    write(K.agencies, next);
  }

  function logout() { setSession(null); }

  return (
    <Ctx.Provider value={{
      account, ready, agencies, tourists,
      loginTourist, loginCompany, loginAdmin, logout,
      createAgency, updateAgency, deleteAgency,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
