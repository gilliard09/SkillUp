'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Trophy,
  Sword,
  Star,
  ChevronRight,
  Lock,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubmitChallengeModal } from '@/components/dashboard/submitchallengemodal';

// ============================================================
// TIPOS
// ============================================================
type Challenge = {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  category: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
};

type SubmissionStatus = 'pending' | 'approved' | 'rejected';

type UserSubmission = {
  challenge_id: string;
  status: SubmissionStatus;
};

type UserProfile = {
  xp: number;
};

// ============================================================
// HELPERS
// ============================================================
const difficultyStyle: Record<Challenge['difficulty'], string> = {
  'Fácil':   'bg-emerald-500/10 text-emerald-500',
  'Médio':   'bg-yellow-500/10 text-yellow-500',
  'Difícil': 'bg-red-500/10 text-red-500',
};

function SubmissionBadge({ status }: { status: SubmissionStatus }) {
  if (status === 'approved') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500">
        <CheckCircle2 size={12} /> Aprovado
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-yellow-500">
        <Clock size={12} /> Aguardando aprovação
      </span>
    );
  }
  return null;
}

// ============================================================
// COMPONENTE
// ============================================================
export default function ChallengesPage() {
  const router = useRouter();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<UserSubmission[]>([]);
  const [ranking, setRanking] = useState<number | string>('--');
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // ----------------------------------------------------------
  // CARREGAMENTO — paralelo com Promise.all
  // ----------------------------------------------------------
  const loadPageData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Paraleliza: perfil + desafios + submissões do usuário
      const [profileRes, challRes, subsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('xp')
          .eq('id', user.id)
          .maybeSingle(),

        supabase
          .from('challenges')
          .select('*')
          .order('xp_reward', { ascending: false }),

        supabase
          .from('challenge_submissions')
          .select('challenge_id, status')
          .eq('user_id', user.id),
      ]);

      // Perfil e ranking
      if (profileRes.data) {
        setUserProfile(profileRes.data);

        try {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gt('xp', profileRes.data.xp ?? 0);

          setRanking((count ?? 0) + 1);
        } catch {
          setRanking('--');
        }
      }

      // Desafios
      if (challRes.data) setChallenges(challRes.data);

      // Submissões do usuário
      if (subsRes.data) setUserSubmissions(subsRes.data);

    } catch (error) {
      console.error('Erro ao carregar desafios:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // Helper: retorna status da submissão do usuário para um desafio
  const getSubmissionStatus = (challengeId: string): SubmissionStatus | null => {
    const sub = userSubmissions.find(s => s.challenge_id === challengeId);
    return sub ? sub.status : null;
  };

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-brand-primary" size={48} />
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">

      {/* HEADER */}
      <header className="relative overflow-hidden bg-slate-900 border border-white/5 p-10 rounded-[2.5rem] shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="text-yellow-400 fill-yellow-400" size={16} />
              <span className="text-brand-primary font-black uppercase tracking-[0.3em] text-[10px]">
                Arena de Evolução
              </span>
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
                {(userProfile?.xp ?? 0).toLocaleString('pt-BR')}
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
            <p className="text-slate-500 font-bold uppercase tracking-widest">
              Nenhum desafio disponível no momento.
            </p>
          </div>
        ) : (
          challenges.map((challenge) => {
            const submissionStatus = getSubmissionStatus(challenge.id);
            const alreadySubmitted = submissionStatus !== null;
            const isApproved = submissionStatus === 'approved';

            return (
              <div
                key={challenge.id}
                className={`group relative bg-slate-900/50 border p-8 rounded-[2rem] transition-all duration-300 flex flex-col justify-between ${
                  isApproved
                    ? 'border-emerald-500/30 opacity-70'
                    : 'border-white/5 hover:border-brand-primary/50 hover:-translate-y-2'
                }`}
              >
                <div>
                  {/* Topo: dificuldade + XP */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-2xl ${difficultyStyle[challenge.difficulty]}`}>
                      <Sword size={24} />
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-black text-slate-500 uppercase">Recompensa</span>
                      <span className="text-brand-primary font-black italic">+{challenge.xp_reward} XP</span>
                    </div>
                  </div>

                  {/* Título e descrição */}
                  <h3 className="text-xl font-black text-white uppercase italic mb-3 group-hover:text-brand-primary transition-colors">
                    {challenge.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                    {challenge.description}
                  </p>
                </div>

                {/* Rodapé: status + botão */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 h-5">
                    {submissionStatus ? (
                      <SubmissionBadge status={submissionStatus} />
                    ) : (
                      <span className="text-[10px] font-black text-slate-600 uppercase">
                        {challenge.difficulty}
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => !alreadySubmitted && setSelectedChallenge(challenge)}
                    disabled={alreadySubmitted}
                    className={`w-full border rounded-xl py-6 font-black uppercase italic tracking-widest text-xs transition-all flex items-center gap-2 ${
                      isApproved
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 cursor-default'
                        : alreadySubmitted
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 cursor-default'
                        : 'bg-white/5 hover:bg-brand-primary text-white border-white/10 hover:border-brand-primary'
                    }`}
                  >
                    {isApproved ? (
                      <><CheckCircle2 size={14} /> Concluído</>
                    ) : alreadySubmitted ? (
                      <><Clock size={14} /> Em análise</>
                    ) : (
                      <>Enviar Solução <ChevronRight size={14} /></>
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}

        {/* CARD BLOQUEADO — separado do grid de desafios reais */}
        <div className="relative bg-slate-900/20 border border-dashed border-white/5 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center opacity-50">
          <div className="p-4 bg-slate-800 rounded-full mb-4">
            <Lock className="text-slate-600" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-600 uppercase">Missão Oculta</h3>
          <p className="text-slate-700 text-xs font-bold uppercase mt-1">Alcance o Nível 5 para desbloquear</p>
        </div>
      </div>

      {/* MODAL DE ENVIO */}
      {selectedChallenge && (
        <SubmitChallengeModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onSuccess={() => {
            setSelectedChallenge(null);
            loadPageData();
          }}
        />
      )}
    </div>
  );
}