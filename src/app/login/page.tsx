'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import Image from 'next/image';

// ============================================================
// HELPER — traduz erros do Supabase para PT-BR
// ============================================================
function translateError(message: string): string {
  if (message.includes('Invalid login credentials'))
    return 'E-mail ou senha incorretos.';
  if (message.includes('Email not confirmed'))
    return 'Confirme seu e-mail antes de acessar.';
  if (message.includes('Too many requests'))
    return 'Muitas tentativas. Aguarde alguns minutos.';
  return 'Erro ao entrar. Tente novamente.';
}

// ============================================================
// COMPONENTE
// ============================================================
export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(translateError(authError.message));
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4 overflow-hidden font-sans">

      {/* Glows decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] z-10"
      >
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-slate-900 border border-white/10 rounded-3xl mb-4 shadow-2xl shadow-brand-primary/10">
            <Image
              src="/icons/icon.png"
              alt="SkillUp Logo"
              width={60}
              height={60}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
            SkillUp <span className="text-brand-primary">Tecnologge</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            A plataforma do futuro está aqui
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">

            {/* Mensagem de erro inline */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-xs font-bold"
                >
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Campo E-mail */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                E-mail de acesso
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-primary transition-colors"
                  size={18}
                />
                <Input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  required
                  autoComplete="email"
                  className="bg-slate-950/50 border-white/5 h-14 pl-12 rounded-2xl text-white placeholder:text-slate-600 focus:border-brand-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Sua senha
                </label>
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-[9px] font-bold text-brand-primary uppercase hover:underline"
                >
                  Esqueci a senha
                </button>
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-primary transition-colors"
                  size={18}
                />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  required
                  autoComplete="current-password"
                  className="bg-slate-950/50 border-white/5 h-14 pl-12 rounded-2xl text-white placeholder:text-slate-600 focus:border-brand-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Botão de Submit */}
            <Button
              type="submit"
              className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase italic tracking-widest rounded-2xl shadow-lg shadow-brand-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Autenticando...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Acessar Plataforma <ShieldCheck size={18} />
                </span>
              )}
            </Button>
          </form>

          {/* Footer do Card */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs font-medium">
              Ainda não faz parte da nossa escola?{' '}
              <a
                href="https://wa.me/seunumero"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary font-black ml-1 hover:underline uppercase tracking-tighter"
              >
                Matricule-se
              </a>
            </p>
          </div>
        </div>

        {/* Rodapé de segurança */}
        <p className="mt-8 text-center text-slate-600 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <ShieldCheck size={12} /> Conexão Segura e Criptografada
        </p>
      </motion.div>
    </div>
  );
}