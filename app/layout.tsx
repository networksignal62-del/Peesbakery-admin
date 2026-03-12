import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Pee's Bakery & Restaurant",
  description: "Fresh baked goods and delicious meals in Freetown, Sierra Leone",
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
