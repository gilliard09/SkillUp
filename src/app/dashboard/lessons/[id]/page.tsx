'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  Trophy,
  ChevronRight,
  Download,
  Eye,
  PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LessonDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [lesson, setLesson] = useState<any>(null);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    async function fetchLessonData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: lessonData, error } = await supabase
          .from('lessons')
          .select(`*, modules (title)`)
          .eq('id', id)
          .single();

        if (error) throw error;
        setLesson(lessonData);

        // Verifica se já concluiu
        const { data: progress } = await supabase
          .from('lesson_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('lesson_id', id)
          .maybeSingle();
        
        if (progress) setIsDone(true);

        // Verifica Quiz
        const { data: quizData } = await supabase
          .from('quizzes')
          .select('id')
          .eq('lesson_id', id)
          .maybeSingle();
        
        if (quizData) {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quizData.id);
          
          setHasQuiz(!!count && count > 0);
        }

      } catch (error) {
        console.error("Erro ao carregar aula:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchLessonData();
  }, [id]);

  const handleCompleteLesson = async () => {
    try {
      setIsCompleting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Inserir/Atualizar Progresso no banco
      const { error: progressError } = await supabase
        .from('lesson_progress')
        .upsert({ 
          user_id: user.id, 
          lesson_id: id,
          is_completed: true 
        }, { onConflict: 'user_id,lesson_id' });

      if (progressError) throw progressError;

      // 2. Buscar XP atual, somar e atualizar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user.id)
        .single();

      const newXp = (profile?.xp || 0) + 50;

      const { error: xpError } = await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', user.id);

      if (xpError) throw xpError;

      // 3. Sucesso Visual imediato
      setIsDone(true);
      
      // 4. Sincronizar dados e Dashboard
      router.refresh();
      
      // Delay para o aluno ver a barra encher e o ícone de festa aparecer
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error: any) {
      console.error("Erro ao concluir aula:", error.message);
      alert("Erro ao salvar progresso. Verifique sua conexão.");
    } finally {
      setIsCompleting(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>;
  if (!lesson) return <div className="text-white p-20 text-center bg-slate-950">Aula não encontrada.</div>;

  const videoEmbedUrl = getEmbedUrl(lesson.video_url);

  return (
    <div className="min-h-screen pb-20 bg-slate-0 px-4 md:px-8">
      <div className="max-w-7xl mx-auto py-8">
        {/* Header Superior */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest italic">Voltar ao Curso</span>
          </button>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest italic">
              {lesson.modules?.title}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Conteúdo da Aula */}
          <div className="lg:col-span-8 space-y-8">
            {videoEmbedUrl ? (
              <div className="aspect-video w-full bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
                <iframe src={videoEmbedUrl} className="w-full h-full" allowFullScreen />
              </div>
            ) : (
              <div className="aspect-video w-full bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center">
                <FileText className="text-brand-primary mb-4" size={48} />
                <h3 className="text-white font-black text-xl italic uppercase">Material de Estudo</h3>
                <p className="text-slate-500 text-sm italic font-medium">Esta aula foca no conteúdo escrito e atividades.</p>
              </div>
            )}

            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                {lesson.title}
              </h1>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                  <Trophy size={14} className="text-yellow-500" />
                  <span className="text-[10px] font-black text-yellow-500 uppercase">Vale 50 XP</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full border border-brand-primary/20">
                  <CheckCircle2 size={14} className={isDone ? "text-brand-primary" : "text-slate-500"} />
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {isDone ? "Concluída" : "Em progresso"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md">
              <h2 className="flex items-center gap-3 mb-6 text-white font-black uppercase tracking-widest text-sm italic">
                <FileText className="text-brand-primary" size={20} /> Resumo da Aula
              </h2>
              <div className="prose prose-invert max-w-none text-slate-400 leading-relaxed font-medium">
                {lesson.content ? (
                  <div className="whitespace-pre-wrap">{lesson.content}</div>
                ) : (
                  <p className="italic text-slate-600">Nenhum resumo escrito disponível para esta aula.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar de Ações */}
          <div className="lg:col-span-4 space-y-6">
            {/* Bloco de Quiz */}
            {hasQuiz && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-brand-primary to-orange-600 p-8 rounded-[2.5rem] shadow-xl">
                <h3 className="text-white font-black text-xl mb-2 italic uppercase">Hora do Quiz!</h3>
                <p className="text-white/80 text-xs font-bold mb-6 uppercase tracking-wider">Responda para liberar seus pontos e concluir a aula.</p>
                <Link href={`/dashboard/lessons/${lesson.id}/quiz`}>
                  <Button className="w-full bg-white text-slate-950 h-14 rounded-2xl font-black group hover:bg-slate-100 uppercase italic transition-all">
                    Iniciar Quiz <ChevronRight className="ml-2 group-hover:translate-x-1 transition-all" />
                  </Button>
                </Link>
              </motion.div>
            )}

            {/* Controle de Conclusão */}
            <div className="bg-slate-900/60 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md">
              <h4 className="text-white font-black uppercase italic tracking-widest text-xs mb-6 flex items-center gap-2">
                <CheckCircle2 size={16} className={isDone ? "text-brand-primary" : "text-slate-500"} />
                Status do Aluno
              </h4>

              {!isDone ? (
                <Button 
                  onClick={handleCompleteLesson} 
                  disabled={isCompleting || hasQuiz}
                  className="w-full h-16 bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase italic tracking-widest rounded-2xl shadow-lg shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isCompleting ? <Loader2 className="animate-spin" /> : "Marcar como Concluída"}
                </Button>
              ) : (
                <div className="w-full h-16 bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center gap-2 rounded-2xl font-black uppercase italic tracking-widest animate-in zoom-in-95 duration-300">
                  <PartyPopper size={20} /> Aula Finalizada!
                </div>
              )}

              {hasQuiz && !isDone && (
                <p className="mt-4 text-[9px] text-orange-400 font-black uppercase tracking-[0.2em] text-center italic">
                  ⚠️ Complete o quiz para liberar a conclusão.
                </p>
              )}

              {/* Barra de Progresso Interna com Key Dinâmica */}
              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                  <span className="text-slate-500">Progresso</span>
                  <span className="text-brand-primary font-bold">{isDone ? "100%" : "0%"}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-[2px]">
                   <motion.div 
                    key={isDone ? 'finished' : 'pending'}
                    initial={{ width: 0 }}
                    animate={{ width: isDone ? "100%" : "5%" }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className="h-full bg-gradient-to-r from-brand-primary to-orange-500 rounded-full shadow-[0_0_15px_rgba(255,107,0,0.3)]"
                   />
                </div>
              </div>
            </div>

            {/* Downloads */}
            {lesson.activity_pdf_url && (
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem]">
                <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                  <FileText size={16} className="text-brand-primary"/> Material Complementar
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <a href={lesson.activity_pdf_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-white/5 text-white text-[9px] font-black py-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all uppercase italic">
                    <Eye size={14}/> Ver
                  </a>
                  <a href={lesson.activity_pdf_url} download className="flex items-center justify-center gap-2 bg-brand-primary text-white text-[9px] font-black py-4 rounded-xl hover:opacity-90 transition-all uppercase italic shadow-lg shadow-brand-primary/20">
                    <Download size={14}/> Baixar
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}