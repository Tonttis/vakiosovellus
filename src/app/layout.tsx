import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vakioveikkaus",
  description: "Vakioveikkaus veikkaus.fi",
  keywords: ["Vakioveikkaus, Vakio, Veikkaus"],
  authors: [{ name: "Tino Kortelainen" }],
  icons: {
    icon: "https://play-lh.googleusercontent.com/vy-KHmWehOg06Ynu6NOD1oqcmGQe28cguZ-dobkWElYAe05miEYYI0reiczk7xq-lH6q",
  },
  openGraph: {
    title: "Vakioveikkaus",
    description: "Vakioveikkaus",
    url: "",
    siteName: "",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vakioveikkaus",
    description: "Vakioveikkaus",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
