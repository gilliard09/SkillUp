'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Zap, User, Mail, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ============================================================
// HELPER — traduz erros do Supabase para PT-BR
// ============================================================
function translateError(message: string): string {
  if (message.includes('User already registered'))
    return 'Este e-mail já está cadastrado. Faça login.';
  if (message.includes('Password should be at least'))
    return 'A senha deve ter no mínimo 6 caracteres.';
  if (message.includes('Invalid email'))
    return 'E-mail inválido.';
  if (message.includes('Email rate limit'))
    return 'Muitas tentativas. Aguarde alguns minutos.';
  return 'Erro ao realizar cadastro. Tente novamente.';
}

// ============================================================
// FORMULÁRIO — isolado para usar useSearchParams com Suspense
// ============================================================
function VipRegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const courseId     = searchParams.get('courseId');
  const orgId        = searchParams.get('orgId'); // NOVA MUDANÇA: Captura a escola

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email:    '',
    password: '',
  });

  const updateField = (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      setError(null); 
    };

  // ----------------------------------------------------------
  // VALIDAÇÕES LOCAIS
  // ----------------------------------------------------------
  const validate = (): string | null => {
    if (formData.fullName.trim().length < 2)
      return 'Digite seu nome completo.';
    if (formData.password.length < 6)
      return 'A senha deve ter no mínimo 6 caracteres.';
    if (!courseId)
      return 'Link de convite inválido ou sem curso associado.';
    if (!orgId)
      return 'Este link não possui um identificador de escola válido.'; // NOVA VALIDAÇÃO
    return null;
  };

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Cria usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    formData.email,
        password: formData.password,
        options:  { data: { full_name: formData.fullName } },
      });

      if (authError) throw new Error(translateError(authError.message));
      if (!authData.user) throw new Error('Erro ao criar usuário.');

      
      const userId = authData.user.id;

      // 2. Cria perfil — NOVA MUDANÇA: Agora inclui o organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          full_name: formData.fullName, 
          xp: 0,
          organization_id: orgId // Vincula o aluno à escola automaticamente
        });

      if (profileError) throw new Error('Erro ao criar perfil na escola.');

      // 3. Matrícula no curso
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({ user_id: userId, product_id: courseId });

      if (enrollError) throw new Error('Erro ao matricular no curso.');

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);

    } catch (err: any) {
      setError(err.message ?? 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // TELA DE SUCESSO
  // ----------------------------------------------------------
  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div className="h-20 w-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase italic">Acesso Liberado!</h1>
          <p className="text-slate-400 leading-relaxed">
            Seu perfil foi criado e você já está vinculado à escola.
            <br />
            Redirecionando...
          </p>
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-brand-primary" size={24} />
          </div>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // AVISO DE LINK INVÁLIDO (Course ou Org faltando)
  // ----------------------------------------------------------
  if (!courseId || !orgId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div className="h-20 w-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase italic">Convite Incompleto</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Este link de convite não possui todas as informações necessárias (Escola ou Curso).
            Solicite um novo link VIP.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-brand-primary text-white font-bold rounded-2xl hover:bg-brand-primary/90 transition-all"
          >
            Ir para o Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-primary/10 via-transparent to-transparent -z-10 pointer-events-none" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 mb-4">
            <Zap size={14} className="text-brand-primary fill-brand-primary" />
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest italic">
              Convite VIP Ativo
            </span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
            Crie sua Conta
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            Preencha os dados para destravar seu treinamento.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-xs font-bold mb-6"
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
              Nome Completo
            </label>
            <div className="relative group">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-primary transition-colors"
                size={20}
              />
              <input
                required
                type="text"
                placeholder="Ex: Jeferson Silva"
                value={formData.fullName}
                onChange={updateField('fullName')}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-brand-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
              Seu Melhor E-mail
            </label>
            <div className="relative group">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-primary transition-colors"
                size={20}
              />
              <input
                required
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={updateField('email')}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-brand-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
              Crie uma Senha
            </label>
            <div className="relative group">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-primary transition-colors"
                size={20}
              />
              <input
                required
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={updateField('password')}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-brand-primary/50 transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-white text-slate-950 hover:bg-brand-primary hover:text-white font-black text-lg rounded-2xl transition-all shadow-xl active:scale-95 uppercase italic mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={22} /> : 'Finalizar Cadastro'}
          </Button>
        </form>

        <p className="mt-8 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand-primary hover:underline">
            Fazer Login
          </Link>
        </p>
      </div>
    </div>
  );
}

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