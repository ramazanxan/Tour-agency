import Link from 'next/link';
import type { TourType } from '@/lib/types';

const CHIPS: { type: TourType; label: string }[] = [
  { type: 'trekking', label: '🏔 Треккинг' },
  { type: 'horse', label: '🐎 Конные туры' },
  { type: 'jeep', label: '🚙 Джип-туры' },
  { type: 'camping', label: '⛺ Кемпинг' },
  { type: 'cultural', label: '🌍 Культурные' },
  { type: 'gastro', label: '🍲 Гастро' },
];

export function CategoryChips() {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {CHIPS.map((c) => (
        <Link
          key={c.type}
          href={`/tours?type=${c.type}`}
          className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-lake-300 hover:bg-lake-50 hover:text-lake-700"
        >
          {c.label}
        </Link>
      ))}
    </div>
  );
}
