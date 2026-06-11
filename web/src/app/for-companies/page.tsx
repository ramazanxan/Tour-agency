import Link from 'next/link';
import { Check } from 'lucide-react';

export const metadata = {
  title: 'Туркомпаниям — разместите туры бесплатно | Jolu',
  description: 'Разместите туры на Jolu бесплатно, получайте заявки и управляйте ими в одном кабинете. Уведомления в Telegram.',
};

const benefits = [
  'Бесплатное размещение до 3 туров',
  'Заявки на бронирование прямо в кабинет',
  'Мгновенные уведомления в Telegram',
  'Календарь выездов с загрузкой мест',
  'Мини-CRM: заявки от новой до завершённой',
  'Профиль компании с рейтингом и бейджем «Верифицирована»',
];

export default function ForCompaniesPage() {
  return (
    <div>
      <section className="bg-lake-700 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-balance text-3xl font-extrabold sm:text-4xl">
            Получайте заявки на туры, а не теряйте их в директе
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            Разместите туры на Jolu бесплатно. Мы приводим туристов, вы управляете заявками
            в одном кабинете и получаете уведомления в Telegram.
          </p>
          <Link href="/dashboard"
            className="mt-7 inline-block rounded-xl bg-sunset-500 px-7 py-3.5 font-semibold text-white hover:bg-sunset-600">
            Открыть кабинет
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-slate-900">Что вы получаете</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((b) => (
            <div key={b} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check size={15} />
              </span>
              <span className="text-slate-700">{b}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-slate-50 p-6 text-center">
          <p className="text-slate-600">
            На старте — <b className="text-slate-900">бесплатно для всех</b>. PRO-тариф со статистикой,
            безлимитом туров и AI-помощником появится позже.
          </p>
        </div>
      </section>
    </div>
  );
}
