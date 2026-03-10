import { ReactNode } from 'react';
import { Sidebar } from '@/components/shared/sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // Removemos 'bg-slate-50' para deixar o background do globals.css aparecer
    <div className="flex min-h-screen">
      
      {/* Sidebar - Agora com fundo transparente e borda sutil para o visual premium */}
      <aside className="w-64 border-r border-white/5 bg-transparent hidden md:block">
        <Sidebar />
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}