'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  Trophy, Crown, Loader2, User,
  TrendingUp, Instagram, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type RankUser = {
  id: string;
  full_name: string | null;
  xp: number | null;
};

type CurrentUser = {
  id: string;
  full_name: string | null;
  xp: number;
  last_share_date: string | null;
};

type Level = {
  name: string;
  color: string;
  bg: string;
};

// ============================================================
// CONSTANTES — fora do componente
// ============================================================
const LEVELS: { min: number } & Level[] = [
  { min: 5000, name: 'Lendário Digital',       color: 'text-purple-400',    bg: 'bg-purple-400/10'    },
  { min: 4000, name: 'Mestre Tech',             color: 'text-orange-400',    bg: 'bg-orange-400/10'    },
  { min: 3000, name: 'Especialista Digital',    color: 'text-blue-400',      bg: 'bg-blue-400/10'      },
  { min: 2000, name: 'Criador de Soluções',     color: 'text-emerald-400',   bg: 'bg-emerald-400/10'   },
  { min: 1000, name: 'Desenvolvedor Iniciante', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  { min: 0,    name: 'Explorador Digital',      color: 'text-slate-400',     bg: 'bg-slate-400/10'     },
] as any;

function getLevel(xp: number): Level {
  return (LEVELS as any[]).find((l: any) => xp >= l.min) ?? (LEVELS as any[])[5];
}

const SHARE_XP_BONUS = 20;
const INSTAGRAM_URL  = 'https://www.instagram.com/tecnologge'; // ← coloque o perfil da escola

// ============================================================
// COMPONENTE
// ============================================================
export default function RankingPage() {
  const router = useRouter();

  const [loading, setLoading]                   = useState(true);
  const [sharing, setSharing]                   = useState(false);
  const [topUsers, setTopUsers]                 = useState<RankUser[]>([]);
  const [currentUser, setCurrentUser]           = useState<CurrentUser | null>(null);
  const [alreadySharedToday, setAlreadySharedToday] = useState(false);
  const [message, setMessage]                   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ----------------------------------------------------------
  // FETCH RANKING
  // ----------------------------------------------------------
  const fetchRanking = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, xp')
      .order('xp', { ascending: false, nullsFirst: false })
      .limit(10);

    if (data) setTopUsers(data as RankUser[]);
  }, []);

  // ----------------------------------------------------------
  // INIT — paralelo com Promise.all
  // ----------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Paralelo: ranking + perfil do usuário
        const [, profileRes] = await Promise.all([
          fetchRanking(),
          supabase
            .from('profiles')
            .select('id, full_name, xp, last_share_date')
            .eq('id', user.id)
            .single(),
        ]);

        if (profileRes.data) {
          const profile = profileRes.data as CurrentUser;
          setCurrentUser(profile);

          const today = new Date().toISOString().split('T')[0];
          if (profile.last_share_date === today) {
            setAlreadySharedToday(true);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [fetchRanking, router]);

  // ----------------------------------------------------------
  // BÔNUS DE COMPARTILHAMENTO — proteção dupla (estado + banco)
  // ----------------------------------------------------------
  const handleShareBonus = async () => {
    if (!currentUser || sharing || alreadySharedToday) return;

    setSharing(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Verifica no banco antes de creditar (proteção contra dupla aba)
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('xp, last_share_date')
        .eq('id', currentUser.id)
        .single();

      if (freshProfile?.last_share_date === today) {
        setAlreadySharedToday(true);
        notify('error', 'Você já coletou o bônus hoje.');
        return;
      }

      // 2. Credita XP
      const novoXp = (freshProfile?.xp ?? currentUser.xp) + SHARE_XP_BONUS;

      const { error } = await supabase
        .from('profiles')
        .update({ xp: novoXp, last_share_date: today })
        .eq('id', currentUser.id);

      if (error) throw error;

      // 3. Atualiza estado local
      setAlreadySharedToday(true);
      setCurrentUser({ ...currentUser, xp: novoXp });
      notify('success', `Incrível! +${SHARE_XP_BONUS} XP adicionados. Volte amanhã!`);

      // 4. Atualiza ranking e abre Instagram
      await fetchRanking();
      window.open(INSTAGRAM_URL, '_blank');

    } catch {
      notify('error', 'Erro ao processar bônus. Tente novamente.');
    } finally {
      setSharing(false);
    }
  };

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    // Sem bg-slate-950 nem min-h-screen — herda do DashboardLayout
    <div className="pb-8 px-4 pt-10 font-sans">

      {/* Toast */}
      {message && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-2xl border shadow-2xl animate-in slide-in-from-top-4 duration-300 flex items-center gap-3 font-bold uppercase text-[10px] tracking-widest ${
          message.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
            : 'bg-red-500/20 border-red-500 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-primary/20 blur-[100px] -z-10 pointer-events-none" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex p-5 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[2rem] mb-6 shadow-xl shadow-orange-600/20"
        >
          <Trophy className="text-white" size={40} />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
          Hall da <span className="text-brand-primary">Fama</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">
          Os alunos mais brabos da Tecnologge
        </p>
      </div>

      {/* Lista do Ranking */}
      <div className="max-w-3xl mx-auto space-y-4">
        {topUsers.map((user, index) => {
          const isTop3 = index < 3;
          const level  = getLevel(user.xp ?? 0);

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-4 md:p-6 rounded-[2.5rem] border backdrop-blur-md ${
                index === 0
                  ? 'border-yellow-500/50 bg-yellow-500/10'
                  : 'border-white/5 bg-slate-900/40'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Posição */}
                <div className="w-8 text-center flex-shrink-0">
                  {index === 0
                    ? <Crown className="text-yellow-500 mx-auto" size={28} />
                    : <span className="text-slate-600 font-black italic text-lg">#{index + 1}</span>
                  }
                </div>

                {/* Avatar */}
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border flex-shrink-0 ${
                  isTop3 ? 'border-white/20 bg-white/10' : 'border-white/5 bg-slate-800'
                }`}>
                  <User size={20} className="text-slate-400" />
                </div>

                {/* Nome + Nível */}
                <div className="flex flex-col min-w-0">
                  <h3 className="font-black text-sm md:text-lg italic uppercase text-white leading-tight truncate">
                    {user.full_name ?? 'Anônimo'}
                  </h3>
                  <span className={`mt-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase italic w-fit ${level.bg} ${level.color}`}>
                    {level.name}
                  </span>
                </div>
              </div>

              {/* XP */}
              <div className="text-right flex-shrink-0 ml-4">
                <span className="text-xl md:text-3xl font-black italic text-white tracking-tighter">
                  {(user.xp ?? 0).toLocaleString('pt-BR')}
                </span>
                <p className="text-[8px] font-black text-slate-500 uppercase">XP Total</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bônus Diário */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto mt-10 flex flex-col items-center gap-4"
      >
        <button
          onClick={handleShareBonus}
          disabled={sharing || alreadySharedToday || !currentUser}
          className={`group flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black uppercase text-xs italic tracking-[0.15em] transition-all shadow-xl ${
            alreadySharedToday
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-pink-600/20'
          }`}
        >
          {alreadySharedToday
            ? <Clock size={18} />
            : sharing
              ? <Loader2 className="animate-spin" size={18} />
              : <Instagram size={18} />
          }
          <span>
            {alreadySharedToday
              ? 'Bônus coletado hoje'
              : sharing
                ? 'Processando...'
                : 'Compartilhe e ganhe XP'
            }
          </span>
          {!alreadySharedToday && !sharing && (
            <div className="bg-white/20 px-2 py-1 rounded-lg text-[9px] ml-2">
              +{SHARE_XP_BONUS} XP
            </div>
          )}
        </button>

        {alreadySharedToday && (
          <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest animate-pulse">
            Você pode ganhar mais XP amanhã!
          </p>
        )}
      </motion.div>

      {/* Dica */}
      <div className="max-w-3xl mx-auto mt-16 p-8 rounded-[3rem] bg-slate-900/30 border border-white/5 flex items-center gap-6">
        <div className="p-4 bg-brand-primary rounded-2xl shadow-lg shadow-brand-primary/20 flex-shrink-0">
          <TrendingUp className="text-white" size={24} />
        </div>
        <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed">
          O ranking é atualizado conforme você estuda. Cada aula concluída na{' '}
          <span className="text-white font-bold">Tecnologge</span> te coloca mais perto do topo!
        </p>
      </div>
    </div>
  );
}