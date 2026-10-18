import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: "Admin | Pee's Bakery", template: "%s | Pee's Bakery Admin" },
  description: "Staff administration for Pee's Bakery & Restaurant.",
  robots: { index: false, follow: false, noarchive: true },
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#166534',
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              style: { background: '#166534' },
            },
            error: {
              style: { background: '#ef4444' },
            },
          }}
        />
      </body>
    </html>
  );
}
