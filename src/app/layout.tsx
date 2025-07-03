'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>StudentHousing Cyprus - Find Your Perfect Student Accommodation</title>
        <meta name="description" content="Find affordable and comfortable student housing in Cyprus. Connect with roommates and discover premium accommodations across major cities." />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen`}
      >
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
