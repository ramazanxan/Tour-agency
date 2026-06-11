import Link from 'next/link';
import { Mountain, Send } from 'lucide-react';

export function Footer() {
  const botUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'jolu_bot';
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lake-600 text-white">
              <Mountain size={18} />
            </span>
            <span className="text-lg font-extrabold text-lake-800">Jolu</span>
          </div>
          <p className="text-sm text-slate-500">
            Туры по Кыргызстану в одном месте. Жол — путь, дорога.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Туристам</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/tours" className="hover:text-lake-700">Каталог туров</Link></li>
            <li><Link href="/#destinations" className="hover:text-lake-700">Направления</Link></li>
            <li><Link href="/account" className="hover:text-lake-700">Мои брони</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Компаниям</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/for-companies" className="hover:text-lake-700">Разместить туры</Link></li>
            <li><Link href="/dashboard" className="hover:text-lake-700">Кабинет компании</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-700">Telegram</h4>
          <a
            href={`https://t.me/${botUser}`}
            className="inline-flex items-center gap-2 rounded-xl bg-lake-50 px-3 py-2 text-sm font-medium text-lake-700 hover:bg-lake-100"
          >
            <Send size={16} /> @{botUser}
          </a>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Jolu. Сделано в Кыргызстане 🇰🇬
      </div>
    </footer>
  );
}
