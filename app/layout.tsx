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
  userScalable: false,
  themeColor: '#000000',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: 'INTERCEPT | Listen to the Sun',
  description: 'Real-time heliospheric receiver. Transform live NASA telemetry into an immersive, procedural audio-visual broadcast. The universe is speaking. Are you listening?',
  keywords: [
    'space weather',
    'sonification',
    'NASA DONKI',
    'solar wind',
    'geomagnetic storm',
    'real-time',
    'heliospheric',
    'ambient',
    'audio visualization'
  ],
  authors: [{ name: 'INTERCEPT Team' }],
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'INTERCEPT | Listen to the Sun',
    description: 'Real-time heliospheric receiver. The universe is speaking.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INTERCEPT',
    description: 'Listen to the Sun. Real-time heliospheric receiver.',
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
      <body className="bg-black text-white font-sans antialiased overflow-hidden">
        {/* The Void - Pure OLED Black */}
        {children}

        {/* Subtle noise texture for screen texture */}
        <div className="noise-overlay" aria-hidden="true" />
      </body>
    </html>
  );
}