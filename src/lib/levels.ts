import { Trophy, Code, Cpu, Monitor, Zap, Star } from 'lucide-react';

export const LEVEL_CONFIG = [
  { minXp: 5000, name: "Lendário Digital", level: 6, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Star },
  { minXp: 4000, name: "Mestre Tech", level: 5, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: Zap },
  { minXp: 3000, name: "Especialista Digital", level: 4, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Cpu },
  { minXp: 2000, name: "Criador de Soluções", level: 3, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Monitor },
  { minXp: 1000, name: "Desenvolvedor Iniciante", level: 2, color: "text-brand-primary", bg: "bg-brand-primary/10", border: "border-brand-primary/20", icon: Code },
  { minXp: 0,    name: "Explorador Digital", level: 1, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Trophy },
];

export function getLevelData(xp: number) {
  const current = LEVEL_CONFIG.find(config => xp >= config.minXp) || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
  const next = LEVEL_CONFIG.slice().reverse().find(config => config.minXp > xp);
  
  return {
    current,
    next,
    xpToNext: next ? next.minXp - xp : 0,
  };
}