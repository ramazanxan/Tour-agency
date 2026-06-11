import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTourBySlug } from '@/lib/mock-data';
import { BookingForm } from '@/components/booking/BookingForm';

export const metadata = { title: 'Бронирование тура — Jolu' };

export default function BookingPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { dep?: string };
}) {
  const tour = getTourBySlug(params.slug);
  if (!tour) notFound();

  const departure =
    tour.departures.find((d) => d.id === searchParams.dep) ??
    tour.departures.find((d) => new Date(d.dateStart).getTime() >= Date.now());

  if (!departure) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Нет доступных дат выезда</h1>
        <p className="mt-2 text-slate-500">Загляните позже или выберите другой тур.</p>
        <Link href="/tours" className="mt-4 inline-block text-lake-600 hover:underline">← В каталог</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href={`/tours/${tour.slug}`} className="text-sm text-slate-400 hover:text-lake-600">
        ← Назад к туру
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-extrabold text-slate-900">Оформление заявки</h1>
      <BookingForm tour={tour} departure={departure} />
    </div>
  );
}
