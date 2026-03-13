'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, Loader2, FileText,
  Trophy, ChevronRight, Download, Eye, PartyPopper, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ValidationModal } from '@/components/dashboard/ValidationModal';

// ============================================================
// TIPOS
// ============================================================
type Module = {
  id: string;
  title: string;
  course_id: string;
};

type Lesson = {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  activity_pdf_url: string | null;
  xp_reward: number;
  module_id: string;
  modules: Module | null;
};

// ============================================================
// HELPERS
// ============================================================
function getEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : url;
}

async function downloadFile(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Falha ao baixar arquivo.');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const fileName = url.split('/').pop()?.split('?')[0] ?? 'material.pdf';
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch (err) {
    console.error('Erro no download:', err);
  }
}

// ============================================================
// COMPONENTE
// ============================================================
export default function LessonDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const lessonId = Array.isArray(id) ? id[0] : id;

  const [lesson, setLesson]               = useState<Lesson | null>(null);
  const [hasQuiz, setHasQuiz]             = useState(false);
  const [loading, setLoading]             = useState(true);
  const [isCompleting, setIsCompleting]   = useState(false);
  const [isDone, setIsDone]               = useState(false);
  const [downloading, setDownloading]     = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [toast, setToast]                 = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // ----------------------------------------------------------
  // FETCH
  // ----------------------------------------------------------
  const fetchLessonData = useCallback(async () => {
    if (!lessonId) return;
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [lessonRes, progressRes, quizRes] = await Promise.all([
        supabase
          .from('lessons')
          .select('*, modules(id, title, course_id)')
          .eq('id', lessonId)
          .single(),
        supabase
          .from('lesson_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle(),
        supabase
          .from('quizzes')
          .select('id')
          .eq('lesson_id', lessonId)
          .maybeSingle(),
      ]);

      if (lessonRes.error || !lessonRes.data) { router.push('/dashboard'); return; }

      const lessonData = lessonRes.data as Lesson;

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', lessonData.modules?.course_id ?? '')
        .maybeSingle();

      if (!enrollment) { router.push('/dashboard'); return; }

      setLesson(lessonData);
      if (progressRes.data) setIsDone(true);

      if (quizRes.data) {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', quizRes.data.id);
        setHasQuiz(!!count && count > 0);
      }
    } catch (err) {
      console.error('Erro ao carregar aula:', err);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [lessonId, router]);

  useEffect(() => { fetchLessonData(); }, [fetchLessonData]);

  // ----------------------------------------------------------
  // CONCLUIR AULA — chamado após validação da senha
  // ----------------------------------------------------------
  const handleCompleteLesson = async () => {
    if (isDone || isCompleting) return;

    try {
      setIsCompleting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // Proteção dupla contra XP duplicado
      const { data: existingProgress } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (existingProgress) { setIsDone(true); return; }

      // Registra progresso
      const { error: progressError } = await supabase
        .from('lesson_progress')
        .insert({ user_id: user.id, lesson_id: lessonId, is_completed: true });

      if (progressError) throw progressError;

      // Atualiza XP
      const xpReward = lesson?.xp_reward ?? 0;
      if (xpReward > 0) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        const { error: xpError } = await supabase
          .from('profiles')
          .update({ xp: (profile?.xp ?? 0) + xpReward })
          .eq('id', user.id);

        if (xpError) throw xpError;
      }

      setIsDone(true);
      notify('success', `+${xpReward} XP conquistado!`);

    } catch (err: any) {
      console.error('Erro ao concluir aula:', err.message);
      notify('error', 'Erro ao salvar progresso. Verifique sua conexão.');
    } finally {
      setIsCompleting(false);
    }
  };

  // ----------------------------------------------------------
  // DOWNLOAD
  // ----------------------------------------------------------
  const handleDownload = async () => {
    if (!lesson?.activity_pdf_url || downloading) return;
    setDownloading(true);
    await downloadFile(lesson.activity_pdf_url);
    setDownloading(false);
  };

  // ----------------------------------------------------------
  // LOADING / NOT FOUND
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white font-bold uppercase">Aula não encontrada.</p>
      </div>
    );
  }

  const videoEmbedUrl = getEmbedUrl(lesson.video_url);
  const moduleId      = lesson.modules?.id;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen pb-24 px-4 md:px-8">

      {/* Modal de validação do professor */}
      <ValidationModal
        isOpen={showValidation}
        onClose={() => setShowValidation(false)}
        onSuccess={handleCompleteLesson}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-2xl border shadow-2xl animate-in slide-in-from-right-4 flex items-center gap-3 font-bold uppercase text-xs ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
            : 'bg-red-500/10 border-red-500 text-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {moduleId ? (
            <Link href={`/dashboard/modules/${moduleId}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest italic">Voltar ao Módulo</span>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest italic">Voltar ao Dashboard</span>
            </Link>
          )}
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 max-w-[50%]">
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest italic truncate">
              {lesson.modules?.title}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Coluna Principal */}
          <div className="lg:col-span-8 space-y-8">
            {videoEmbedUrl ? (
              <div className="aspect-video w-full bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                <iframe src={videoEmbedUrl} className="w-full h-full" allowFullScreen title={lesson.title} />
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
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                  <Trophy size={14} className="text-yellow-500" />
                  <span className="text-[10px] font-black text-yellow-500 uppercase">Vale {lesson.xp_reward} XP</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full border border-brand-primary/20">
                  <CheckCircle2 size={14} className={isDone ? 'text-brand-primary' : 'text-slate-500'} />
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {isDone ? 'Concluída' : 'Em progresso'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md">
              <h2 className="flex items-center gap-3 mb-6 text-white font-black uppercase tracking-widest text-sm italic">
                <FileText className="text-brand-primary" size={20} /> Resumo da Aula
              </h2>
              <div className="prose prose-invert max-w-none text-slate-400 leading-relaxed font-medium">
                {lesson.content
                  ? <div className="whitespace-pre-wrap">{lesson.content}</div>
                  : <p className="italic text-slate-600">Nenhum resumo disponível para esta aula.</p>
                }
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {hasQuiz && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-brand-primary to-orange-600 p-8 rounded-[2.5rem] shadow-xl"
              >
                <h3 className="text-white font-black text-xl mb-2 italic uppercase">Hora do Quiz!</h3>
                <p className="text-white/80 text-xs font-bold mb-6 uppercase tracking-wider">
                  Responda para liberar seus pontos e concluir a aula.
                </p>
                <Link href={`/dashboard/lessons/${lesson.id}/quiz`}>
                  <Button className="w-full bg-white text-slate-950 h-14 rounded-2xl font-black group hover:bg-slate-100 uppercase italic transition-all">
                    Iniciar Quiz <ChevronRight className="ml-2 group-hover:translate-x-1 transition-all" />
                  </Button>
                </Link>
              </motion.div>
            )}

            <div className="bg-slate-900/60 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md">
              <h4 className="text-white font-black uppercase italic tracking-widest text-xs mb-6 flex items-center gap-2">
                <CheckCircle2 size={16} className={isDone ? 'text-brand-primary' : 'text-slate-500'} />
                Status do Aluno
              </h4>

              {!isDone ? (
                <Button
                  onClick={() => setShowValidation(true)}
                  disabled={isCompleting || hasQuiz}
                  className="w-full min-h-[4rem] py-4 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-black uppercase italic tracking-wider text-xs rounded-2xl shadow-lg shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50 whitespace-normal leading-tight text-center"
                >
                  {isCompleting
                    ? <Loader2 className="animate-spin mx-auto" />
                    : 'Marcar como Concluída'
                  }
                </Button>
              ) : (
                <div className="w-full min-h-[4rem] py-4 px-4 bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center gap-2 rounded-2xl font-black uppercase italic tracking-wider text-xs animate-in zoom-in-95 duration-300 text-center leading-tight">
                  <PartyPopper size={20} className="flex-shrink-0" /> Aula Finalizada!
                </div>
              )}

              {hasQuiz && !isDone && (
                <p className="mt-4 text-[9px] text-orange-400 font-black uppercase tracking-[0.2em] text-center italic">
                  ⚠️ Complete o quiz para liberar a conclusão.
                </p>
              )}

              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                  <span className="text-slate-500">Progresso</span>
                  <span className="text-brand-primary font-bold">{isDone ? '100%' : '0%'}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-[2px]">
                  <motion.div
                    key={isDone ? 'finished' : 'pending'}
                    initial={{ width: 0 }}
                    animate={{ width: isDone ? '100%' : '5%' }}
                    transition={{ duration: 1, ease: 'circOut' }}
                    className="h-full bg-gradient-to-r from-brand-primary to-orange-500 rounded-full shadow-[0_0_15px_rgba(255,107,0,0.3)]"
                  />
                </div>
              </div>
            </div>

            {lesson.activity_pdf_url && (
              <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem]">
                <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                  <FileText size={16} className="text-brand-primary" /> Material Complementar
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={lesson.activity_pdf_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center justify-center gap-2 bg-white/5 text-white text-[9px] font-black py-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all uppercase italic"
                  >
                    <Eye size={14} /> Ver
                  </a>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 bg-brand-primary text-white text-[9px] font-black py-4 rounded-xl hover:opacity-90 transition-all uppercase italic shadow-lg shadow-brand-primary/20 disabled:opacity-60"
                  >
                    {downloading
                      ? <Loader2 size={14} className="animate-spin" />
                      : <><Download size={14} /> Baixar</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}