'use client';

import { useState, useEffect } from 'react';
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

export default function LessonQuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isUpdatingXP, setIsUpdatingXP] = useState(false);

  useEffect(() => {
    async function fetchQuizData() {
      try {
        setLoading(true);
        const { data: quiz } = await supabase
          .from('quizzes')
          .select('id')
          .eq('lesson_id', id)
          .single();

        if (quiz) {
          const { data: questionsData } = await supabase
            .from('questions')
            .select('*')
            .eq('quiz_id', quiz.id);
          
          setQuestions(questionsData || []);
        }
      } catch (error) {
        console.error("Erro ao carregar quiz:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuizData();
  }, [id]);

  // FUNÇÃO PARA ATUALIZAR XP REAL NO BANCO
  const addXPToProfile = async (points: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Pegar o XP atual
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user.id)
        .single();

      const currentXP = profile?.xp || 0;

      // 2. Salvar o novo XP somado
      await supabase
        .from('profiles')
        .update({ xp: currentXP + points })
        .eq('id', user.id);

    } catch (error) {
      console.error("Erro ao atualizar XP:", error);
    }
  };

  const handleAnswer = async () => {
    if (selectedOption === null) return;
    
    const isCorrect = selectedOption === questions[currentQuestionIndex].correct_option_index;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      // Opcional: Adiciona o XP na hora do acerto ou acumula para o fim.
      // Aqui vamos acumular para o final para evitar muitas chamadas ao banco.
    }
    
    setIsAnswered(true);
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // FIM DO QUIZ
      setIsUpdatingXP(true);
      const totalXP = score * 50; // 50 XP por acerto
      
      if (totalXP > 0) {
        await addXPToProfile(totalXP);
      }
      
      setIsUpdatingXP(false);
      setQuizFinished(true);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>;
  
  if (questions.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
      <h2 className="text-white text-2xl font-bold">Nenhum teste disponível para esta aula ainda.</h2>
      <Button onClick={() => router.back()} className="mt-6 bg-brand-primary">Voltar para a aula</Button>
    </div>
  );

  if (quizFinished) return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-white/10 p-12 rounded-[3rem] text-center max-w-md w-full shadow-2xl">
        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="text-yellow-500" size={48} />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Parabéns!</h2>
        <p className="text-slate-400 mb-8">Você concluiu o teste com {score} acerto(s)!</p>
        
        <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl mb-8">
            <span className="text-brand-primary font-black text-xl">
              +{score * 50} XP Conquistados
            </span>
        </div>

        <Button 
          onClick={() => {
            router.refresh(); // Limpa o cache para atualizar o ranking
            router.push('/dashboard');
          }} 
          className="w-full h-14 bg-white text-black font-bold rounded-2xl hover:bg-brand-secondary hover:text-white transition-all"
        >
          Voltar para a Dashboard
        </Button>
      </div>
    </motion.div>
  );

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-black text-brand-primary uppercase tracking-widest">Pergunta {currentQuestionIndex + 1} de {questions.length}</span>
            <span className="text-xs text-slate-500 font-bold">{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                className="h-full bg-brand-primary" 
            />
        </div>

        <div className="bg-slate-900/50 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-md shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-8 leading-tight">{currentQ.question_text}</h2>
          
          <div className="space-y-4">
            {currentQ.options.map((option: string, i: number) => {
              const isCorrect = i === currentQ.correct_option_index;
              const isSelected = selectedOption === i;
              
              let borderColor = "border-white/10";
              let bgColor = "bg-white/5";

              if (isAnswered) {
                if (isCorrect) { borderColor = "border-green-500"; bgColor = "bg-green-500/10"; }
                else if (isSelected) { borderColor = "border-red-500"; bgColor = "bg-red-500/10"; }
              } else if (isSelected) {
                borderColor = "border-brand-primary"; bgColor = "bg-brand-primary/10";
              }

              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => setSelectedOption(i)}
                  className={`w-full p-5 rounded-2xl border ${borderColor} ${bgColor} text-left transition-all flex items-center justify-between group`}
                >
                  <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{option}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="text-green-500" size={20} />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-500" size={20} />}
                </button>
              );
            })}
          </div>

          <div className="mt-10">
            {!isAnswered ? (
              <Button 
                onClick={handleAnswer} 
                disabled={selectedOption === null}
                className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-2xl"
              >
                Confirmar Resposta
              </Button>
            ) : (
              <Button 
                onClick={nextQuestion} 
                disabled={isUpdatingXP}
                className="w-full h-14 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                {isUpdatingXP ? <Loader2 className="animate-spin" /> : (
                  <>
                    {currentQuestionIndex + 1 === questions.length ? 'Finalizar Teste' : 'Próxima Pergunta'}
                    <ArrowRight size={20} />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}