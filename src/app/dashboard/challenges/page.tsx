'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, 
  Sword, 
  Star, 
  ChevronRight, 
  Zap,
  Target,
  Lock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubmitChallengeModal } from '@/components/dashboard/submitchallengemodal';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para o Modal
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);

  // Estados para dados reais do usuário
  const [userProfile, setUserProfile] = useState<{ xp: number } | null>(null);
  const [ranking, setRanking] = useState<number | string>('--');

  // Função isolada para carregar os dados (útil para atualizar após envio)
  async function loadPageData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 1. Buscar perfil (XP Real)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', user.id)
          .maybeSingle(); // Usando maybeSingle para evitar erro se não existir
        
        if (profile) {
          setUserProfile(profile);

          // 2. Calcular Ranking (Envolvido em try/catch para não travar a página)
          try {
            const { count } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .gt('xp', profile.xp || 0);
            
            setRanking((count || 0) + 1);
          } catch (e) {
            console.error("Erro ao calcular ranking", e);
          }
        }
      }

      // 3. Buscar Desafios
      const { data: challData, error: challError } = await supabase
        .from('challenges')
        .select('*')
        .order('xp_reward', { ascending: false });

      if (challError) throw challError;
      if (challData) setChallenges(challData);

    } catch (error) {
      console.error("Erro ao carregar desafios:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-brand-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* HEADER DA PÁGINA */}
      <header className="relative overflow-hidden bg-slate-900 border border-white/5 p-10 rounded-[2.5rem] shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="text-yellow-400 fill-yellow-400" size={16} />
              <span className="text-brand-primary font-black uppercase tracking-[0.3em] text-[10px]">Arena de Evolução</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
              Missões de <span className="text-brand-primary">XP</span>
            </h1>
            <p className="text-slate-400 mt-2 max-w-md font-medium">
              Complete os desafios práticos para subir de nível e desbloquear novas recompensas na SkillUp.
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex items-center gap-6">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase">Seu Ranking</p>
              <p className="text-2xl font-black text-white italic">#{ranking}</p>
            </div>
            <div className="w-[1px] h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase">Total XP</p>
              <p className="text-2xl font-black text-brand-primary italic">
                {userProfile?.xp?.toLocaleString('pt-BR') || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/20 blur-[100px] rounded-full" />
      </header>

      {/* GRID DE DESAFIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.length === 0 ? (
          <div className="col-span-full py-20 text-center">
             <p className="text-slate-500 font-bold uppercase tracking-widest">Nenhum desafio disponível no momento.</p>
          </div>
        ) : (
          challenges.map((challenge) => (
            <div 
              key={challenge.id}
              className="group relative bg-slate-900/50 border border-white/5 hover:border-brand-primary/50 p-8 rounded-[2rem] transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-2xl ${
                    challenge.difficulty === 'Fácil' ? 'bg-emerald-500/10 text-emerald-500' :
                    challenge.difficulty === 'Médio' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    <Sword size={24} />
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-black text-slate-500 uppercase">Recompensa</span>
                    <span className="text-brand-primary font-black italic">{challenge.xp_reward} XP</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-white uppercase italic mb-3 group-hover:text-brand-primary transition-colors">
                  {challenge.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                  {challenge.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-0 h-full bg-brand-primary group-hover:w-[15%] transition-all duration-700" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase">Aguardando</span>
                </div>
                
                <Button 
                  onClick={() => setSelectedChallenge(challenge)}
                  className="w-full bg-white/5 hover:bg-brand-primary text-white border border-white/10 hover:border-brand-primary rounded-xl py-6 font-black uppercase italic tracking-widest text-xs transition-all flex items-center gap-2"
                >
                  Enviar Solução <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          ))
        )}

        {/* CARD BLOQUEADO */}
        <div className="relative bg-slate-900/20 border border-dashed border-white/5 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center opacity-60">
          <div className="p-4 bg-slate-800 rounded-full mb-4">
            <Lock className="text-slate-600" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-600 uppercase">Missão Oculta</h3>
          <p className="text-slate-700 text-xs font-bold uppercase mt-1">Alcança Nível 5 para desbloquear</p>
        </div>
      </div>

      {/* MODAL DE ENVIO */}
      {selectedChallenge && (
        <SubmitChallengeModal 
          challenge={selectedChallenge} 
          onClose={() => setSelectedChallenge(null)} 
          onSuccess={() => {
            loadPageData();
          }}
        />
      )}
    </div>
  );
}