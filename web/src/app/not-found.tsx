import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl">🏔</p>
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Страница не найдена</h1>
      <p className="mt-2 text-slate-500">Похоже, эта тропа никуда не ведёт.</p>
      <Link href="/" className="mt-6 rounded-xl bg-lake-600 px-6 py-3 font-semibold text-white hover:bg-lake-700">
        На главную
      </Link>
    </div>
  );
}
