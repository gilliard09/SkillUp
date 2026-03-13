'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MobileNav } from "@/components/mobilenav";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Definimos as rotas onde a barra de navegação NÃO deve aparecer
  const hideNavRoutes = ["/login", "/register/vip", "/"];

  const shouldHideNav = hideNavRoutes.includes(pathname);

  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <main className="min-h-screen">
          {children}
        </main>

        {/* Só renderiza o MobileNav se não estiver nas rotas de autenticação */}
        {!shouldHideNav && <MobileNav />}
      </body>
    </html>
  );
}