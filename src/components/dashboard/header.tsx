'use client';

import { motion } from 'framer-motion';
import { Trophy, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeaderProps {
  userName?: string;
  level?: string;
  xp?: number;
  progress?: number;
}

export function DashboardHeader({
  userName = 'Explorador',
  level = 'Explorador Digital',
  xp = 0,
  progress = 0,
}: HeaderProps) {
  // Evita hydration mismatch na formatação de números
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">

      {/* Lado Esquerdo: Saudação e Barra de Nível */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <div className="space-y-1">
          <p className="text-slate-400 text-sm font-medium tracking-wide">Bem-vindo de volta,</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Olá, {userName}! 👋
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Badge de nível — whitespace-nowrap evita quebra de linha */}
          <span className="
            bg-brand-primary/20 text-brand-primary text-[10px] font-bold
            px-3 py-1 rounded-full border border-brand-primary/30
            uppercase tracking-wide whitespace-nowrap flex-shrink-0
          ">
            {level}
          </span>

          {/* Barra de progresso */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-28 md:w-48 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5 flex-shrink-0">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary shadow-[0_0_12px_rgba(124,58,237,0.4)]"
              />
            </div>
            <span className="text-[10px] text-slate-500 font-bold flex-shrink-0">
              {progress}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Lado Direito: XP e Notificações */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-4 flex-shrink-0"
      >
        {/* Card de XP */}
        <div className="bg-slate-900/40 border border-white/10 p-4 rounded-3xl backdrop-blur-md flex items-center gap-4 hover:border-brand-primary/30 transition-colors group">
          <div className="h-11 w-11 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform flex-shrink-0">
            <Trophy size={22} />
          </div>
          <div className="pr-2 text-left">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">
              Seu XP
            </p>
            <p
              suppressHydrationWarning
              className="text-2xl font-black text-white leading-none"
            >
              {mounted ? xp.toLocaleString('pt-BR') : xp}
            </p>
          </div>
        </div>

        {/* Botão de Notificação */}
        <button className="h-14 w-14 flex-shrink-0 bg-slate-900/40 border border-white/10 rounded-3xl flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all relative">
          <Bell size={22} />
          <span className="absolute top-3 right-3 h-2 w-2 bg-brand-primary rounded-full shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
        </button>
      </motion.div>

    </div>
  );
}