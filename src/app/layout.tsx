import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'Broke.AI | The Toxic Finance Tracker',
  description:
    'An AI that psychologically abuses you into saving money. Every rupee wasted is documented and judged.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${robotoMono.variable} font-mono antialiased bg-zinc-950 text-zinc-300 h-dvh overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
