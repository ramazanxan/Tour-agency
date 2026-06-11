import type { BookingStatus } from './types';

// Демо-заявки для кабинета компании (ТЗ 2.2.3 мини-CRM).
// В проде — выборка из таблицы bookings по company_id с RLS.

export interface BookingRow {
  id: string;
  tourTitle: string;
  tourSlug: string;
  departureLabel: string;
  contactName: string;
  contactPhone: string; // открывается компании только после подтверждения
  adults: number;
  children: number;
  totalPrice: number;
  status: BookingStatus;
  note?: string;
  createdAt: string; // ISO
}

export const STATUS_FLOW: BookingStatus[] = [
  'pending',
  'confirmed',
  'prepaid',
  'completed',
  'cancelled',
];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Новая',
  confirmed: 'Подтверждена',
  prepaid: 'Предоплата',
  completed: 'Завершена',
  cancelled: 'Отменена',
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-lake-100 text-lake-700',
  prepaid: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

function ago(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const companyBookings: BookingRow[] = [
  {
    id: 'b-1001', tourTitle: 'Алтын-Арашан: тёплые источники в горах', tourSlug: 'altyn-arashan-2d',
    departureLabel: 'через 4 дня', contactName: 'Айбек', contactPhone: '+996 700 111 222',
    adults: 2, children: 1, totalPrice: 12000, status: 'pending',
    note: 'Можно ли веган-питание?', createdAt: ago(0),
  },
  {
    id: 'b-1002', tourTitle: 'Сон-Куль: 3 дня в юрте на джайлоо', tourSlug: 'son-kul-yurts-3d',
    departureLabel: 'через 6 дней', contactName: 'Динара', contactPhone: '+996 555 333 444',
    adults: 2, children: 0, totalPrice: 23000, status: 'confirmed', createdAt: ago(1),
  },
  {
    id: 'b-1003', tourTitle: 'Каньон Сказка: тур одного дня', tourSlug: 'skazka-day',
    departureLabel: 'через 2 дня', contactName: 'Сергей', contactPhone: '+996 770 555 666',
    adults: 4, children: 2, totalPrice: 13000, status: 'prepaid', createdAt: ago(2),
  },
  {
    id: 'b-1004', tourTitle: 'Ала-Куль: трек к бирюзовому озеру', tourSlug: 'ala-kul-trek-4d',
    departureLabel: 'через 9 дней', contactName: 'Madina', contactPhone: '+996 700 777 888',
    adults: 1, children: 0, totalPrice: 16800, status: 'pending', createdAt: ago(0),
  },
  {
    id: 'b-1005', tourTitle: 'Алтын-Арашан: тёплые источники в горах', tourSlug: 'altyn-arashan-2d',
    departureLabel: '5 дней назад', contactName: 'Нурлан', contactPhone: '+996 555 999 000',
    adults: 3, children: 0, totalPrice: 13500, status: 'completed', createdAt: ago(12),
  },
  {
    id: 'b-1006', tourTitle: 'Каньон Сказка: тур одного дня', tourSlug: 'skazka-day',
    departureLabel: 'через 9 дней', contactName: 'Гуля', contactPhone: '+996 700 222 333',
    adults: 2, children: 0, totalPrice: 5000, status: 'cancelled',
    note: 'Передумали по датам', createdAt: ago(3),
  },
];
