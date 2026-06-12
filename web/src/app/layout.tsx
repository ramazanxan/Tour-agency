import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/lib/auth';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

// Дисплейная гарнитура для заголовков — геометричная, премиальная, с полной кириллицей
const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jolu — туры по Кыргызстану',
  description:
    'Находите, сравнивайте и бронируйте туры по Кыргызстану в одном месте. Треккинг, конные и джип-туры, Иссык-Куль, Сон-Куль и Алтын-Арашан.',
  keywords: ['туры Кыргызстан', 'Иссык-Куль', 'Сон-Куль', 'Алтын-Арашан', 'треккинг', 'Jolu'],
  openGraph: {
    title: 'Jolu — туры по Кыргызстану',
    description: 'Booking для туров по Кыргызстану. Бронируйте онлайн.',
    type: 'website',
    locale: 'ru_RU',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${manrope.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
