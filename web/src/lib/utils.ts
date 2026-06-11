import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Форматирование цены: 4500 -> "4 500 сом" */
export function formatPrice(value: number, currency: 'KGS' | 'USD' = 'KGS') {
  const formatted = new Intl.NumberFormat('ru-RU').format(value);
  return currency === 'USD' ? `$${formatted}` : `${formatted} сом`;
}

const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

/** "2026-06-14" -> "14 июн" */
export function formatDateShort(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
}

/** Диапазон дат: "14–16 июн" */
export function formatDateRange(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${MONTHS_RU[s.getMonth()]}`;
  }
  return `${formatDateShort(startIso)} – ${formatDateShort(endIso)}`;
}

/** Сколько дней до даты (для бейджа «ближайший выезд») */
export function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
