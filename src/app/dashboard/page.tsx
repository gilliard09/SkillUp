'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { DashboardHeader } from '@/components/dashboard/header';
import { LevelUpModal } from '@/components/dashboard/levelupmodal';
import { PlayCircle, Loader2, Zap, LayoutGrid } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// ============================================================
// TIPOS
// ============================================================
type Course = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  price: number | null;
};

type Profile = {
  full_name: string | null;
  xp: number;
  streak: number;
  last_practice_date: string | null;
  organization_id: string | null; // NOVA MUDANÇA: Adicionado campo de organização
};

type Level = {
  min: number;
  name: string;
  color: string;
  bg: string;
  border: string;
};

// ============================================================
// CONSTANTES
// ============================================================
const LEVELS: Level[] = [
  { min: 5000, name: 'Lendário Digital',       color: 'text-purple-400',    bg: 'bg-purple-400/10',    border: 'border-purple-400/20'    },
  { min: 4000, name: 'Mestre Tech',             color: 'text-orange-400',    bg: 'bg-orange-400/10',    border: 'border-orange-400/20'    },
  { min: 3000, name: 'Especialista Digital',    color: 'text-blue-400',      bg: 'bg-blue-400/10',      border: 'border-blue-400/20'      },
  { min: 2000, name: 'Criador de Soluções',     color: 'text-emerald-400',   bg: 'bg-emerald-400/10',   border: 'border-emerald-400/20'   },
  { min: 1000, name: 'Desenvolvedor Iniciante', color: 'text-brand-primary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20' },
  { min: 0,    name: 'Explorador Digital',      color: 'text-slate-400',     bg: 'bg-slate-400/10',     border: 'border-white/5'          },
];

function getCurrentLevel(xp: number): Level {
  return LEVELS.find(l => xp >= l.min) ?? LEVELS[LEVELS.length - 1];
}

function getNextLevel(xp: number): Level | null {
  return [...LEVELS].reverse().find(l => l.min > xp) ?? null;
}

function practicedToday(lastDate: string | null): boolean {
  if (!lastDate) return false;
  return new Date(lastDate).toDateString() === new Date().toDateString();
}

