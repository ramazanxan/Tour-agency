import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { tours } from '@/lib/mock-data';

export const metadata = { title: 'Кабинет компании — Jolu' };

export default function DashboardPage() {
  // Демо: показываем туры компании Jol Travel. В проде — выборка по owner_user_id.
  const companyTours = tours.filter((t) => t.companyId === 'c-jolu-travel');
  return <DashboardClient tours={companyTours} />;
}
