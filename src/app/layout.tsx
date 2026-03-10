import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MobileNav } from "@/components/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configurações de comportamento visual do navegador e dispositivos móveis
export const viewport: Viewport = {
  themeColor: "#020617", // Cor do topo do navegador (Slate 950)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Evita zoom acidental que quebra a sensação de "App"
};

export const metadata: Metadata = {
  title: "SkillUp | Sistema de ensino",
  description: "Plataforma premium de tecnologia",
  manifest: "/manifest.json", // Link para o arquivo de PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SkillUp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        {/* Ícone para dispositivos Apple quando salvos na home */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        {/* Envolvendo o children em um min-h-screen para garantir que o fundo ocupe tudo */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Navegação fixa para mobile presente em todas as páginas */}
        <MobileNav />
      </body>
    </html>
  );
}