'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { 
  PlayCircle, 
  Lock, 
  Loader2, 
  Zap, 
  CheckCircle2
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';

const COURSES_DATA = [
  {
    id: 'uuid-tech-1',
    title: 'Assistente Administrativo',
    category: 'Tecnologia',
    description: 'Domine as ferramentas essenciais para o mercado de trabalho.',
    image: 'https://cdgrthjhexugxuogmyqz.supabase.co/storage/v1/object/public/capas/images.jpeg',
    price: '47,90'
  },
  {
    id: 'uuid-tech-2',
    title: 'Desenvolvedor de Sistemas',
    category: 'Tecnologia',
    description: 'Aprenda lógica e programação do zero.',
    image: 'https://cdgrthjhexugxuogmyqz.supabase.co/storage/v1/object/public/capas/images.png',
    price: '97,00'
  },
  {
    id: 'uuid-theo-1',
    title: 'Gestão de pessoas',
    category: 'Desenvolvimento pessoal',
    description: 'Aulas preparadas para te tornar um líder de sucesso.',
    image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800',
    price: '47,90'
  }
];

export default function DashboardPage() {
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- Lógica de Nível e Progresso Dinâmica ---
  const userXP = profile?.xp || 0;
  
  // Definição de Nível (Mesma lógica do Ranking)
  const currentLevel = userXP >= 3000 ? 'Lendário' : userXP >= 1000 ? 'Veterano' : 'Explorador Digital';
  
  // Cálculo de progresso para a barra (Baseado em uma meta de 3000 XP)
  const progressPercentage = Math.min(Math.round((userXP / 1000) * 100), 100);

  const categories = [...new Set(COURSES_DATA.map(c => c.category))];

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          const { data: enrolls } = await supabase.from('enrollments').select('product_id').eq('user_id', user.id);
          setProfile(prof);
          setEnrolledIds(enrolls?.map(e => e.product_id) || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen pb-90 bg-slate-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Header sincronizado com XP e Nível Real */}
        <DashboardHeader 
          userName={profile?.full_name?.split(' ')[0] || "Explorador"} 
          level={currentLevel} 
          xp={userXP} 
          progress={progressPercentage} 
        />

        {categories.map((cat) => (
          <section key={cat} className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(255,107,0,0.5)]" />
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{cat}</h2>
              </div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {COURSES_DATA.filter(c => c.category === cat).length} Cursos
              </span>
            </div>

            {/* Grid Responsiva: 1 col mobile, 2 tablet, 3 desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {COURSES_DATA.filter(c => c.category === cat).map((course, index) => {
                const isUnlocked = enrolledIds.includes(course.id);
                
                return (
                  <motion.div 
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md hover:border-brand-primary/30 transition-all duration-500 flex flex-col h-full"
                  >
                    {/* Imagem com arredondamento corrigido */}
                    <div className="relative w-full h-52 overflow-hidden rounded-t-[2.5rem] flex-shrink-0">
                      <img 
                        src={course.image} 
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!isUnlocked && 'grayscale opacity-40'}`} 
                      />
                      
                      {/* Overlay para suavizar a transição com o conteúdo */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />

                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-slate-950/60 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl">
                             <Lock className="text-white" size={24} />
                          </div>
                        </div>
                      )}
                      
                      {isUnlocked && (
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-xl shadow-lg z-20">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </div>

                    {/* Conteúdo do Card - flex-1 alinha os botões no fundo */}
                    <div className="p-8 -mt-6 relative z-10 flex flex-col flex-1 bg-gradient-to-b from-transparent to-slate-900/60">
                      <div className="mb-6 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <Zap size={14} className="text-brand-primary" fill="currentColor" />
                           <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Conteúdo Premium</span>
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase italic leading-none group-hover:text-brand-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-slate-400 text-sm font-medium mt-3 leading-relaxed line-clamp-2">
                          {course.description}
                        </p>
                      </div>

                      <div className="mt-auto pt-4 border-t border-white/5">
                        {isUnlocked ? (
                          <a 
                            href={`/dashboard/courses/${course.id}`} 
                            className="w-full flex items-center justify-center gap-3 bg-white text-slate-950 font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all active:scale-95 shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
                          >
                            <PlayCircle size={18} />
                            Continuar Assistindo
                          </a>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Acesso Total</span>
                               <span className="text-white font-black italic text-xl leading-none">R$ {course.price}</span>
                            </div>
                            <button className="flex-[2] bg-brand-primary text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,107,0,0.4)] transition-all active:scale-95">
                              Desbloquear
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
    </div>
  );
}