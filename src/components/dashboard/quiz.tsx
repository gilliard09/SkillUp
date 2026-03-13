'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Check, X, Trophy, Loader2, ArrowRight, RotateCcw } from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type Question = {
  id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  points: number | null;
};

type QuizData = {
  id: string;
};

const DEFAULT_XP_PER_QUESTION = 10;

// ============================================================
// COMPONENTE
// ============================================================
export function Quiz({ lessonId }: { lessonId: string }) {
  const [questions, setQuestions]         = useState<Question[]>([]);
  const [loading, setLoading]             = useState(true);
  const [currentStep, setCurrentStep]     = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect]         = useState<boolean | null>(null);
  const [finished, setFinished]           = useState(false);
  const [score, setScore]                 = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [alreadyDone, setAlreadyDone]     = useState(false);

  // ----------------------------------------------------------
  // FETCH
  // ----------------------------------------------------------
  const loadQuizData = useCallback(async () => {
    if (!lessonId) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Paralelo: quiz + progresso da aula
      const [quizRes, progressRes] = await Promise.all([
        supabase
          .from('quizzes')
          .select('id')
          .eq('lesson_id', lessonId)
          .maybeSingle(),
        user
          ? supabase
              .from('lesson_progress')
              .select('id')
              .eq('user_id', user.id)
              .eq('lesson_id', lessonId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (progressRes.data) setAlreadyDone(true);

      if (quizRes.data) {
        const { data: questionsData } = await supabase
          .from('questions')
          .select('id, question_text, options, correct_option_index, points')
          .eq('quiz_id', (quizRes.data as QuizData).id)
          .order('id', { ascending: true });

        setQuestions((questionsData as Question[]) ?? []);
      }
    } catch (err) {
      console.error('Erro ao carregar quiz:', err);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadQuizData();
  }, [loadQuizData]);

  // ----------------------------------------------------------
  // VERIFICAR RESPOSTA — só registra acerto local, XP no final
  // ----------------------------------------------------------
  const handleCheck = () => {
    if (selectedOption === null) return;
    const correct = selectedOption === questions[currentStep].correct_option_index;
    setIsCorrect(correct);
    if (correct) setScore(prev => prev + 1);
  };

  // ----------------------------------------------------------
  // PRÓXIMA PERGUNTA / FINALIZAR
  // ----------------------------------------------------------
  const nextQuestion = async () => {
    const isLast = currentStep >= questions.length - 1;

    if (!isLast) {
      setCurrentStep(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      return;
    }

    // ---- FIM DO QUIZ ----
    // Calcula XP total acumulado
    const xp = questions.reduce((acc, q, i) => {
      // Conta apenas as questões que o usuário acertou (score já atualizado)
      return acc;
    }, 0);

    // Recalcula baseado no score final (score ainda não inclui a última resposta se foi acerto)
    const finalScore  = isCorrect ? score : score; // score já foi atualizado no handleCheck
    const earnedXp   = questions.reduce((acc, q) => acc + (q.points ?? DEFAULT_XP_PER_QUESTION), 0);
    const xpProporcional = Math.round((finalScore / questions.length) * earnedXp);

    setTotalXpEarned(xpProporcional);

    // Só credita XP e marca conclusão se ainda não foi feito antes
    if (!alreadyDone) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Verifica novamente no banco (proteção contra dupla aba)
          const { data: existingProgress } = await supabase
            .from('lesson_progress')
            .select('id')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .maybeSingle();

          if (!existingProgress) {
            // Marca aula como concluída
            await supabase
              .from('lesson_progress')
              .upsert(
                { user_id: user.id, lesson_id: lessonId, is_completed: true },
                { onConflict: 'user_id,lesson_id' }
              );

            // Soma XP proporcional aos acertos
            if (xpProporcional > 0) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('xp')
                .eq('id', user.id)
                .single();

              await supabase
                .from('profiles')
                .update({ xp: (profile?.xp ?? 0) + xpProporcional })
                .eq('id', user.id);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao finalizar quiz:', err);
      }
    }

    setFinished(true);
  };

  // ----------------------------------------------------------
  // REFAZER — reseta estado local, sem reload de página
  // ----------------------------------------------------------
  const handleRetry = () => {
    setCurrentStep(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setScore(0);
    setTotalXpEarned(0);
    setFinished(false);
    // alreadyDone permanece true — XP não é creditado novamente
  };

  // ----------------------------------------------------------
  // ESTADOS DE TELA
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  if (questions.length === 0) return null;

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-brand-primary/10 border-2 border-brand-primary/20 p-10 rounded-[2.5rem] text-center mt-8"
      >
        <div className="h-20 w-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
          <Trophy size={40} />
        </div>
        <h3 className="text-2xl font-black text-white mb-2 uppercase italic">Quiz Concluído!</h3>
        <p className="text-slate-400 mb-2">
          Você acertou <span className="text-white font-bold">{score}</span> de{' '}
          <span className="text-white font-bold">{questions.length}</span> questões.
        </p>

        {alreadyDone ? (
          <div className="bg-slate-800 border border-white/10 p-4 rounded-2xl mb-8 mt-4">
            <span className="text-slate-400 font-bold text-sm">
              Aula já concluída anteriormente — XP não duplicado.
            </span>
          </div>
        ) : (
          <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl mb-8 mt-4">
            <span className="text-brand-primary font-black text-xl">
              +{totalXpEarned} XP Conquistados
            </span>
          </div>
        )}

        <Button
          onClick={handleRetry}
          className="bg-white text-slate-950 hover:bg-brand-primary hover:text-white font-bold px-8 h-12 rounded-xl transition-all active:scale-95 flex items-center gap-2 mx-auto"
        >
          <RotateCcw size={16} /> Refazer Quiz
        </Button>
      </motion.div>
    );
  }

  // ----------------------------------------------------------
  // RENDER — QUIZ ATIVO
  // ----------------------------------------------------------
  const q = questions[currentStep];

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm shadow-2xl"
      >
        {/* Header da questão */}
        <div className="flex justify-between items-center mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
            Pergunta {currentStep + 1} de {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-6 rounded-full transition-all duration-500 ${
                  i <= currentStep
                    ? 'bg-brand-primary shadow-[0_0_8px_rgba(124,58,237,0.5)]'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Pergunta */}
        <h3 className="text-xl md:text-2xl font-bold text-white mb-8 leading-tight">
          {q.question_text}
        </h3>

        {/* Opções */}
        <div className="space-y-4">
          {q.options.map((option, index) => {
            const isSelected      = selectedOption === index;
            const showResult      = isCorrect !== null;
            const isCorrectOption = index === q.correct_option_index;

            return (
              <motion.button
                key={index}
                disabled={showResult}
                whileHover={!showResult ? { x: 8 } : {}}
                onClick={() => setSelectedOption(index)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between
                  ${isSelected && !showResult ? 'border-brand-primary bg-brand-primary/5 text-white' : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10'}
                  ${showResult && isCorrectOption ? 'border-green-500/50 bg-green-500/10 text-green-400' : ''}
                  ${showResult && isSelected && !isCorrectOption ? 'border-red-500/50 bg-red-500/10 text-red-400' : ''}
                `}
              >
                <span className="font-medium">{option}</span>
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                  ${isSelected && !showResult ? 'border-brand-primary bg-brand-primary' : 'border-white/10'}
                  ${showResult && isCorrectOption ? 'border-green-500 bg-green-500' : ''}
                  ${showResult && isSelected && !isCorrectOption ? 'border-red-500 bg-red-500' : ''}
                `}>
                  {showResult && isCorrectOption && <Check size={14} className="text-white" />}
                  {showResult && isSelected && !isCorrectOption && <X size={14} className="text-white" />}
                  {!showResult && isSelected && <div className="h-2 w-2 bg-white rounded-full" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback de resposta */}
        <AnimatePresence>
          {isCorrect !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-8 p-6 rounded-2xl border overflow-hidden ${
                isCorrect
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}
            >
              <div className="flex gap-4">
                <div className={`mt-1 p-2 rounded-lg flex-shrink-0 ${
                  isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {isCorrect ? <Check size={18} /> : <X size={18} />}
                </div>
                <div>
                  <p className={`font-bold text-lg ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? 'Resposta Correta!' : 'Não foi dessa vez!'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    {isCorrect
                      ? 'Ótimo trabalho! Continue assim para maximizar seu XP.'
                      : 'Revise o conteúdo da aula e tente a próxima. Você consegue!'
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botões de ação */}
        <div className="mt-10 flex justify-end">
          {isCorrect === null ? (
            <Button
              disabled={selectedOption === null}
              onClick={handleCheck}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-10 h-14 rounded-2xl font-bold shadow-lg shadow-brand-primary/20 transition-all active:scale-95 uppercase italic"
            >
              Verificar Resposta
            </Button>
          ) : (
            <Button
              onClick={nextQuestion}
              className="bg-white text-slate-950 hover:bg-slate-100 px-10 h-14 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl uppercase italic"
            >
              {currentStep < questions.length - 1 ? 'Próxima Pergunta' : 'Finalizar Quiz'}
              <ArrowRight size={20} />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}