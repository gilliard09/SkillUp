'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, X, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Definição da interface para os estilos dinâmicos
interface LevelConfig {
  name: string;
  color: string;
  bg: string;
  border: string;
}

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelData: LevelConfig; // Passamos o objeto completo do nível agora
}

export function LevelUpModal({ isOpen, onClose, levelData }: LevelUpModalProps) {
  // Adicione essa verificação logo no início do componente
if (!levelData) return null; 

const { name, color, bg, border } = levelData;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop com desfoque profundo */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
          />

          {/* Card do Modal */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center overflow-hidden"
          >
            {/* Efeito de Brilho Dinâmico ao Fundo baseado na cor do nível */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 opacity-20 rounded-full blur-[80px] -z-10 ${color.replace('text', 'bg')}`} />

            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Aro giratório dinâmico */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className={`absolute -inset-6 border-2 border-dashed rounded-full opacity-30 ${color}`}
                />
                
                {/* Container do Troféu com Gradiente Dinâmico */}
                <motion.div 
                  initial={{ rotate: -20, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className={`h-28 w-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 bg-gradient-to-br from-slate-800 to-slate-950 border ${border}`}
                >
                  <Trophy size={56} className={`${color} drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`} />
                </motion.div>

                {/* Pequenos brilhos extras */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`absolute -top-2 -right-2 ${color}`}
                >
                  <Sparkles size={24} />
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-4xl font-black text-white mb-2 italic uppercase tracking-tighter">
                Novo Nível!
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed font-medium">
                Sua dedicação na escola de tecnologia e na jornada de pregação te levou mais longe.
              </p>

              {/* Badge Dinâmico */}
              <div className={`${bg} ${border} border p-5 rounded-[2rem] mb-8 relative group`}>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] block mb-2 opacity-70 ${color}`}>
                  Badge Desbloqueado
                </span>
                <h3 className={`text-2xl font-black flex items-center justify-center gap-3 ${color}`}>
                  <Zap className="fill-current" size={24} />
                  <span className="italic uppercase">{name}</span>
                </h3>
              </div>

              <Button 
                onClick={onClose}
                className="w-full h-16 bg-white text-slate-950 hover:bg-brand-primary hover:text-white font-black text-xl rounded-2xl transition-all shadow-2xl active:scale-95 uppercase italic"
              >
                Continuar Jornada
              </Button>
            </motion.div>

            {/* Partículas Decorativas Flutuantes */}
            <motion.div 
              animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity }}
              className={`absolute top-10 left-10 ${color}`}
            >
              <Star size={20} fill="currentColor" />
            </motion.div>

            <motion.div 
              animate={{ y: [0, 20, 0], opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className={`absolute bottom-20 right-10 ${color}`}
            >
              <Star size={16} fill="currentColor" />
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}