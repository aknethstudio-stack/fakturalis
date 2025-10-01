import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import '@/styles/global.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3b82f6',
};

export const metadata: Metadata = {
  title: 'InvoiceForge - Profesjonalne faktury online',
  description:
    'Nowoczesny system fakturowania dla polskich przedsiębiorców. Twórz faktury zgodne z KSeF, zarządzaj klientami i produktami.',
  keywords: ['faktury', 'fakturowanie', 'KSeF', 'przedsiębiorcy', 'małe firmy', 'księgowość'],
  authors: [{ name: 'AKNETH Studio Katarzyna Pawłowska-Malesa', url: 'https://akneth-studio.vercel.app' }],
  creator: 'AKNETH Studio Katarzyna Pawłowska-Malesa',
  publisher: 'AKNETH Studio Katarzyna Pawłowska-Malesa',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/ico/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/ico/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/ico/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      { rel: 'android-chrome-192x192', url: '/ico/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/ico/android-chrome-512x512.png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'InvoiceForge - Profesjonalne faktury online',
    description: 'Nowoczesny system fakturowania dla polskich przedsiębiorców',
    url: siteUrl,
    siteName: 'InvoiceForge',
    locale: 'pl_PL',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/invoiceforge.png`,
        width: 1200,
        height: 630,
        alt: 'InvoiceForge - System fakturowania',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InvoiceForge - Profesjonalne faktury online',
    description: 'Nowoczesny system fakturowania dla polskich przedsiębiorców',
    images: [`${siteUrl}/invoiceforge.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='pl' suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col`} suppressHydrationWarning>
        <Header />
        <main className='flex-1'>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
