import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: "CSEDU Students' Club",
  description: "CSE, Dhaka University Students' Club — Elections, events, notices, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}