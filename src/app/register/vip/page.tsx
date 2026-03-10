'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Zap, User, Mail, Lock, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// 1. Criamos um componente interno para isolar a lógica que usa useSearchParams
function VipRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId'); // Pega o ID da URL

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      const userId = authData.user.id;

      await supabase.from('profiles').upsert({
        id: userId,
        full_name: formData.fullName,
        xp: 0
      });

      if (courseId) {
        await supabase.from('enrollments').insert({
          user_id: userId,
          product_id: courseId
        });
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);

    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
          <div className="h-20 w-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase italic">Acesso Liberado!</h1>
          <p className="text-slate-400">Seu perfil foi criado e o curso já está na sua conta.<br/>Redirecionando para o login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-primary/10 via-transparent to-transparent -z-10" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 mb-4">
            <Zap size={14} className="text-brand-primary fill-brand-primary" />
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest italic">Convite VIP Ativo</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Crie sua Conta</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Preencha os dados para destravar seu treinamento.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome Completo</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-primary transition-colors" size={20} />
              <input 
                required
                type="text"
                placeholder="Ex: Jeferson Silva"
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-brand-primary/50 transition-all"
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Seu Melhor E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-primary transition-colors" size={20} />
              <input 
                required
                type="email"
                placeholder="seu@email.com"
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-brand-primary/50 transition-all"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Crie uma Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-primary transition-colors" size={20} />
              <input 
                required
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-brand-primary/50 transition-all"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{error}</p>}

          <Button 
            disabled={loading}
            className="w-full h-16 bg-white text-slate-950 hover:bg-brand-primary hover:text-white font-black text-lg rounded-2xl transition-all shadow-xl active:scale-95 uppercase italic"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Finalizar Cadastro'}
          </Button>
        </form>

        <p className="mt-8 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">
          Já tem conta? <Link href="/login" className="text-brand-primary hover:underline">Fazer Login</Link>
        </p>
      </div>
    </div>
  );
}

// 2. Exportação principal envolvida no Suspense
export default function VipRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    }>
      <VipRegisterForm />
    </Suspense>
  );
}