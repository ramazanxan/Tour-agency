import Link from 'next/link';
import { Mountain, Send, ArrowUpRight } from 'lucide-react';

export function Footer() {
  const botUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'jolu_bot';
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-300">
      {/* мягкое цветное сияние */}
      <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-lake-600/15 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-sunset-600/10 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-14">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lake-500 to-lake-700 text-white shadow-lg shadow-lake-900/40">
                <Mountain size={19} />
              </span>
              <span className="font-display text-xl font-extrabold tracking-tight text-white">Jolu</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Путешествия по Центральной Азии в одном месте. <span className="text-slate-300">Жол</span> — путь, дорога.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Туристам</h4>
            <ul className="space-y-2.5 text-sm">
              <FootLink href="/tours">Каталог туров</FootLink>
              <FootLink href="/#destinations">Направления</FootLink>
              <FootLink href="/for-companies">Туркомпаниям</FootLink>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Компаниям</h4>
            <ul className="space-y-2.5 text-sm">
              <FootLink href="/for-companies">Разместить туры</FootLink>
              <FootLink href="/dashboard">Кабинет компании</FootLink>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Связаться</h4>
            <a
              href={`https://t.me/${botUser}`}
              className="group inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-all hover:border-white/20 hover:bg-white/10"
            >
              <Send size={16} className="text-lake-400" /> @{botUser}
              <ArrowUpRight size={14} className="text-slate-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {year} Jolu. Все права защищены.</p>
          <p className="flex items-center gap-1.5">
            Сделано в Кыргызстане
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://flagcdn.com/kg.svg" alt="" aria-hidden className="h-3 w-[18px] rounded-[2px] object-cover ring-1 ring-white/15" />
          </p>
        </div>
      </div>
    </footer>
  );
}

function FootLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-slate-400 transition-colors hover:text-white">
        {children}
      </Link>
    </li>
  );
}
