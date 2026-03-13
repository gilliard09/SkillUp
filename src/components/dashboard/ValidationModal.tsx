'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ValidationModal({ isOpen, onClose, onSuccess }: ValidationModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Busca a senha salva no banco
      const { data, error: fetchError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'validation_password')
        .single();

      if (fetchError || !data) throw new Error('Erro ao validar. Tente novamente.');

      if (password.trim() !== data.value) {
        setError('Senha incorreta. Peça ao professor para validar.');
        setPassword('');
        return;
      }

      // Senha correta — fecha modal e dispara conclusão
      setPassword('');
      onSuccess();
      onClose();

    } catch (err: any) {
      setError(err.message ?? 'Erro ao validar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm bg-slate-900 border border-white/10 p-8 rounded-[3rem] shadow-2xl"
          >
            {/* Botão fechar */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5"
            >
              <X size={18} />
            </button>

            {/* Ícone */}
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-brand-primary/10 border border-brand-primary/20 rounded-[1.5rem] flex items-center justify-center">
                <ShieldCheck className="text-brand-primary" size={32} />
              </div>
            </div>

            {/* Texto */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
                Validação do Professor
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Peça ao professor para digitar a senha de validação da aula.
              </p>
            </div>

            {/* Erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-xs font-bold mb-6"
              >
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleValidate} className="space-y-4">
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  placeholder="Senha do professor"
                  autoComplete="off"
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary/50 transition-all font-bold tracking-widest"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !password.trim()}
                className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase italic rounded-2xl transition-all active:scale-95 disabled:opacity-50"
              >
                {loading
                  ? <Loader2 className="animate-spin" size={20} />
                  : 'Confirmar Conclusão'
                }
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}