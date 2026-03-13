import { ReactNode } from 'react';
import { Sidebar } from '@/components/shared/sidebar';
import { MobileNav } from '@/components/mobilenav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // bg-slate-950 definido UMA VEZ aqui — sidebar e todas as páginas herdam
    <div className="flex min-h-screen bg-slate-950">

      {/* Sidebar desktop */}
      <aside className="w-64 border-r border-white/5 hidden md:block flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Conteúdo Principal — pb-24 para não sobrepor a MobileNav no mobile */}
      <main className="flex-1 p-8 pb-24 md:pb-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* MobileNav — definido UMA VEZ aqui, cobre todas as rotas do dashboard */}
      <MobileNav />

    </div>
  );
}