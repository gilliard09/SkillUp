'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Check, X, Trophy, Loader2, ArrowRight } from 'lucide-react';

export function Quiz({ lessonId }: { lessonId: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function loadQuizData() {
      setLoading(true);
      try {
        const { data: quizData } = await supabase
          .from('quizzes')
          .select('id')
          .eq('lesson_id', lessonId)
          .maybeSingle();

        if (quizData) {
          const { data: questionsData } = await supabase
            .from('questions')
            .select('*')
            .eq('quiz_id', quizData.id)
            .order('id', { ascending: true });

          setQuestions(questionsData || []);
        }
      } catch (error) {
        console.error("Erro ao carregar quiz:", error);
      } finally {
        setLoading(false);
      }
    }
    loadQuizData();
  }, [lessonId]);

  // FUNÇÃO ATUALIZADA: Com tratamento de erro detalhado e getSession para Client Component
  const handleCheck = async () => {
    const currentQuestion = questions[currentStep];
    const correct = selectedOption === currentQuestion.correct_option_index;
    setIsCorrect(correct);

    if (correct) {
      try {
        // Usar getSession é mais performático em componentes client-side
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        
        if (user) {
          const { error } = await supabase.rpc('increment_xp', { 
            user_id: user.id, 
            amount: currentQuestion.points || 10 
          });

          if (error) {
            console.error("Erro RPC Supabase:", error.message);
          }
        }
      } catch (err) {
        console.error("Erro ao processar XP:", err);
      }
    }
  };

  const nextQuestion = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(curr => curr + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setFinished(true);
    }
  }

  if (loading) return (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-brand-primary" size={32} />
    </div>
  );

  if (questions.length === 0) return null;

  if (finished) return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-brand-primary/10 border-2 border-brand-primary/20 p-10 rounded-[2.5rem] text-center mt-8 mb-20"
    >
      <div className="h-20 w-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
        <Trophy size={40} />
      </div>
      <h3 className="text-2xl font-black text-white mb-2">Desafio Concluído!</h3>
      <p className="text-slate-400 mb-8">Você fortaleceu seu conhecimento e ganhou XP.</p>
      <Button 
        onClick={() => window.location.reload()}
        className="bg-white text-slate-950 hover:bg-brand-primary hover:text-white font-bold px-8 h-12 rounded-xl transition-all active:scale-95"
      >
        Refazer Desafio
      </Button>
    </motion.div>
  );

  const q = questions[currentStep];

  return (
    <div className="max-w-3xl mx-auto mt-12 mb-32"> {/* Aumentado o margin-bottom para não cortar o card */}
      <motion.div 
        key={currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
            Pergunta {currentStep + 1} de {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 w-6 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-brand-primary shadow-[0_0_8px_rgba(124,58,237,0.5)]' : 'bg-slate-800'}`} 
              />
            ))}
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-white mb-8 leading-tight">
          {q.question_text}
        </h3>

        <div className="space-y-4">
          {q.options.map((option: string, index: number) => {
            const isSelected = selectedOption === index;
            const showResult = isCorrect !== null;
            const isCorrectOption = index === q.correct_option_index;

            return (
              <motion.button
                key={index}
                disabled={showResult}
                whileHover={!showResult ? { x: 10 } : {}}
                onClick={() => setSelectedOption(index)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group
                  ${isSelected ? 'border-brand-primary bg-brand-primary/5 text-white' : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10'}
                  ${showResult && isCorrectOption ? 'border-green-500/50 bg-green-500/10 text-green-400' : ''}
                  ${showResult && isSelected && !isCorrectOption ? 'border-red-500/50 bg-red-500/10 text-red-400' : ''}
                `}
              >
                <span className="font-medium">{option}</span>
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected ? 'border-brand-primary bg-brand-primary shadow-[0_0_10px_rgba(124,58,237,0.4)]' : 'border-white/10'}
                  ${showResult && isCorrectOption ? 'border-green-500 bg-green-500' : ''}
                `}>
                  {showResult && isCorrectOption ? (
                    <Check size={14} className="text-white" />
                  ) : (
                    isSelected && <div className="h-2 w-2 bg-white rounded-full" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {isCorrect !== null && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-8 p-6 rounded-2xl border overflow-hidden ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}
            >
              <div className="flex gap-4">
                <div className={`mt-1 p-2 rounded-lg ${isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {isCorrect ? <Check size={18} /> : <X size={18} />}
                </div>
                <div>
                  <p className={`font-bold text-lg ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? 'Resposta Correta!' : 'Quase lá, Pregador!'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    {isCorrect 
                      ? "Excelente compreensão. Dominar o conteúdo desta aula ajuda muito na aplicação prática da teologia." 
                      : "A opção correta foca na base bíblica central da lição. Não desanime, revise o vídeo e tente novamente!"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 flex justify-end">
          {isCorrect === null ? (
            <Button
              disabled={selectedOption === null}
              onClick={handleCheck}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-10 h-14 rounded-2xl font-bold shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
            >
              Verificar Resposta
            </Button>
          ) : (
            <Button
              onClick={nextQuestion}
              className="bg-white text-slate-950 hover:bg-slate-100 px-10 h-14 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl"
            >
              {currentStep < questions.length - 1 ? 'Próxima Pergunta' : 'Finalizar Desafio'}
              <ArrowRight size={20} />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}