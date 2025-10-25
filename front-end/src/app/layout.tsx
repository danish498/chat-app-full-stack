import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Shadcn Chat",
  description: "Chat/message components for Shadcn",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
