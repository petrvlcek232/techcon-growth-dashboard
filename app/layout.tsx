import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../src/app/globals.css';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ABC Díly - přehledy',
  description: 'Analýza růstu a poklesu zákazníků',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
