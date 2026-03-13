'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LayoutGrid, Sword, Trophy, User, ShieldCheck } from 'lucide-react';

type NavItem = {
  icon: React.ElementType;
  label: string;
  href: string;
};

const BASE_ITEMS: NavItem[] = [
  { icon: LayoutGrid, label: 'Início',   href: '/dashboard' },
  { icon: Sword,      label: 'Desafios', href: '/dashboard/challenges' },
  { icon: Trophy,     label: 'Ranking',  href: '/dashboard/ranking' },
  { icon: User,       label: 'Perfil',   href: '/dashboard/profile' },
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

export function MobileNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('USER:', user?.id);
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      console.log('PROFILE:', profile);
      console.log('ERROR:', error);
      console.log('IS ADMIN:', profile?.role === 'admin');

      setIsAdmin(profile?.role === 'admin');
    };

    checkRole();
  }, []);

  const menuItems = isAdmin ? [...BASE_ITEMS, ADMIN_ITEM] : BASE_ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
      <div className="bg-slate-950/80 backdrop-blur-xl border-t border-white/5 px-2 py-3 pb-8 flex justify-around items-center">
        {menuItems.map((item) => {
          const isActive = isItemActive(item.href, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
            >
              <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-brand-primary text-white shadow-[0_0_20px_rgba(255,107,0,0.4)]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />

                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary" />
                  </span>
                )}
              </div>

              <span className={`text-[9px] font-black uppercase tracking-wider transition-colors duration-300 ${
                isActive ? 'text-brand-primary' : 'text-slate-600'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}