import { Guard } from '@/components/Guard';
import { AccountClient } from '@/components/account/AccountClient';

export const metadata = { title: 'Личный кабинет — Jolu' };

export default function AccountPage() {
  return (
    <Guard role="tourist">
      <AccountClient />
    </Guard>
  );
}
