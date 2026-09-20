import type { Metadata } from 'next';
import { Onest } from 'next/font/google';

import { I18nProvider } from '@/components/i18n/I18nProvider';
import './globals.css';

const onest = Onest({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-onest',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'DENTA.UZ — Clinic CRM',
  description: 'Professional clinic management for dental practices',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={onest.variable} suppressHydrationWarning>
      <body className={`${onest.className} font-sans antialiased`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
