'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type Role } from '@/lib/auth';

/**
 * Защита кабинетов по роли. Пока сессия не загружена — лоадер.
 * Нет доступа — редирект на нужную страницу входа.
 */
export function Guard({ role, children }: { role: Role; children: React.ReactNode }) {
  const { account, ready } = useAuth();
  const router = useRouter();

  const allowed = account?.role === role;

  useEffect(() => {
    if (!ready) return;
    if (!allowed) router.replace(role === 'admin' ? '/admin/login' : '/login');
  }, [ready, allowed, role, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-lake-600" />
      </div>
    );
  }
  if (!allowed) return null;
  return <>{children}</>;
}
