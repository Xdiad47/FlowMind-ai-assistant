// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
