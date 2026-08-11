import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { BOOK } from '@/content/book';
import { APP_URL } from '@/lib/config';
import './globals.css';

const title = `${BOOK.title} — ${BOOK.author}`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: title,
    template: `%s — ${BOOK.title}`,
  },
  description: BOOK.pitch,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: BOOK.title,
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title,
    description: BOOK.pitch,
    url: '/',
    siteName: title,
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: BOOK.pitch,
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0e17',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
