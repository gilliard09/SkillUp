'use client';

import { motion } from 'framer-motion';
import { Play, CheckCircle2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModuleCardProps {
  title: string;
  description: string;
  progress: number;
  // Ajustado para aceitar tanto com hífen quanto com underline, evitando erros
  status: 'concluido' | 'iniciado' | 'nao-iniciado' | 'nao_iniciado';
  lessonCount: number;
}

export function ModuleCard({ 
  title, 
  description, 
  progress, 
  status,
  lessonCount 
}: ModuleCardProps) {
  
  // Lógica para cores do Badge de Status
  const statusConfig = {
    'concluido': { label: 'Concluído', class: 'bg-green-500/10 text-green-500 border-green-500/20' },
    'iniciado': { label: 'Em Progresso', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    'nao-iniciado': { label: 'Não Iniciado', class: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
    'nao_iniciado': { label: 'Não Iniciado', class: 'bg-slate-500/10 text-slate-500 border-slate-500/20' }
  };

  // PROTEÇÃO: Se o status vier errado ou vazio, ele assume 'nao_iniciado' em vez de quebrar a tela
  const currentStatus = statusConfig[status] || statusConfig['nao_iniciado'];

  return (
    <motion.div 
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-7 backdrop-blur-sm hover:border-brand-primary/40 transition-all group relative overflow-hidden h-full flex flex-col"
    >
      {/* Detalhe de luz no topo para o efeito Premium */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex justify-between items-start mb-8">
        {/* Ícone com Container Estilizado */}
        <div className="h-14 w-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-lg shadow-brand-primary/5">
          {status === 'concluido' ? <CheckCircle2 size={28} /> : <Play size={28} fill="currentColor" />}
        </div>

        {/* Badge de Status - Agora usa o currentStatus com segurança */}
        <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border ${currentStatus.class}`}>
          {currentStatus.label}
        </span>
      </div>

      {/* Conteúdo do Texto */}
      <div className="space-y-2 mb-8 flex-grow">
        <h3 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-1">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
          <BookOpen size={14} />
          <span>{lessonCount} aulas disponíveis</span>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 pt-2 italic">
          {description || "Explore as aulas deste módulo para avançar ainda mais!"}
        </p>
      </div>

      {/* Barra de Progresso e Ação */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-slate-500">
            <span>Seu Progresso</span>
            <span className="text-brand-secondary">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800/50 rounded-full border border-white/5 p-[1px]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "anticipate" }}
              className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full relative"
            >
              <div className="absolute right-0 top-0 h-full w-2 bg-white blur-[4px] opacity-40" />
            </motion.div>
          </div>
        </div>

        <Button className="w-full bg-white text-slate-950 hover:bg-brand-primary hover:text-white h-14 rounded-2xl font-bold text-base transition-all shadow-xl shadow-black/20 active:scale-95 border-none">
          {progress === 0 ? 'Começar Agora' : progress === 100 ? 'Revisar Módulo' : 'Continuar Módulo'}
        </Button>
      </div>
    </motion.div>
  );
}