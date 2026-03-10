'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Sword, 
  Trophy, 
  User, 
  LayoutGrid 
} from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  // Definição dos itens de navegação atualizados
  const menuItems = [
    { 
      icon: LayoutGrid, 
      label: 'Início', 
      href: '/dashboard' 
    },
    { 
      icon: Sword, 
      label: 'Desafios', 
      href: '/dashboard/challenges' 
    },
    { 
      icon: Trophy, 
      label: 'Ranking', 
      href: '/dashboard/ranking' 
    },
    { 
      icon: User, 
      label: 'Perfil', 
      href: '/dashboard/profile' 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
      <div className="bg-slate-950/80 backdrop-blur-xl border-t border-white/5 px-4 py-3 pb-8 flex justify-around items-center">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
            >
              <div className={`
                relative p-2 rounded-2xl transition-all duration-300
                ${isActive 
                  ? 'bg-brand-primary text-white shadow-[0_0_20px_rgba(255,107,0,0.4)]' 
                  : 'text-slate-500 hover:text-slate-300'
                }
              `}>
                <item.icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                  </span>
                )}
              </div>

              <span className={`
                text-[10px] font-black uppercase tracking-widest transition-colors duration-300
                ${isActive ? 'text-brand-primary' : 'text-slate-600'}
              `}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}