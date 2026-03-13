'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ============================================================
// TIPOS
// ============================================================
type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
};

type Quiz = {
  id: string;
  xp_per_question: number | null;
};

// ============================================================
// CONSTANTE — XP padrão por acerto se não definido no banco
// ============================================================
const DEFAULT_XP_PER_QUESTION = 50;

// ============================================================
// COMPONENTE
// ============================================================
export default function LessonQuizPage() {
  const { id } = useParams();
  const router  = useRouter();

  // Garante que lessonId é sempre string
  const lessonId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading]           = useState(true);
  const [questions, setQuestions]       = useState<Question[]>([]);
  const [quiz, setQuiz]                 = useState<Quiz | null>(null);
  const [userId, setUserId]             = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption]             = useState<number | null>(null);
  const [isAnswered, setIsAnswered]     = useState(false);
  const [score, setScore]               = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isUpdatingXP, setIsUpdatingXP] = useState(false);
  const [alreadyDone, setAlreadyDone]   = useState(false);

  // ----------------------------------------------------------
  // FETCH
  // ----------------------------------------------------------
  const fetchQuizData = useCallback(async () => {
    if (!lessonId) return;

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Paralelo: quiz + progresso da aula (para detectar se já concluiu)
      const [quizRes, progressRes] = await Promise.all([
        supabase
          .from('quizzes')
          .select('id, xp_per_question')
          .eq('lesson_id', lessonId)
          .maybeSingle(),
        supabase
          .from('lesson_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle(),
      ]);

      // Se aula já foi concluída, marca como feito (impede XP duplo)
      if (progressRes.data) {
        setAlreadyDone(true);
      }

      if (quizRes.data) {
        setQuiz(quizRes.data as Quiz);

        const { data: questionsData } = await supabase
          .from('questions')
          .select('id, question_text, options, correct_option_index')
          .eq('quiz_id', quizRes.data.id)
          .order('id');

        setQuestions((questionsData as Question[]) ?? []);
      }
    } catch (err) {
      console.error('Erro ao carregar quiz:', err);
    } finally {
      setLoading(false);
    }
  }, [lessonId, router]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  // ----------------------------------------------------------
  // CONFIRMAR RESPOSTA
  // ----------------------------------------------------------
  const handleAnswer = () => {
    if (selectedOption === null) return;
    const isCorrect = selectedOption === questions[currentQuestionIndex].correct_option_index;
    if (isCorrect) setScore(prev => prev + 1);
    setIsAnswered(true);
  };

  // ----------------------------------------------------------
  // PRÓXIMA PERGUNTA / FINALIZAR
  // ----------------------------------------------------------
  const nextQuestion = async () => {
    const isLastQuestion = currentQuestionIndex + 1 >= questions.length;

    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      return;
    }

    // ---- FIM DO QUIZ ----
    setIsUpdatingXP(true);
    try {
      if (!userId || !lessonId) return;

      const xpPerQuestion = quiz?.xp_per_question ?? DEFAULT_XP_PER_QUESTION;
      const totalXP       = score * xpPerQuestion;

      // 1. Verifica se já tem progresso (proteção contra XP duplo por repetição)
      const { data: existingProgress } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (!existingProgress) {
        // 2. Marca a aula como concluída
        await supabase
          .from('lesson_progress')
          .upsert(
            { user_id: userId, lesson_id: lessonId, is_completed: true },
            { onConflict: 'user_id,lesson_id' }
          );

        // 3. Soma XP apenas se acertou pelo menos uma
        if (totalXP > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('xp')
            .eq('id', userId)
            .single();

          await supabase
            .from('profiles')
            .update({ xp: (profile?.xp ?? 0) + totalXP })
            .eq('id', userId);
        }
      }

      setQuizFinished(true);
      router.refresh();
    } catch (err) {
      console.error('Erro ao finalizar quiz:', err);
    } finally {
      setIsUpdatingXP(false);
    }
  };

  // ----------------------------------------------------------
  // XP GANHO — calculado uma vez para exibição
  // ----------------------------------------------------------
  const xpPerQuestion = quiz?.xp_per_question ?? DEFAULT_XP_PER_QUESTION;
  const totalXpEarned = score * xpPerQuestion;

  // ----------------------------------------------------------
  // ESTADOS DE TELA
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center gap-6">
        <h2 className="text-white text-2xl font-bold">
          {!quiz ? 'Quiz não encontrado.' : 'Nenhuma questão disponível ainda.'}
        </h2>
        <Link
          href={`/dashboard/lessons/${lessonId}`}
          className="px-6 py-3 bg-brand-primary text-white font-bold rounded-2xl hover:bg-brand-primary/90 transition-all"
        >
          Voltar para a aula
        </Link>
      </div>
    );
  }

  if (quizFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[60vh] flex items-center justify-center p-6"
      >
        <div className="bg-slate-900 border border-white/10 p-12 rounded-[3rem] text-center max-w-md w-full shadow-2xl">
          <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="text-yellow-500" size={48} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase italic">Parabéns!</h2>
          <p className="text-slate-400 mb-8">
            Você concluiu o teste com <span className="text-white font-bold">{score}</span> acerto(s) de{' '}
            <span className="text-white font-bold">{questions.length}</span>!
          </p>

          {alreadyDone ? (
            <div className="bg-slate-800 border border-white/10 p-4 rounded-2xl mb-8">
              <span className="text-slate-400 font-bold text-sm">
                Aula já concluída anteriormente — XP não duplicado.
              </span>
            </div>
          ) : (
            <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl mb-8">
              <span className="text-brand-primary font-black text-xl">
                +{totalXpEarned} XP Conquistados
              </span>
            </div>
          )}

          {/* Volta para a aula — não para o dashboard */}
          <Link
            href={`/dashboard/lessons/${lessonId}`}
            className="flex items-center justify-center w-full h-14 bg-white text-black font-bold rounded-2xl hover:bg-brand-primary hover:text-white transition-all"
          >
            Ver aula concluída
          </Link>
        </div>
      </motion.div>
    );
  }

  // ----------------------------------------------------------
  // RENDER — QUIZ ATIVO
  // ----------------------------------------------------------
  const currentQ   = questions[currentQuestionIndex];
  const isLastQ    = currentQuestionIndex + 1 === questions.length;
  const progressPct = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">

        {/* Progresso */}
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-black text-brand-primary uppercase tracking-widest">
            Pergunta {currentQuestionIndex + 1} de {questions.length}
          </span>
          <span className="text-xs text-slate-500 font-bold">
            {Math.round(progressPct)}%
          </span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
            className="h-full bg-brand-primary rounded-full"
          />
        </div>

        {/* Card da Questão */}
        <div className="bg-slate-900/50 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-md shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-8 leading-tight">
            {currentQ.question_text}
          </h2>

          <div className="space-y-4">
            {currentQ.options.map((option, i) => {
              const isCorrect  = i === currentQ.correct_option_index;
              const isSelected = selectedOption === i;

              let borderColor = 'border-white/10';
              let bgColor     = 'bg-white/5';

              if (isAnswered) {
                if (isCorrect)           { borderColor = 'border-green-500'; bgColor = 'bg-green-500/10'; }
                else if (isSelected)     { borderColor = 'border-red-500';   bgColor = 'bg-red-500/10';   }
              } else if (isSelected) {
                borderColor = 'border-brand-primary';
                bgColor     = 'bg-brand-primary/10';
              }

              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => setSelectedOption(i)}
                  className={`w-full p-5 rounded-2xl border ${borderColor} ${bgColor} text-left transition-all flex items-center justify-between`}
                >
                  <span className={`font-bold ${isSelected || (isAnswered && isCorrect) ? 'text-white' : 'text-slate-400'}`}>
                    {option}
                  </span>
                  {isAnswered && isCorrect  && <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-500 flex-shrink-0" size={20} />}
                </button>
              );
            })}
          </div>

          {/* Botões de ação */}
          <div className="mt-10">
            {!isAnswered ? (
              <Button
                onClick={handleAnswer}
                disabled={selectedOption === null}
                className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-2xl uppercase italic"
              >
                Confirmar Resposta
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                disabled={isUpdatingXP}
                className="w-full h-14 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 uppercase italic"
              >
                {isUpdatingXP
                  ? <Loader2 className="animate-spin" size={20} />
                  : <>
                      {isLastQ ? 'Finalizar Teste' : 'Próxima Pergunta'}
                      <ArrowRight size={20} />
                    </>
                }
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}