// ============================================================
// COMPONENTE CARD DE SEQUÊNCIA
// ============================================================
function SequenciaCard({ streak, practicedToday: doneToday }: { streak: number; practicedToday: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-10"
    >
      <Link href="/dashboard/sequencia">
        <div className={`relative overflow-hidden rounded-[2rem] border p-6 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
          doneToday
            ? 'bg-[#4A2080]/15 border-[#4A2080]/30'
            : 'bg-slate-900/60 border-white/10'
        }`}>

          {doneToday && (
            <div className="absolute inset-0 bg-[#4A2080]/10 blur-2xl -z-10 rounded-[2rem]" />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-[1.25rem] flex items-center justify-center shadow-lg flex-shrink-0 ${
                doneToday
                  ? 'bg-[#4A2080] shadow-[0_0_20px_rgba(74,32,128,0.4)]'
                  : 'bg-slate-800 border border-white/10'
              }`}>
                <Zap
                  size={28}
                  className={doneToday ? 'text-white' : 'text-slate-500'}
                  fill={doneToday ? 'white' : 'none'}
                />
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Sequência
                </p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black italic ${
                    doneToday ? 'text-[#7B4FBF]' : 'text-slate-400'
                  }`}>
                    {streak}
                  </span>
                  <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                    {streak === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              {doneToday ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-black text-[#7B4FBF] uppercase tracking-widest">
                    Completo hoje ⚡
                  </span>
                  <span className="text-slate-600 text-[9px] font-bold uppercase">
                    Volte amanhã
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Praticar hoje
                  </span>
                  <span className="text-brand-primary text-[9px] font-black uppercase tracking-wider">
                    Não perca a sequência →
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => {
              const today = new Date().getDay();
              const isPast   = i < today;
              const isToday  = i === today;
              const isFuture = i > today;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={`w-full h-1.5 rounded-full ${
                    isToday && doneToday
                      ? 'bg-[#4A2080]'
                      : isToday
                      ? 'bg-white/20'
                      : isPast && streak > (today - i)
                      ? 'bg-[#4A2080]/60'
                      : isFuture
                      ? 'bg-white/5'
                      : 'bg-white/10'
                  }`} />
                  <span className={`text-[8px] font-black uppercase ${
                    isToday ? 'text-white' : 'text-slate-700'
                  }`}>{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function DashboardPage() {
  const router = useRouter();

  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [profile, setProfile]                 = useState<Profile | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [showLevelUp, setShowLevelUp]         = useState(false);
  const [globalProgress, setGlobalProgress]   = useState(0);
  const [previousXp, setPreviousXp]           = useState<number | null>(null);

  const xp           = profile?.xp ?? 0;
  const streak       = profile?.streak ?? 0;
  const doneToday    = practicedToday(profile?.last_practice_date ?? null);
  const currentLevel = useMemo(() => getCurrentLevel(xp), [xp]);
  const nextLevel    = useMemo(() => getNextLevel(xp), [xp]);
  const xpToNext     = nextLevel ? nextLevel.min - xp : 0;

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        // NOVA MUDANÇA: Adicionado organization_id na query do perfil
        const [profileRes, enrollmentsRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, xp, streak, last_practice_date, organization_id')
            .eq('id', user.id)
            .maybeSingle(),
          supabase.from('enrollments').select('product_id').eq('user_id', user.id),
        ]);

        const profileData = profileRes.data as Profile | null;
        if (profileData) {
          if (previousXp !== null) {
            const prevLevel = getCurrentLevel(previousXp);
            const newLevel  = getCurrentLevel(profileData.xp ?? 0);
            if (newLevel.min > prevLevel.min) setShowLevelUp(true);
          }
          setPreviousXp(profileData.xp ?? 0);
          setProfile(profileData);
        }

        const enrolledIds = enrollmentsRes.data?.map(e => e.product_id) ?? [];

        if (enrolledIds.length > 0) {
          const { data: coursesData } = await supabase
            .from('courses')
            .select('*')
            .in('id', enrolledIds)
            .order('title', { ascending: true });

          setEnrolledCourses((coursesData as Course[]) ?? []);

          const { data: modulesData } = await supabase
            .from('modules')
            .select('id')
            .in('course_id', enrolledIds);

          const moduleIds = modulesData?.map(m => m.id) ?? [];

          if (moduleIds.length > 0) {
            const [allLessonsRes, completedRes] = await Promise.all([
              supabase.from('lessons').select('id').in('module_id', moduleIds),
              supabase
                .from('lesson_progress')
                .select('lesson_id')
                .eq('user_id', user.id)
                .eq('is_completed', true),
            ]);

            const total     = allLessonsRes.data?.length ?? 0;
            const completed = completedRes.data?.length ?? 0;
            if (total > 0) setGlobalProgress(Math.round((completed / total) * 100));
          }
        } else {
          setEnrolledCourses([]);
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [router, previousXp]);

  const categories = useMemo(
    () => Array.from(new Set(enrolledCourses.map(c => c.category ?? 'Geral'))),
    [enrolledCourses]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brand-primary bg-slate-950">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="pb-24 overflow-hidden relative font-sans bg-slate-950 min-h-screen">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-primary/10 blur-[120px] -z-10 rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] -z-10 rounded-full pointer-events-none" />

      <LevelUpModal
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        levelData={currentLevel}
      />

      <DashboardHeader
        userName={profile?.full_name?.split(' ')[0] ?? 'Explorador'}
        level={currentLevel.name}
        xp={xp}
        progress={globalProgress}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {nextLevel && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 -mt-8 flex items-center gap-4 bg-slate-900/60 border border-white/10 p-2 pr-6 rounded-full backdrop-blur-md w-fit shadow-xl"
          >
            <div className={`h-10 w-10 rounded-full ${nextLevel.bg} flex items-center justify-center ${nextLevel.color} shadow-lg`}>
              <Zap size={18} fill="currentColor" />
            </div>
            <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-tight">
              Faltam{' '}
              <span className="text-white font-black">{xpToNext} XP</span>
              {' '}para{' '}
              <span className={`${nextLevel.color} italic underline decoration-2`}>
                {nextLevel.name}
              </span>
            </p>
          </motion.div>
        )}

        <SequenciaCard streak={streak} practicedToday={doneToday} />

        {enrolledCourses.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-24 bg-slate-900/40 rounded-[3rem] border border-dashed border-white/10 px-8 mt-12">
            <LayoutGrid size={32} className="text-slate-600 mx-auto mb-6" />
            <h4 className="text-white font-black uppercase italic mb-2">Nenhum curso encontrado</h4>
            <p className="text-slate-500 text-sm font-medium">
              Você ainda não está matriculado em nenhum curso.
            </p>
          </div>
        ) : (
          categories.map((category) => (
            <section key={category} className="mb-20">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-10 w-2 bg-gradient-to-b from-brand-primary to-orange-600 rounded-full shadow-[0_0_15px_rgba(255,107,0,0.4)]" />
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{category}</h2>
                <div className="h-[1px] flex-grow bg-white/5 ml-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {enrolledCourses
                  .filter(c => (c.category ?? 'Geral') === category)
                  .map((course) => (
                    <motion.div
                      key={course.id}
                      whileHover={{ y: -6, scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="group relative rounded-[2.5rem] overflow-hidden h-72 shadow-2xl"
                    >
                      <div className="absolute inset-0 z-0">
                        <Image
                          src={course.image_url ?? '/placeholder-course.png'}
                          alt={course.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105 brightness-50"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/5 transition-all duration-500" />
                      </div>

                      <div className="relative z-10 p-8 flex flex-col justify-end h-full w-full">
                        <span className="px-2 py-0.5 rounded-md bg-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-widest italic border border-brand-primary/30 w-fit mb-3">
                          Disponível
                        </span>
                        <h3 className="text-2xl font-black text-white mb-2 italic uppercase tracking-tighter leading-tight group-hover:text-brand-primary transition-colors drop-shadow-lg">
                          {course.title}
                        </h3>
                        <p className="text-slate-300/70 text-xs font-medium leading-relaxed line-clamp-2 mb-6">
                          {course.description}
                        </p>
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="flex items-center justify-center gap-2 w-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-black py-4 px-4 rounded-2xl hover:bg-brand-primary hover:border-brand-primary transition-all duration-300 active:scale-95 group/btn uppercase italic tracking-normal text-xs text-center shadow-lg whitespace-nowrap"
                        >
                          Continuar de onde parou
                          <PlayCircle size={16} className="flex-shrink-0 group-hover/btn:rotate-12 transition-transform" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}