'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Trophy,
  Award,
  Calendar,
  Mail,
  Loader2,
  ChevronRight,
  LogOut,
  Zap,
  X,
  Check,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============================================================
// CONFIGURAÇÕES
// ============================================================
const COMMUNITY_LINK = 'https://forms.gle/ayLCiNnUQ1Qhexuz6';

// ============================================================
// TIPOS
// ============================================================
type Profile = {
  id: string;
  full_name: string | null;
  xp: number;
  created_at: string | null;
};

type Stats = {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
};

type Level = {
  min: number;
  name: string;
  color: string;
  bg: string;
};

// ============================================================
// CONSTANTES — fora do componente, tipadas
// ============================================================
const LEVELS: Level[] = [
  { min: 5000, name: 'Lendário Digital',       color: 'text-purple-400',    bg: 'bg-purple-400/10'    },
  { min: 4000, name: 'Mestre Tech',             color: 'text-orange-400',    bg: 'bg-orange-400/10'    },
  { min: 3000, name: 'Especialista Digital',    color: 'text-blue-400',      bg: 'bg-blue-400/10'      },
  { min: 2000, name: 'Criador de Soluções',     color: 'text-emerald-400',   bg: 'bg-emerald-400/10'   },
  { min: 1000, name: 'Desenvolvedor Iniciante', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  { min: 0,    name: 'Explorador Digital',      color: 'text-slate-400',     bg: 'bg-slate-400/10'     },
];

// ============================================================
// COMPONENTE
// ============================================================
export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName]       = useState('');
  const [userEmail, setUserEmail]   = useState<string | null>(null);
  const [profile, setProfile]       = useState<Profile | null>(null);
  const [stats, setStats]           = useState<Stats>({
    totalLessons: 0,
    completedLessons: 0,
    progressPercentage: 0,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // ----------------------------------------------------------
  // NÍVEL — memoizado
  // ----------------------------------------------------------
  const currentLevel = useMemo(
    () => LEVELS.find(l => (profile?.xp ?? 0) >= l.min) ?? LEVELS[LEVELS.length - 1],
    [profile?.xp]
  );

  // ----------------------------------------------------------
  // CARREGAMENTO — Promise.all onde possível
  // ----------------------------------------------------------
  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Email vem do auth, não da tabela profiles
      setUserEmail(user.email ?? null);

      // Paralela: perfil + matrículas
      const [profileRes, enrollmentsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('enrollments').select('product_id').eq('user_id', user.id),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
        setNewName(profileRes.data.full_name ?? '');
      }

      const courseIds = enrollmentsRes.data?.map(e => e.product_id) ?? [];

      if (courseIds.length > 0) {
        // Busca módulos dos cursos matriculados
        const { data: modulesData } = await supabase
          .from('modules')
          .select('id')
          .in('course_id', courseIds);

        const moduleIds = modulesData?.map(m => m.id) ?? [];

        if (moduleIds.length > 0) {
          // Paralela: total de aulas + aulas concluídas (filtradas pelos módulos matriculados)
          const [totalRes, completedRes] = await Promise.all([
            supabase
              .from('lessons')
              .select('id')
              .in('module_id', moduleIds),

            // Filtra progresso apenas pelas aulas dos cursos matriculados
            supabase
              .from('lesson_progress')
              .select('lesson_id')
              .eq('user_id', user.id)
              .eq('is_completed', true)
              .in(
                'lesson_id',
                // subquery simulada: busca apenas lesson_ids válidos
                (await supabase.from('lessons').select('id').in('module_id', moduleIds)).data?.map(l => l.id) ?? []
              ),
          ]);

          const total     = totalRes.data?.length ?? 0;
          const completed = completedRes.data?.length ?? 0;

          setStats({
            totalLessons: total,
            completedLessons: completed,
            progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // ----------------------------------------------------------
  // ATUALIZAR NOME
  // ----------------------------------------------------------
  const handleUpdateName = async () => {
    if (!newName.trim() || newName === profile?.full_name) {
      setIsModalOpen(false);
      return;
    }

    try {
      setUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName.trim() })
        .eq('id', profile!.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, full_name: newName.trim() } : prev);
      setIsModalOpen(false);
      notify('success', 'Nome atualizado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao atualizar nome:', err.message);
      notify('error', 'Erro ao salvar. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ----------------------------------------------------------
  // LOADING — herda bg do layout
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-brand-primary">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER — sem bg e sem min-h-screen, herda do DashboardLayout
  // ----------------------------------------------------------
  return (
    <div className="pb-20 px-4 md:px-10 lg:px-20 max-w-7xl mx-auto">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 font-bold uppercase text-xs ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                : 'bg-red-500/10 border-red-500 text-red-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-black text-white italic uppercase mb-2">Editar Nome</h2>
              <p className="text-slate-500 text-sm mb-6 font-medium">
                Como você deseja ser chamado na plataforma?
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-brand-primary ml-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateName()}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-brand-primary transition-colors"
                    placeholder="Seu nome aqui..."
                  />
                </div>

                <button
                  onClick={handleUpdateName}
                  disabled={updating}
                  className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <><Check size={16} /> Salvar Alterações</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header do Perfil */}
      <div className="relative mb-10 pt-10">
        <div className="h-48 w-full bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-[2rem] absolute top-0 left-0 -z-10 blur-2xl" />

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-2xl bg-slate-900 border-2 border-white/5 flex items-center justify-center overflow-hidden shadow-xl transition-all group-hover:border-brand-primary/50">
              <User size={50} className="text-brand-primary/50" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-brand-primary p-2 rounded-lg shadow-lg">
              <Zap size={16} className="text-white fill-current" />
            </div>
          </div>

          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tight">
              {profile?.full_name ?? 'Seu Nome'}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
              {/* Email vem do auth.users, não de profiles */}
              {userEmail && (
                <span className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                  <Mail size={14} className="text-brand-primary" /> {userEmail}
                </span>
              )}
              <span className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                <Calendar size={14} className="text-brand-primary" />
                Membro desde{' '}
                {profile?.created_at
                  ? new Date(profile.created_at).getFullYear()
                  : '---'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ------------------------------------------------
            COLUNA PRINCIPAL
        ------------------------------------------------ */}
        <div className="lg:col-span-8 space-y-6">

          {/* Card de Progresso */}
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-white font-bold text-lg uppercase italic tracking-wider">Progresso</h2>
                <p className="text-slate-500 text-xs font-medium">
                  Concluído: {stats.completedLessons} / {stats.totalLessons} aulas
                </p>
              </div>
              <span className="text-3xl font-black text-brand-primary italic">
                {stats.progressPercentage}%
              </span>
            </div>

            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-6 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progressPercentage}%` }}
                transition={{ duration: 0.8, ease: 'circOut' }}
                className="h-full bg-brand-primary rounded-full shadow-[0_0_15px_rgba(255,107,0,0.3)]"
              />
            </div>

            {stats.progressPercentage >= 100 ? (
              <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="text-brand-primary" size={20} />
                  <span className="text-white text-xs font-bold uppercase">Certificado Liberado!</span>
                </div>
                <button className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase hover:scale-105 transition-all">
                  Emitir
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-slate-600 uppercase font-bold text-center tracking-widest">
                Complete 100% para o certificado
              </p>
            )}
          </div>

          {/* XP e Nível */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex flex-col items-center text-center">
              <div className="p-3 bg-brand-primary/10 rounded-xl mb-3">
                <Trophy className="text-brand-primary" size={24} />
              </div>
              <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">XP Total</h3>
              <p className="text-2xl font-black text-white italic">
                {(profile?.xp ?? 0).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex flex-col items-center text-center">
              <div className={`p-3 ${currentLevel.bg} rounded-xl mb-3`}>
                <Zap className={currentLevel.color} size={24} fill="currentColor" />
              </div>
              <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Patente</h3>
              <p className={`text-sm font-black italic uppercase ${currentLevel.color}`}>
                {currentLevel.name}
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------
            SIDEBAR DIREITA
        ------------------------------------------------ */}
        <div className="lg:col-span-4 space-y-6">

          {/* Ações */}
          <div className="bg-slate-900/40 border border-white/5 p-2 rounded-3xl backdrop-blur-md">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all group text-sm"
            >
              <div className="flex items-center gap-3">
                <User size={18} className="text-slate-400 group-hover:text-brand-primary transition-colors" />
                <span className="text-white font-bold">Editar Perfil</span>
              </div>
              <ChevronRight size={16} className="text-slate-700" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 rounded-2xl transition-all group text-sm"
            >
              <div className="flex items-center gap-3">
                <LogOut size={18} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                <span className="text-white font-bold">Sair</span>
              </div>
            </button>
          </div>

          {/* Card de Indicação */}
          <div className="p-6 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl relative overflow-hidden group shadow-xl shadow-brand-primary/20">
            <div className="relative z-10">
              <h3 className="text-white font-black text-xl italic uppercase leading-tight">
                Indique amigos e<br />GANHE PRÊMIOS!
              </h3>
              <a
                href={COMMUNITY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 bg-white text-slate-950 px-5 py-2.5 rounded-xl font-black uppercase text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <MessageCircle size={14} />
                Indicar amigos
              </a>
            </div>
            <Trophy
              size={80}
              className="absolute -right-4 -bottom-4 opacity-20 rotate-12 text-white group-hover:scale-110 transition-transform"
            />
          </div>
        </div>
      </div>
    </div>
  );
}