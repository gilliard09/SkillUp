'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ModuleCard } from '@/components/dashboard/module-card';
import { ChevronLeft, BookOpen, Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourseData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Detalhes do curso
        const { data: courseData } = await supabase.from('courses').select('*').eq('id', id).single();
        setCourse(courseData);

        // 2. Módulos e as IDs das lições dentro deles
        const { data: modulesData } = await supabase
          .from('modules')
          .select('*, lessons(id)')
          .eq('course_id', id)
          .order('order_index', { ascending: true });

        // 3. Progresso do usuário (quais aulas ele já terminou)
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('is_completed', true);

        if (progressData) {
          setCompletedLessons(progressData.map(p => p.lesson_id));
        }
        
        setModules(modulesData || []);
      } catch (err) {
        console.error("Erro ao carregar detalhes do curso:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourseData();
  }, [id]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-0 text-brand-primary">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-slate-0 px-4 md:px-8">
      <div className="max-w-7xl mx-auto pt-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-10 transition-colors group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-black text-xs uppercase tracking-widest italic">Voltar aos Meus Cursos</span>
        </Link>

        <header className="mb-12 space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-1 w-12 bg-brand-primary rounded-full" />
             <span className="text-brand-primary font-black uppercase text-[10px] tracking-[0.3em] italic">Formação completa</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
            {course?.title}
          </h1>
          <div className="flex items-center gap-6 text-slate-400">
            <span className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest italic border-r border-white/10 pr-6">
              <BookOpen size={18} className="text-brand-primary" /> {modules.length} Módulos
            </span>
            <span className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest italic">
              <Trophy size={18} className="text-yellow-500" /> Certificado Incluso
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module) => {
            // LÓGICA DE PROGRESSO POR MÓDULO
            const moduleLessons = module.lessons || [];
            const totalLessons = moduleLessons.length;
            const doneInModule = moduleLessons.filter((l: any) => completedLessons.includes(l.id)).length;
            
            const progressPercent = totalLessons > 0 ? Math.round((doneInModule / totalLessons) * 100) : 0;
            
            // Define o status visual
            const status = progressPercent === 100 ? "concluido" : progressPercent > 0 ? "em_progresso" : "nao_iniciado";

            return (
              <Link href={`/dashboard/modules/${module.id}`} key={module.id} className="group">
                <ModuleCard 
                  title={module.title}
                  description={module.description}
                  progress={progressPercent}
                  status={status as any}
                  lessonCount={totalLessons}
                />
              </Link>
            );
          })}
        </div>

        {modules.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
            <p className="text-slate-500 font-black italic uppercase">Nenhum módulo cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}