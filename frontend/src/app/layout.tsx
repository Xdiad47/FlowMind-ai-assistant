// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FlowMind — Your AI Chief of Staff",
  description: "Manage your calendar and inbox with natural language. Sign up, connect, and just talk.",
  openGraph: {
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable}>
      <body className="font-inter">
        <Providers>
          <div className="min-h-screen flex flex-col bg-bg text-text-primary">
            <div className="flex-1">{children}</div>
            <footer className="border-t border-border bg-surface">
              <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-center gap-6 text-sm text-muted">
                <Link href="/privacy" className="hover:text-text-primary transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-text-primary transition-colors">
                  Terms
                </Link>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
