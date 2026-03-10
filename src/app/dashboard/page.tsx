'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { DashboardHeader } from '@/components/dashboard/header';
import { LevelUpModal } from '@/components/dashboard/levelupmodal';
import { PlayCircle, Lock, ArrowRight, Loader2, Zap, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);

  const LEVELS = [
    { min: 5000, name: "Lendário Digital", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
    { min: 4000, name: "Mestre Tech", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
    { min: 3000, name: "Especialista Digital", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
    { min: 2000, name: "Criador de Soluções", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
    { min: 1000, name: "Desenvolvedor Iniciante", color: "text-brand-primary", bg: "bg-brand-primary/10", border: "border-brand-primary/20" },
    { min: 0,    name: "Explorador Digital", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-white/5" },
  ];

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Perfil
        const { data: profileData } = await supabase.from('profiles').select('full_name, xp').eq('id', user.id).maybeSingle();
        if (profileData) setProfile(profileData);

        // 2. Cursos e Matrículas
        const { data: coursesData } = await supabase.from('courses').select('*').order('title', { ascending: true });
        setCourses(coursesData || []);

        const { data: enrollments } = await supabase.from('enrollments').select('product_id').eq('user_id', user.id);
        const enrolledProductIds = enrollments?.map(e => e.product_id) || [];
        setEnrolledIds(enrolledProductIds);

        // 3. Lógica de Progresso Corrigida
        if (enrolledProductIds.length > 0) {
          const { data: modulesData } = await supabase
            .from('modules')
            .select('id')
            .in('course_id', enrolledProductIds);

          const moduleIds = modulesData?.map(m => m.id) || [];

          if (moduleIds.length > 0) {
            const { data: allLessons } = await supabase
              .from('lessons')
              .select('id')
              .in('module_id', moduleIds);

            const { data: completedLessons } = await supabase
              .from('lesson_progress')
              .select('lesson_id')
              .eq('user_id', user.id)
              .eq('is_completed', true);

            if (allLessons && allLessons.length > 0) {
              const total = allLessons.length;
              const completed = completedLessons?.length || 0;
              setGlobalProgress(Math.round((completed / total) * 100));
            }
          }
        }

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // Encontra o nível atual baseado no XP
  const currentLevel = LEVELS.find(l => (profile?.xp || 0) >= l.min) || LEVELS[5];
  // Encontra o próximo nível para a barra de progresso
  const nextLevel = LEVELS.slice().reverse().find(l => l.min > (profile?.xp || 0));
  const xpToNext = nextLevel ? nextLevel.min - (profile?.xp || 0) : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-brand-primary">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  const categories = Array.from(new Set(courses.map(c => c.category || 'Geral')));

  return (
    <div className="min-h-screen bg-slate-0 pb-24 overflow-hidden relative font-sans">
      {/* Glows de Fundo - Corrigidos para 500px para preencher o layout */}
      <div className="absolute top-0 right-0 w-[0px] h-[0px] bg-brand-primary/10 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[0px] h-[0px] bg-purple-600/10 blur-[120px] -z-10 rounded-full" />

      {/* MODAL CORRIGIDO: Agora passa o levelData completo em vez de apenas o nome */}
      <LevelUpModal 
        isOpen={showLevelUp} 
        onClose={() => setShowLevelUp(false)} 
        levelData={currentLevel} 
      />

      <DashboardHeader 
        userName={profile?.full_name?.split(' ')[0] || "Explorador"} 
        level={currentLevel.name} 
        xp={Number(profile?.xp || 0)} 
        progress={globalProgress} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Barra de Próximo Nível Premium */}
        {nextLevel && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="mb-12 -mt-8 flex items-center gap-4 bg-slate-900/60 border border-white/10 p-2 pr-6 rounded-full backdrop-blur-md w-fit shadow-xl"
          >
            <div className={`h-10 w-10 rounded-full ${nextLevel.bg} flex items-center justify-center ${nextLevel.color} shadow-lg`}>
              <Zap size={18} fill="currentColor" />
            </div>
            <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-tight">
              Faltam <span className="text-white font-black">{xpToNext} XP</span> para <span className={`${nextLevel.color} italic underline decoration-2`}>{nextLevel.name}</span>
            </p>
          </motion.div>
        )}

        {/* Listagem por Categorias */}
        {categories.map((category) => (
          <section key={category} className="mb-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-10 w-2 bg-gradient-to-b from-brand-primary to-orange-600 rounded-full shadow-[0_0_15px_rgba(255,107,0,0.4)]" />
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{category}</h2>
              <div className="h-[1px] flex-grow bg-white/5 ml-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {courses.filter(c => (c.category || 'Geral') === category).map((course) => {
                const isUnlocked = enrolledIds.includes(course.id);
                return (
                  <motion.div
                    key={course.id}
                    whileHover={{ y: -5 }}
                    className="group relative bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm transition-all hover:border-brand-primary/40 shadow-2xl flex flex-col md:flex-row h-full md:h-72"
                  >
                    <div className="relative w-full md:w-2/5 h-48 md:h-full overflow-hidden">
                      <img 
                        src={course.image_url || '/placeholder-course.png'} 
                        alt={course.title}
                        className={`w-full h-full object-cover transition-transform duration-700 ${!isUnlocked ? 'grayscale brightness-[0.2]' : 'group-hover:scale-110'}`} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-950/90 hidden md:block" />
                      
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-slate-950/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 text-slate-500 shadow-2xl">
                            <Lock size={28} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-8 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest italic border border-brand-primary/20">
                            {isUnlocked ? 'Disponível' : 'Bloqueado'}
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 italic uppercase tracking-tighter leading-tight group-hover:text-brand-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2">
                          {course.description}
                        </p>
                      </div>

                      <div className="mt-6">
                        {isUnlocked ? (
                          <Link 
                            href={`/dashboard/courses/${course.id}`}
                            className="flex items-center justify-center gap-3 w-full bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-brand-primary hover:text-white transition-all active:scale-95 group/btn uppercase italic tracking-tighter text-center"
                          >
                            Iniciar Treinamento
                            <PlayCircle size={18} className="group-hover/btn:rotate-12 transition-transform" />
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                               <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Acesso Vitalício</span>
                               <span className="text-xl font-black text-white italic">R$ {course.price || '47,90'}</span>
                            </div>
                            <button className="flex items-center gap-2 bg-slate-800 text-white font-black px-6 py-3 rounded-xl hover:bg-brand-primary transition-all text-[10px] uppercase tracking-widest italic border border-white/5">
                              Liberar <ArrowRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="max-w-md mx-auto text-center py-24 bg-slate-900/40 rounded-[3rem] border border-dashed border-white/10 px-8">
          <LayoutGrid size={32} className="text-slate-600 mx-auto mb-6" />
          <h4 className="text-white font-black uppercase italic mb-2">Catálogo Vazio</h4>
          <p className="text-slate-500 text-sm font-medium">Novos treinamentos em breve.</p>
        </div>
      )}
    </div>
  );
}