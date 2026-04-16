import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shadcn Chat",
  description: "Chat/message components for Shadcn",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: 1,
  interactiveWidget: "resizes-content",
};

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AccentThemeLoader } from "@/components/accent-theme-loader";
import RouteProtection from "@/components/route-protection/RouteProtection";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} h-full`}>
        <RouteProtection>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AccentThemeLoader />
            {children}
            <Toaster />
          </ThemeProvider>
        </RouteProtection>
      </body>
    </html>
  );
}
