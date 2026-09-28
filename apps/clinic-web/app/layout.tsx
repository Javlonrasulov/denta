import type { Metadata } from 'next';
import { Onest } from 'next/font/google';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { I18nProvider } from '@/components/i18n/I18nProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

const onest = Onest({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-onest',
  display: 'swap',
  preload: true,
});

const SITE_TITLE = 'ORADENT — Klinika boshqaruv tizimi';
const SITE_DESCRIPTION =
  'ORADENT — stomatologiya klinikalari uchun zamonaviy boshqaruv tizimi: qabullar, bemorlar, shifokorlar, moliya va ombor.';

export const metadata: Metadata = {
  metadataBase: new URL('https://oradent.uz'),
  applicationName: 'ORADENT',
  title: { default: SITE_TITLE, template: '%s — ORADENT' },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'ORADENT',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: 'https://oradent.uz',
    locale: 'uz_UZ',
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={onest.variable} suppressHydrationWarning>
      <body className={`${onest.className} font-sans antialiased`}>
        <I18nProvider>
          <AuthProvider>
            <AuthGuard>{children}</AuthGuard>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
