import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: 'Cosmic Radio | Interstellar Signal Processing',
  description: 'Experience space weather through sound. Real-time sonification of NASA solar wind, magnetospheric data, and AI-powered cosmic broadcasts.',
  keywords: ['space weather', 'sonification', 'NASA', 'ambient music', 'solar wind', 'radio astronomy', 'DONKI', 'aurora', 'geomagnetic storm'],
  authors: [{ name: 'Cosmic Radio Team' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Cosmic Radio | Interstellar Signal Processing',
    description: 'Experience space weather through sound. Real-time sonification of NASA data with AI-powered cosmic broadcasts.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cosmic Radio',
    description: 'Experience space weather through sound',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-black text-white font-sans antialiased overflow-hidden selection:bg-white selection:text-black">
        {/* Subtle grid overlay for technical feel */}
        <div className="fixed inset-0 z-0 bg-grid-sx opacity-20 pointer-events-none" />

        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </body>
    </html>
  );
}