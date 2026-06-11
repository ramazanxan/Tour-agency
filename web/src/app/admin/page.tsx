import { AdminClient } from '@/components/admin/AdminClient';
import { companies, tours } from '@/lib/mock-data';

export const metadata = { title: 'Админ-панель — Jolu' };

export default function AdminPage() {
  return <AdminClient companies={companies} tours={tours} />;
}
