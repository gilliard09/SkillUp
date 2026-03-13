'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ModuleCard, type ModuleStatus } from '@/components/dashboard/ModuleCard';
import { ChevronLeft, BookOpen, Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';

// ============================================================
// TIPOS
// ============================================================
type LessonRef = {
  id: string;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  lessons: LessonRef[];
};

type Course = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  image_url: string | null;
};

// ============================================================
// COMPONENTE
// ============================================================
export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [course, setCourse]                     = useState<Course | null>(null);
  const [modules, setModules]                   = useState<Module[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading]                   = useState(true);

  const courseId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (!courseId) return;

    async function fetchCourseData() {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const [courseRes, modulesRes, progressRes, enrollmentRes] = await Promise.all([
          supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single(),

          supabase
            .from('modules')
            .select('*, lessons(id)')
            .eq('course_id', courseId)
            .order('order_index', { ascending: true }),

          supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('is_completed', true),

          supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', courseId)
            .maybeSingle(),
        ]);

        if (courseRes.error || !courseRes.data) {
          router.push('/dashboard');
          return;
        }

        if (!enrollmentRes.data) {
          router.push('/dashboard');
          return;
        }

        setCourse(courseRes.data);
        setModules(modulesRes.data ?? []);

        if (progressRes.data) {
          setCompletedLessons(progressRes.data.map(p => p.lesson_id));
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes do curso:', err);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchCourseData();
  }, [courseId, router]);

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-brand-primary">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto pt-8">

        {/* Voltar */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-10 transition-colors group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-black text-xs uppercase tracking-widest italic">Voltar aos Meus Cursos</span>
        </Link>

        {/* Header */}
        <header className="mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-brand-primary rounded-full" />
            <span className="text-brand-primary font-black uppercase text-[10px] tracking-[0.3em] italic">
              Formação completa
            </span>
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

        {/* Grid de Módulos */}
        {modules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module) => {
              const moduleLessons   = module.lessons ?? [];
              const totalLessons    = moduleLessons.length;
              const doneInModule    = moduleLessons.filter(l => completedLessons.includes(l.id)).length;
              const progressPercent = totalLessons > 0
                ? Math.round((doneInModule / totalLessons) * 100)
                : 0;

              // Tipo importado do ModuleCard — sem 'em_progresso'
              const status: ModuleStatus =
                progressPercent === 100 ? 'concluido' :
                progressPercent > 0     ? 'iniciado'  :
                'nao_iniciado';

              return (
                <ModuleCard
                  key={module.id}
                  moduleId={module.id}
                  title={module.title}
                  description={module.description ?? ''}
                  progress={progressPercent}
                  status={status}
                  lessonCount={totalLessons}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
            <p className="text-slate-500 font-black italic uppercase">Nenhum módulo cadastrado ainda.</p>
          </div>
        )}

      </div>
    </div>
  );
}