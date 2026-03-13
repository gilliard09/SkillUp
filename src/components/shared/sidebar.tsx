'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Sword, Trophy, User, LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// ============================================================
// CONSTANTES
// ============================================================
type NavItem = {
  icon: React.ElementType;
  label: string;
  href: string;
};

const BASE_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Início',   href: '/dashboard' },
  { icon: Sword,           label: 'Desafios', href: '/dashboard/challenges' },
  { icon: Trophy,          label: 'Ranking',  href: '/dashboard/ranking' },
  { icon: User,            label: 'Perfil',   href: '/dashboard/profile' },
];

const ADMIN_ITEM: NavItem = {
  icon: ShieldCheck,
  label: 'Admin',
  href: '/dashboard/admin',
};

function isItemActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

// ============================================================
// COMPONENTE
// ============================================================
export function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setIsAdmin(profile?.role === 'admin');
    };

    checkRole();
  }, []);

  const menuItems = isAdmin ? [...BASE_ITEMS, ADMIN_ITEM] : BASE_ITEMS;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full p-4">

      {/* Logo */}
      <div className="mb-9 px-2">
        <h1 className="text-xl font-bold text-white">SkillUp</h1>
        <p className="text-xs text-slate-500">Tecnologge</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = isItemActive(item.href, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive
                  ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon
                size={20}
                className={isActive ? 'text-brand-primary' : 'group-hover:text-brand-primary transition-colors'}
              />
              <span className="font-medium">{item.label}</span>

              {/* Indicador de ativo */}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-primary shadow-[0_0_6px_rgba(255,107,0,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 text-slate-500 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all mt-auto group"
      >
        <LogOut size={20} className="group-hover:text-red-500 transition-colors" />
        <span className="font-medium">Sair</span>
      </button>
    </div>
  );
}