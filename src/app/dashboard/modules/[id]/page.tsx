'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { 
  PlayCircle, 
  ArrowLeft, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  Circle
} from 'lucide-react';
import Link from 'next/link';

export default function ModuleLessonsPage() {
  const { id } = useParams();
  const [module, setModule] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModuleData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: moduleData } = await supabase
          .from('modules')
          .select('*')
          .eq('id', id)
          .single();

        if (moduleData) setModule(moduleData);

        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', id)
          .order('order_index', { ascending: true });

        setLessons(lessonsData || []);

        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('is_completed', true);

        if (progressData) {
          setCompletedLessonIds(progressData.map(p => p.lesson_id));
        }

      } catch (error) {
        console.error("Erro ao carregar módulo:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchModuleData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    );
  }

  if (!module) return <div className="text-white p-20 text-center bg-slate-950">Módulo não encontrado.</div>;

  const progressPercent = lessons.length > 0 
    ? Math.round((lessons.filter(l => completedLessonIds.includes(l.id)).length / lessons.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen pb-20 bg-slate-0 px-4 md:px-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto pt-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-black text-xs uppercase tracking-widest italic">Painel Principal</span>
        </Link>

        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20">
                <span className="text-brand-primary text-[10px] font-black uppercase tracking-widest italic">Módulo Ativo</span>
              </div>
              {progressPercent === 100 && (
                <div className="px-4 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="text-green-500 text-[10px] font-black uppercase tracking-widest italic">Concluído</span>
                </div>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none break-words">
              {module.title}
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed font-medium">
              {module.description || "Domine cada etapa deste módulo para elevar o seu nível de conhecimento."}
            </p>
            
            <div className="flex flex-wrap gap-6 md:gap-8 pt-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Aulas</span>
                <span className="text-white font-black italic">{lessons.length} Conteúdos</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Seu Progresso</span>
                <span className="text-brand-primary font-black italic">{progressPercent}% Concluído</span>
              </div>
            </div>

            <div className="w-full max-w-md h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-brand-primary shadow-[0_0_10px_rgba(var(--brand-primary),0.5)]"
               />
            </div>
          </motion.div>
        </header>

        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 italic">
            <FileText className="text-brand-primary" size={18} />
            Cronograma de Estudo
          </h2>

          {lessons.map((lesson, index) => {
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
                          isCompleted ? 'text-slate-300' : 'text-white group-hover:text-brand-primary'
                        }`}>
                          {lesson.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-0.5">
                          <span className={`text-[9px] md:text-[10px] uppercase font-black tracking-widest ${
                            isCompleted ? 'text-green-500' : 'text-slate-600'
                          }`}>
                            {isCompleted ? 'Aula Concluída' : 'Disponível para Início'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex justify-end">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-widest italic ${
                        isCompleted 
                        ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                        : 'bg-white/5 border-white/10 text-slate-500 group-hover:text-brand-primary group-hover:border-brand-primary/20'
                      }`}>
                        {isCompleted ? 'Revisar' : 'Acessar'}
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {lessons.length === 0 && (
            <div className="p-12 border-2 border-dashed border-white/5 rounded-[3rem] text-center bg-slate-900/20">
              <p className="text-slate-500 font-bold italic uppercase tracking-widest text-xs">
                Aulas sendo preparadas para este módulo!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}