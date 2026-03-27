'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Zap, Heart, CheckCircle2, XCircle, Loader2,
  ArrowRight, Trophy, RotateCcw, Flame,
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type Question = {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  type: 'multiple_choice' | 'true_false';
  points: number;
};

type SessionState = 'loading' | 'no_quizzes' | 'playing' | 'result';

type Answer = {
  questionId: string;
  correct: boolean;
  selectedIndex: number;
};

const SESSION_SIZE = 5;
const MAX_LIVES    = 3;

// ============================================================
// HELPERS
// ============================================================
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ============================================================
// COMPONENTE — CORAÇÕES
// ============================================================
function LivesDisplay({ lives }: { lives: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: MAX_LIVES }).map((_, i) => (
        <motion.div
          key={i}
          animate={i === lives ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Heart
            size={20}
            className={i < lives ? 'text-red-500' : 'text-slate-700'}
            fill={i < lives ? '#ef4444' : 'none'}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// COMPONENTE — BARRA DE PROGRESSO
// ============================================================
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-[#4A2080] to-[#7B4FBF] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'circOut' }}
        />
      </div>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-10 text-right">
        {current}/{total}
      </span>
    </div>
  );
}

// ============================================================
// COMPONENTE — FEEDBACK
// ============================================================
function FeedbackBanner({
  correct,
  correctText,
  onNext,
}: {
  correct: boolean;
  correctText: string;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`fixed bottom-0 left-0 right-0 z-50 pb-10 pt-6 px-6 border-t ${
        correct
          ? 'bg-emerald-950/95 border-emerald-500/30 backdrop-blur-xl'
          : 'bg-red-950/95 border-red-500/30 backdrop-blur-xl'
      }`}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {correct ? (
            <CheckCircle2 size={28} className="text-emerald-400 flex-shrink-0" />
          ) : (
            <XCircle size={28} className="text-red-400 flex-shrink-0" />
          )}
          <div>
            <p className={`font-black text-sm uppercase italic tracking-wide ${
              correct ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {correct ? 'Correto! 🎉' : 'Errou!'}
            </p>
            {!correct && (
              <p className="text-slate-400 text-xs font-bold mt-0.5">
                Resposta: <span className="text-white">{correctText}</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onNext}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-wider transition-all active:scale-95 ${
            correct
              ? 'bg-emerald-500 text-white hover:bg-emerald-400'
              : 'bg-red-500 text-white hover:bg-red-400'
          }`}
        >
          Continuar <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================
// COMPONENTE — TELA DE RESULTADO
// ============================================================
function ResultScreen({
  answers,
  totalXp,
  streakUpdated,
  newStreak,
  onRetry,
  onExit,
}: {
  answers: Answer[];
  totalXp: number;
  streakUpdated: boolean;
  newStreak: number;
  onRetry: () => void;
  onExit: () => void;
}) {
  const correct = answers.filter(a => a.correct).length;
  const pct     = Math.round((correct / answers.length) * 100);
  const perfect = correct === answers.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 pb-24"
    >
      {/* Ícone de resultado */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
        className={`h-28 w-28 rounded-[2rem] flex items-center justify-center mb-8 ${
          perfect
            ? 'bg-[#4A2080] shadow-[0_0_60px_rgba(74,32,128,0.5)]'
            : pct >= 60
            ? 'bg-emerald-500/20 border border-emerald-500/30'
            : 'bg-red-500/20 border border-red-500/30'
        }`}
      >
        {perfect ? (
          <Zap size={56} className="text-white" fill="white" />
        ) : pct >= 60 ? (
          <Trophy size={56} className="text-emerald-400" />
        ) : (
          <XCircle size={56} className="text-red-400" />
        )}
      </motion.div>

      {/* Título */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-black text-white uppercase italic tracking-tighter text-center mb-2"
      >
        {perfect ? 'Perfeito!' : pct >= 60 ? 'Boa sessão!' : 'Continue tentando!'}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-slate-500 text-sm font-bold mb-10"
      >
        {correct} de {answers.length} corretas
      </motion.p>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-sm grid grid-cols-3 gap-4 mb-8"
      >
        {/* Precisão */}
        <div className="bg-slate-900/60 border border-white/10 rounded-[1.5rem] p-4 text-center">
          <p className="text-2xl font-black text-white">{pct}%</p>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Precisão</p>
        </div>

        {/* XP ganho */}
        <div className="bg-[#4A2080]/20 border border-[#4A2080]/30 rounded-[1.5rem] p-4 text-center">
          <p className="text-2xl font-black text-[#7B4FBF]">+{totalXp}</p>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">XP</p>
        </div>

        {/* Sequência */}
        <div className={`rounded-[1.5rem] p-4 text-center border ${
          streakUpdated
            ? 'bg-[#4A2080]/20 border-[#4A2080]/30'
            : 'bg-slate-900/60 border-white/10'
        }`}>
          <p className={`text-2xl font-black ${streakUpdated ? 'text-[#7B4FBF]' : 'text-slate-400'}`}>
            {newStreak}⚡
          </p>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Sequência</p>
        </div>
      </motion.div>

      {/* Streak badge */}
      {streakUpdated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="flex items-center gap-2 bg-[#4A2080]/20 border border-[#4A2080]/30 px-4 py-2 rounded-full mb-8"
        >
          <Flame size={14} className="text-[#7B4FBF]" />
          <span className="text-[#7B4FBF] text-xs font-black uppercase tracking-widest">
            Sequência de {newStreak} {newStreak === 1 ? 'dia' : 'dias'}!
          </span>
        </motion.div>
      )}

      {/* Ações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm flex flex-col gap-3"
      >
        <button
          onClick={onRetry}
          className="w-full h-14 bg-[#4A2080] hover:bg-[#5D2A9E] text-white font-black uppercase italic rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(74,32,128,0.3)]"
        >
          <RotateCcw size={18} /> Praticar novamente
        </button>
        <button
          onClick={onExit}
          className="w-full h-14 bg-white/5 border border-white/10 text-slate-400 font-black uppercase italic rounded-2xl hover:bg-white/10 transition-all active:scale-95"
        >
          Voltar ao início
        </button>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function SequenciaPage() {
  const router = useRouter();

  const [state, setState]           = useState<SessionState>('loading');
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lives, setLives]           = useState(MAX_LIVES);
  const [answers, setAnswers]       = useState<Answer[]>([]);
  const [selected, setSelected]     = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [totalXp, setTotalXp]       = useState(0);
  const [streakUpdated, setStreakUpdated] = useState(false);
  const [newStreak, setNewStreak]   = useState(0);
  const [userId, setUserId]         = useState<string | null>(null);

  const currentQuestion = questions[currentIdx] ?? null;
  const isCorrect = selected !== null && currentQuestion
    ? selected === currentQuestion.correct_option_index
    : false;

  // ----------------------------------------------------------
  // CARREGAR QUESTÕES — de aulas já concluídas
  // ----------------------------------------------------------
  const loadQuestions = useCallback(async () => {
    setState('loading');
    setCurrentIdx(0);
    setLives(MAX_LIVES);
    setAnswers([]);
    setSelected(null);
    setShowFeedback(false);
    setTotalXp(0);
    setStreakUpdated(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      // Busca aulas concluídas pelo aluno
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      const completedLessonIds = progress?.map(p => p.lesson_id) ?? [];
      if (completedLessonIds.length === 0) { setState('no_quizzes'); return; }

      // Busca quizzes dessas aulas
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id')
        .in('lesson_id', completedLessonIds);

      const quizIds = quizzes?.map(q => q.id) ?? [];
      if (quizIds.length === 0) { setState('no_quizzes'); return; }

      // Busca questões desses quizzes
      const { data: allQuestions } = await supabase
        .from('questions')
        .select('*')
        .in('quiz_id', quizIds);

      if (!allQuestions || allQuestions.length === 0) { setState('no_quizzes'); return; }

      // Embaralha e pega SESSION_SIZE questões
      const picked = shuffle(allQuestions as Question[]).slice(0, SESSION_SIZE);
      setQuestions(picked);
      setState('playing');
    } catch (err) {
      console.error('Erro ao carregar questões:', err);
      setState('no_quizzes');
    }
  }, [router]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // ----------------------------------------------------------
  // SELECIONAR RESPOSTA
  // ----------------------------------------------------------
  const handleSelect = (index: number) => {
    if (showFeedback || selected !== null) return;
    setSelected(index);
    setShowFeedback(true);

    const correct = index === currentQuestion?.correct_option_index;
    const xpGained = correct ? (currentQuestion?.points ?? 10) : 0;

    setAnswers(prev => [...prev, {
      questionId: currentQuestion!.id,
      correct,
      selectedIndex: index,
    }]);

    if (!correct) setLives(prev => prev - 1);
    if (correct) setTotalXp(prev => prev + xpGained);
  };

  // ----------------------------------------------------------
  // PRÓXIMA QUESTÃO ou FIM
  // ----------------------------------------------------------
  const handleNext = useCallback(async () => {
    setShowFeedback(false);
    setSelected(null);

    const outOfLives  = lives - (isCorrect ? 0 : 0) <= 0 && !isCorrect;
    const lastQuestion = currentIdx + 1 >= questions.length;

    // Verifica se zerou vidas (já decrementado no handleSelect)
    const currentLives = lives - (!isCorrect ? 1 : 0);

    if (currentLives <= 0 || lastQuestion) {
      // Fim da sessão — salva XP e streak
      await finishSession(totalXp + (isCorrect ? (currentQuestion?.points ?? 10) : 0));
    } else {
      setCurrentIdx(prev => prev + 1);
    }
  }, [currentIdx, questions.length, lives, isCorrect, totalXp, currentQuestion]);

  // ----------------------------------------------------------
  // FINALIZAR SESSÃO — salva XP e streak
  // ----------------------------------------------------------
  const finishSession = async (finalXp: number) => {
    if (!userId) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, streak, last_practice_date')
        .eq('id', userId)
        .single();

      if (!profile) return;

      const today    = new Date().toISOString().split('T')[0];
      const lastDate = profile.last_practice_date;
      const already  = lastDate === today;

      // Calcula novo streak
      let newStreakValue = profile.streak ?? 0;
      let updatedStreak  = false;

      if (!already) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yStr) {
          // Praticou ontem → incrementa
          newStreakValue = (profile.streak ?? 0) + 1;
        } else {
          // Quebrou a sequência → reinicia
          newStreakValue = 1;
        }
        updatedStreak = true;
      }

      // Atualiza perfil
      await supabase
        .from('profiles')
        .update({
          xp: (profile.xp ?? 0) + finalXp,
          streak: newStreakValue,
          ...(updatedStreak && { last_practice_date: today }),
        })
        .eq('id', userId);

      setStreakUpdated(updatedStreak);
      setNewStreak(newStreakValue);
      setTotalXp(finalXp);
      setState('result');
    } catch (err) {
      console.error('Erro ao finalizar sessão:', err);
      setState('result');
    }
  };

  // Corrige o handleNext para usar lives atual corretamente
  const handleNextFixed = useCallback(() => {
    setShowFeedback(false);
    setSelected(null);

    const lastQuestion = currentIdx + 1 >= questions.length;
    const livesAfter   = isCorrect ? lives : lives - 1;

    if (livesAfter <= 0 || lastQuestion) {
      const finalXp = totalXp; // já acumulado no handleSelect
      finishSession(finalXp);
    } else {
      setCurrentIdx(prev => prev + 1);
    }
  }, [currentIdx, questions.length, lives, isCorrect, totalXp]);

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-[1.5rem] bg-[#4A2080]/20 border border-[#4A2080]/30 flex items-center justify-center">
            <Zap size={32} className="text-[#7B4FBF] animate-pulse" />
          </div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Preparando questões...</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // SEM QUIZZES
  // ----------------------------------------------------------
  if (state === 'no_quizzes') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="h-20 w-20 rounded-[1.5rem] bg-slate-900/60 border border-white/10 flex items-center justify-center mb-6">
          <Zap size={36} className="text-slate-600" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
          Nenhum quiz disponível
        </h2>
        <p className="text-slate-500 text-sm font-medium max-w-xs mb-8">
          Complete aulas com quiz para liberar a prática aqui.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-8 py-4 bg-brand-primary text-white font-black uppercase italic rounded-2xl active:scale-95 transition-all"
        >
          Ver cursos
        </button>
      </div>
    );
  }

  // ----------------------------------------------------------
  // RESULTADO
  // ----------------------------------------------------------
  if (state === 'result') {
    return (
      <ResultScreen
        answers={answers}
        totalXp={totalXp}
        streakUpdated={streakUpdated}
        newStreak={newStreak}
        onRetry={loadQuestions}
        onExit={() => router.push('/dashboard')}
      />
    );
  }

  // ----------------------------------------------------------
  // JOGO
  // ----------------------------------------------------------
  if (!currentQuestion) return null;

  const isTrueFalse = currentQuestion.type === 'true_false';

  return (
    <div className="min-h-screen flex flex-col pb-24">

      {/* Header da sessão */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <LivesDisplay lives={lives} />
          <ProgressBar current={currentIdx} total={questions.length} />
          <div className="flex items-center gap-1 bg-[#4A2080]/20 border border-[#4A2080]/30 px-3 py-1.5 rounded-full">
            <Zap size={12} className="text-[#7B4FBF]" fill="currentColor" />
            <span className="text-[10px] font-black text-[#7B4FBF]">{totalXp} XP</span>
          </div>
        </div>
      </div>

      {/* Questão */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8">
        <div className="max-w-lg mx-auto w-full">

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              {/* Badge tipo */}
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-xl bg-[#4A2080]/20 border border-[#4A2080]/30 flex items-center justify-center">
                  <Zap size={14} className="text-[#7B4FBF]" fill="currentColor" />
                </div>
                <span className="text-[10px] font-black text-[#7B4FBF] uppercase tracking-widest">
                  {isTrueFalse ? 'Verdadeiro ou Falso' : 'Múltipla escolha'}
                </span>
              </div>

              {/* Enunciado */}
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight mb-10">
                {currentQuestion.question_text}
              </h2>

              {/* Opções */}
              <div className={`grid gap-3 ${isTrueFalse ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {currentQuestion.options.map((option, i) => {
                  const isSelected = selected === i;
                  const isRight    = i === currentQuestion.correct_option_index;
                  const showRight  = showFeedback && isRight;
                  const showWrong  = showFeedback && isSelected && !isRight;

                  return (
                    <motion.button
                      key={i}
                      whileTap={!showFeedback ? { scale: 0.97 } : {}}
                      onClick={() => handleSelect(i)}
                      disabled={showFeedback}
                      className={`relative w-full text-left rounded-2xl border-2 p-4 font-bold text-sm transition-all duration-200 ${
                        showRight
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                          : showWrong
                          ? 'bg-red-500/15 border-red-500 text-red-400'
                          : isSelected
                          ? 'bg-[#4A2080]/20 border-[#4A2080] text-white'
                          : 'bg-slate-900/60 border-white/10 text-white hover:bg-white/5 hover:border-white/20 active:scale-95'
                      } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Índice da opção */}
                        <span className={`flex-shrink-0 h-7 w-7 rounded-xl flex items-center justify-center text-[10px] font-black border ${
                          showRight
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                            : showWrong
                            ? 'bg-red-500/20 border-red-500/50 text-red-400'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}>
                          {isTrueFalse
                            ? (i === 0 ? 'V' : 'F')
                            : String.fromCharCode(65 + i)
                          }
                        </span>
                        <span className="leading-snug">{option}</span>

                        {/* Ícone de feedback */}
                        {showRight && <CheckCircle2 size={18} className="text-emerald-400 ml-auto flex-shrink-0" />}
                        {showWrong && <XCircle size={18} className="text-red-400 ml-auto flex-shrink-0" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Banner de feedback */}
      <AnimatePresence>
        {showFeedback && (
          <FeedbackBanner
            correct={isCorrect}
            correctText={currentQuestion.options[currentQuestion.correct_option_index]}
            onNext={handleNextFixed}
          />
        )}
      </AnimatePresence>
    </div>
  );
}