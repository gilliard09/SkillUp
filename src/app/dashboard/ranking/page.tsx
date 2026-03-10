'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { 
  Trophy, Medal, Crown, Loader2, User,
  TrendingUp, Instagram, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

export default function RankingPage() {
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [alreadySharedToday, setAlreadySharedToday] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const getLevel = (xp: number) => {
    if (xp >= 5000) return { name: "Lendário Digital", color: "text-purple-400", bg: "bg-purple-400/10" };
    if (xp >= 4000) return { name: "Mestre Tech", color: "text-orange-400", bg: "bg-orange-400/10" };
    if (xp >= 3000) return { name: "Especialista Digital", color: "text-blue-400", bg: "bg-blue-400/10" };
    if (xp >= 2000) return { name: "Criador de Soluções", color: "text-emerald-400", bg: "bg-emerald-400/10" };
    if (xp >= 1000) return { name: "Desenvolvedor Iniciante", color: "text-brand-primary", bg: "bg-brand-primary/10" };
    return { name: "Explorador Digital", color: "text-slate-400", bg: "bg-slate-400/10" };
  };

  async function fetchRanking() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, xp')
      .order('xp', { ascending: false, nullsFirst: false })
      .limit(10);
    if (data) setTopUsers(data);
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchRanking();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setCurrentUser(profile);
          // Verifica se a data de hoje é igual à gravada no banco
          const today = new Date().toISOString().split('T')[0];
          if (profile.last_share_date === today) {
            setAlreadySharedToday(true);
          }
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleShareBonus = async () => {
    if (!currentUser || sharing || alreadySharedToday) return;
    
    setSharing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const novoXp = (currentUser.xp || 0) + 20;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          xp: novoXp,
          last_share_date: today // Grava que ele já ganhou hoje
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setMessage({ type: 'success', text: "Incrível! +20 XP adicionados. Volte amanhã!" });
      setAlreadySharedToday(true);
      setCurrentUser({ ...currentUser, xp: novoXp });
      await fetchRanking();

      window.open('https://www.instagram.com', '_blank');

    } catch (err) {
      setMessage({ type: 'error', text: "Erro ao processar bônus." });
    } finally {
      setSharing(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen pb-32 bg-slate-90 px-4 pt-10 font-sans">
      {/* Notificação Pop-up */}
      {message && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-2xl border shadow-2xl animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
          <div className="flex items-center gap-3 font-bold uppercase text-[10px] tracking-widest">
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-primary/20 blur-[100px] -z-10" />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex p-5 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[2rem] mb-6 shadow-xl shadow-orange-600/20">
          <Trophy className="text-white" size={40} />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
          Hall da <span className="text-brand-primary">Fama</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Os alunos mais brabos da SkillUp</p>
      </div>

      {/* Lista do Ranking */}
      <div className="max-w-3xl mx-auto space-y-4">
        {topUsers.map((user, index) => {
          const isTop3 = index < 3;
          const level = getLevel(user.xp || 0);
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-4 md:p-6 rounded-[2.5rem] border ${
                index === 0 ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/5 bg-slate-900/40'
              } backdrop-blur-md`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 text-center">
                  {index === 0 ? <Crown className="text-yellow-500 mx-auto" size={28} /> : <span className="text-slate-600 font-black italic text-lg">#{index + 1}</span>}
                </div>
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border ${isTop3 ? 'border-white/20 bg-white/10' : 'border-white/5 bg-slate-800'}`}>
                  <User size={20} className="text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-black text-sm md:text-lg italic uppercase text-white leading-tight">{user.full_name}</h3>
                  <div className="flex mt-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase italic ${level.bg} ${level.color}`}>{level.name}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl md:text-3xl font-black italic text-white tracking-tighter">{user.xp?.toLocaleString()}</span>
                <p className="text-[8px] font-black text-slate-500 uppercase">XP Total</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* BOTÃO DE BÔNUS DIÁRIO */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto mt-10 flex flex-col items-center gap-4">
        <button 
          onClick={handleShareBonus}
          disabled={sharing || alreadySharedToday || !currentUser}
          className={`group flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black uppercase text-xs italic tracking-[0.15em] transition-all shadow-xl shadow-pink-600/10
            ${alreadySharedToday 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
              : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:scale-105 active:scale-95'
            }`}
        >
          {alreadySharedToday ? <Clock size={18} /> : sharing ? <Loader2 className="animate-spin" size={18} /> : <Instagram size={18} />}
          <span>{alreadySharedToday ? 'Bônus coletado hoje' : sharing ? 'Processando...' : 'Compartilhe e ganhe 20xp'}</span>
          {!alreadySharedToday && !sharing && (
            <div className="bg-white/20 px-2 py-1 rounded-lg text-[9px] ml-2">+20 XP</div>
          )}
        </button>
        {alreadySharedToday && (
          <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest animate-pulse">
            Você pode ganhar mais XP amanhã!
          </p>
        )}
      </motion.div>

      {/* Dica de Mestre */}
      <div className="max-w-3xl mx-auto mt-16 p-8 rounded-[3rem] bg-slate-900/30 border border-white/5 flex items-center gap-6">
        <div className="p-4 bg-brand-primary rounded-2xl shadow-lg shadow-brand-primary/20">
          <TrendingUp className="text-white" size={24} />
        </div>
        <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed">
          O ranking é atualizado conforme você estuda. Cada aula concluída na <span className="text-white font-bold">SkillUp</span> te coloca mais perto do topo!
        </p>
      </div>
    </div>
  );
}