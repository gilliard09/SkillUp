'use client';

import Link from 'next/link';
import { LayoutDashboard, Sword, Trophy, User, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function Sidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Definimos menuItems com o novo item de Desafios
  const menuItems = [
    { icon: LayoutDashboard, label: 'Início', href: '/dashboard' },
    { icon: Sword, label: 'Desafios', href: '/dashboard/challenges' },
    { icon: Trophy, label: 'Ranking', href: '/dashboard/ranking' },
    { icon: User, label: 'Perfil', href: '/dashboard/profile' },
  ];

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-9 px-2">
        <h1 className="text-xl font-bold text-white-900">SkillUp</h1>
        <p className="text-xs text-slate-500">Painel do Aluno</p>
      </div>

      <nav className="flex-1 space-y-1">
        {/* Corrigido de navigation.map para menuItems.map */}
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-slate-400 rounded-xl hover:bg-white/5 hover:text-white transition-all group"
  >
    <item.icon size={20} className="group-hover:text-brand-primary" />
    <span className="font-medium">{item.label}</span>
  </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors mt-auto"
      >
        <LogOut size={20} />
        <span className="font-medium">Sair</span>
      </button>
    </div>
  );
}