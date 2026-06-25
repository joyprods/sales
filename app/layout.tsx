// app/layout.tsx
import type { Metadata } from 'next';
import type { Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// 1. Configure fonts to export a CSS variable
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans' // This matches your globals.css theme
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevents manual zooming
  userScalable: false // Disables pinch-to-zoom
  // interactiveWidget: 'resizes-visual', // Optional: helps with mobile keyboards
};
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: 'Joymex Foods CRM',
  description: 'CRM for Joymex Foods built by Digital Craft Solutions',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: '/apple-icon.png'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      {/* 2. Apply font variables and the custom font-sans class */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-gradient-to-br font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
