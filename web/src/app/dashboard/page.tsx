import { Guard } from '@/components/Guard';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export const metadata = { title: 'Кабинет компании — Jolu' };

export default function DashboardPage() {
  return (
    <Guard role="company">
      <DashboardClient />
    </Guard>
  );
}
