import { Guard } from '@/components/Guard';
import { AdminClient } from '@/components/admin/AdminClient';

export const metadata = { title: 'Админ-панель — Jolu' };

export default function AdminPage() {
  return (
    <Guard role="admin">
      <AdminClient />
    </Guard>
  );
}
