'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================
// TIPOS
// ============================================================
type Course = {
  id: string;
  title: string;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  courses: Course | null;
};

type Lesson = {
  id: string;
  title: string;
  order_index: number;
  module_id: string;
};

// ============================================================
// COMPONENTE
// ============================================================
export default function ModuleLessonsPage() {
  const { id } = useParams();
  const router = useRouter();

  // Garante que id é sempre string
  const moduleId = Array.isArray(id) ? id[0] : id;

  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------
  // CARREGAMENTO — Promise.all para paralelismo
  // ----------------------------------------------------------
  const fetchModuleData = useCallback(async () => {
    if (!moduleId) return;

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Paralela: módulo (com curso pai) + aulas + progresso
      const [moduleRes, lessonsRes, progressRes] = await Promise.all([
        supabase
          .from('modules')
          .select('*, courses(id, title)')
          .eq('id', moduleId)
          .single(),

        supabase
          .from('lessons')
          .select('*')
          .eq('module_id', moduleId)
          .order('order_index', { ascending: true }),

        supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('is_completed', true),
      ]);

      // Módulo não encontrado
      if (moduleRes.error || !moduleRes.data) {
        router.push('/dashboard');
        return;
      }

      const moduleData = moduleRes.data as Module;

      // Verifica matrícula no curso pai
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', moduleData.course_id)
        .single();

      if (!enrollment) {
        router.push('/dashboard');
        return;
      }

      setModule(moduleData);
      setLessons((lessonsRes.data as Lesson[]) ?? []);

      if (progressRes.data) {
        setCompletedLessonIds(progressRes.data.map(p => p.lesson_id));
      }
    } catch (error) {
      console.error('Erro ao carregar módulo:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [moduleId, router]);

  useEffect(() => {
    fetchModuleData();
  }, [fetchModuleData]);

  // ----------------------------------------------------------
  // LOADING — sem bg próprio, herda do layout
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-brand-primary">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-white font-bold uppercase">Módulo não encontrado.</p>
      </div>
    );
  }

  // ----------------------------------------------------------
  // DADOS DERIVADOS
  // ----------------------------------------------------------
  const completedCount  = lessons.filter(l => completedLessonIds.includes(l.id)).length;
  const progressPercent = lessons.length > 0
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  const courseId    = module.courses?.id;
  const courseTitle = module.courses?.title;

  // ----------------------------------------------------------
  // RENDER — sem bg e sem min-h-screen, herda do DashboardLayout
  // ----------------------------------------------------------
  return (
    <div className="pb-20 px-4 md:px-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto pt-8">

        {/* Voltar para o curso pai */}
        {courseId ? (
          <Link
            href={`/dashboard/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-black text-xs uppercase tracking-widest italic">
              {courseTitle ?? 'Voltar ao Curso'}
            </span>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-black text-xs uppercase tracking-widest italic">Painel Principal</span>
          </Link>
        )}

        {/* Header do Módulo */}
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20">
                <span className="text-brand-primary text-[10px] font-black uppercase tracking-widest italic">
                  Módulo Ativo
                </span>
              </div>
              {progressPercent === 100 && (
                <div className="px-4 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="text-green-500 text-[10px] font-black uppercase tracking-widest italic">
                    Concluído
                  </span>
                </div>
              )}
            </div>

            {/* Título */}
            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none break-words">
              {module.title}
            </h1>

            {/* Descrição */}
            <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed font-medium">
              {module.description ?? 'Domine cada etapa deste módulo para elevar o seu nível de conhecimento.'}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 md:gap-8 pt-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Aulas</span>
                <span className="text-white font-black italic">{lessons.length} Conteúdos</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Concluídas</span>
                <span className="text-white font-black italic">{completedCount} / {lessons.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Progresso</span>
                <span className="text-brand-primary font-black italic">{progressPercent}%</span>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="w-full max-w-md h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'circOut' }}
                className="h-full bg-brand-primary rounded-full shadow-[0_0_10px_theme(colors.orange.500/50)]"
              />
            </div>
          </motion.div>
        </header>

        {/* Lista de Aulas */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 italic">
            <FileText className="text-brand-primary" size={18} />
            Cronograma de Estudo
          </h2>

          {lessons.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-white/5 rounded-[3rem] text-center bg-slate-900/20">
              <p className="text-slate-500 font-bold italic uppercase tracking-widest text-xs">
                Aulas sendo preparadas para este módulo!
              </p>
            </div>
          ) : (
            lessons.map((lesson, index) => {
              const isCompleted = completedLessonIds.includes(lesson.id);

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/dashboard/lessons/${lesson.id}`}>
                    <div className={`group relative p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between backdrop-blur-sm gap-4 ${
                      isCompleted
                        ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'
                        : 'bg-slate-900/40 border-white/5 hover:border-brand-primary/40'
                    }`}>

                      {/* Ícone + Título */}
                      <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                        <div className={`h-12 w-12 md:h-14 md:w-14 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-xl ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-white/5 border border-white/10 text-slate-500 group-hover:bg-brand-primary group-hover:text-white group-hover:border-brand-primary'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 size={22} strokeWidth={3} />
                          ) : (
                            <span className="font-black text-lg md:text-xl italic">{index + 1}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`font-black text-lg md:text-xl italic uppercase tracking-tighter transition-colors truncate ${
                            isCompleted
                              ? 'text-slate-300'
                              : 'text-white group-hover:text-brand-primary'
                          }`}>
                            {lesson.title}
                          </h3>
                          <span className={`text-[9px] md:text-[10px] uppercase font-black tracking-widest mt-0.5 block ${
                            isCompleted ? 'text-green-500' : 'text-slate-600'
                          }`}>
                            {isCompleted ? 'Aula Concluída' : 'Disponível para Início'}
                          </span>
                        </div>
                      </div>

                      {/* Botão Acessar / Revisar */}
                      <div className="w-full sm:w-auto flex justify-end">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-widest italic transition-all ${
                          isCompleted
                            ? 'bg-green-500/10 border-green-500/20 text-green-500'
                            : 'bg-white/5 border-white/10 text-slate-500 group-hover:text-brand-primary group-hover:border-brand-primary/40'
                        }`}>
                          {isCompleted ? 'Revisar' : 'Acessar'}
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}