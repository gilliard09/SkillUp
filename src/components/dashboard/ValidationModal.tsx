'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface ValidationModalProps { isOpen: boolean; onClose: () => void; onSuccess: (result: any) => void; lessonId: string; }

export function ValidationModal({ isOpen, onClose, onSuccess, lessonId }: ValidationModalProps) {
  const [pin, setPin] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!pin.trim()) return; setLoading(true); setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('complete_lesson_secure', { p_lesson_id: lessonId, p_validation_pin: pin.trim() });
      if (rpcError) throw rpcError;
      setPin(''); onSuccess(data); onClose();
    } catch (err: any) { setError(err?.message?.replace(/^.*?: /, '') || 'Não foi possível validar a aula.'); setPin(''); }
    finally { setLoading(false); }
  };
  const close = () => { setPin(''); setError(null); onClose(); };
  return <AnimatePresence>{isOpen && <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={close} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
    <motion.div initial={{scale:.9,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}} exit={{scale:.9,opacity:0,y:20}} className="relative w-full max-w-sm bg-slate-900 border border-white/10 p-8 rounded-[3rem] shadow-2xl">
      <button onClick={close} className="absolute top-6 right-6 text-slate-500 hover:text-white p-2 rounded-xl hover:bg-white/5"><X size={18}/></button>
      <div className="flex justify-center mb-6"><div className="h-16 w-16 bg-brand-primary/10 border border-brand-primary/20 rounded-[1.5rem] flex items-center justify-center"><ShieldCheck className="text-brand-primary" size={32}/></div></div>
      <div className="text-center mb-8"><h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Validação do Professor</h2><p className="text-slate-400 text-sm leading-relaxed">O professor deve digitar o PIN de validação. O PIN é verificado com segurança no servidor.</p></div>
      {error && <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-xs font-bold mb-6"><AlertCircle size={14}/>{error}</div>}
      <form onSubmit={handleValidate} className="space-y-4"><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/><input type="password" value={pin} onChange={e=>{setPin(e.target.value);setError(null)}} placeholder="PIN do professor" autoComplete="off" autoFocus className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary/50 font-bold tracking-widest"/></div><Button type="submit" disabled={loading || !pin.trim()} className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase italic rounded-2xl disabled:opacity-50">{loading?<Loader2 className="animate-spin" size={20}/>: 'Validar e concluir'}</Button></form>
    </motion.div></div>}</AnimatePresence>;
}
