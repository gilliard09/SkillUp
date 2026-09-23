'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Flame, Loader2, Trophy, Target, FolderKanban, Bell, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardHeader } from '@/components/dashboard/header';
import { LevelUpModal } from '@/components/dashboard/levelupmodal';

const LEVELS = [
  { min: 5000, name: 'Lendário Digital', color: 'text-purple-400', bg:'bg-purple-400/10', border:'border-purple-400/20' },
  { min: 4000, name: 'Mestre Tech', color: 'text-orange-400', bg:'bg-orange-400/10', border:'border-orange-400/20' },
  { min: 3000, name: 'Especialista Digital', color: 'text-blue-400', bg:'bg-blue-400/10', border:'border-blue-400/20' },
  { min: 2000, name: 'Criador de Soluções', color: 'text-emerald-400', bg:'bg-emerald-400/10', border:'border-emerald-400/20' },
  { min: 1000, name: 'Desenvolvedor Iniciante', color: 'text-brand-primary', bg:'bg-brand-primary/10', border:'border-brand-primary/20' },
  { min: 0, name: 'Explorador Digital', color: 'text-slate-400', bg:'bg-slate-400/10', border:'border-white/5' },
];
const level = (xp:number) => LEVELS.find(x=>xp>=x.min) ?? LEVELS.at(-1)!;
const next = (xp:number) => [...LEVELS].reverse().find(x=>x.min>xp) ?? null;

type Course={id:string;title:string;description:string|null;image_url:string|null;category:string|null};
type Lesson={id:string;title:string;module_id:string;modules:{course_id:string;title:string}[]|null};

export default function DashboardPage(){
 const router=useRouter(); const [profile,setProfile]=useState<any>(null); const [courses,setCourses]=useState<Course[]>([]); const [resume,setResume]=useState<Lesson|null>(null); const [progress,setProgress]=useState(0); const [stats,setStats]=useState({lessons:0,quizzes:0,challenges:0,projects:0}); const [unread,setUnread]=useState(0); const [loading,setLoading]=useState(true); const [showLevelUp,setShowLevelUp]=useState(false);
 useEffect(()=>{ (async()=>{ const {data:{user}}=await supabase.auth.getUser(); if(!user){router.push('/login');return;} try{
   const [pr,en]=await Promise.all([supabase.from('profiles').select('full_name,xp,streak,last_practice_date,organization_id').eq('id',user.id).maybeSingle(),supabase.from('enrollments').select('product_id').eq('user_id',user.id)]);
   const p=pr.data; if(p){setProfile(p)}
   const ids=en.data?.map(x=>x.product_id)??[]; if(!ids.length){setLoading(false);return;}
   const [cr,mods,completed,activities,projects,notifs]=await Promise.all([
    supabase.from('courses').select('id,title,description,image_url,category').in('id',ids).order('title'),
    supabase.from('modules').select('id,course_id,title,lessons(id,title,module_id)').in('course_id',ids).order('order_index'),
    supabase.from('lesson_progress').select('lesson_id').eq('user_id',user.id).eq('is_completed',true),
    supabase.from('learning_activity').select('activity_type').eq('user_id',user.id),
    supabase.from('student_projects').select('id').eq('user_id',user.id),
    supabase.from('notifications').select('id').eq('user_id',user.id).is('read_at',null)
   ]);
   const cs=(cr.data as Course[])??[]; setCourses(cs); setUnread(notifs.data?.length??0);
   const completedIds=completed.data?.map(x=>x.lesson_id)??[];
   const all=mods.data?.flatMap((module:any)=>(module.lessons??[]).map((lesson:any)=>({
     ...lesson,
     modules:[{course_id:module.course_id,title:module.title}],
   })))??[];
   const done=new Set(completedIds); const first=all.find((x:any)=>!done.has(x.id)); setResume((first as Lesson)??null); setProgress(all.length?Math.round(done.size/all.length*100):0);
   const acts=activities.data??[]; setStats({lessons:acts.filter(x=>x.activity_type==='lesson').length,quizzes:acts.filter(x=>x.activity_type==='quiz').length,challenges:acts.filter(x=>x.activity_type==='challenge').length,projects:projects.data?.length??0});
 }catch(e){console.error(e)}finally{setLoading(false)}})()},[router]);
 const xp=profile?.xp??0, cur=level(xp), nxt=next(xp), streak=profile?.streak??0;
 if(loading)return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-brand-primary" size={40}/></div>;
 return <div className="min-h-screen pb-24 relative overflow-hidden"><div className="fixed -top-32 right-0 w-[500px] h-[500px] bg-brand-primary/10 blur-[120px] rounded-full pointer-events-none"/><LevelUpModal isOpen={showLevelUp} onClose={()=>setShowLevelUp(false)} levelData={cur}/>
  <DashboardHeader userName={profile?.full_name?.split(' ')[0]??'Explorador'} level={cur.name} xp={xp} progress={progress}/>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
   <div className="flex items-center justify-between"><div><p className="text-slate-500 text-xs font-black uppercase tracking-widest">Sua próxima ação</p><h1 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tight">Vamos continuar sua jornada?</h1></div><Link href="/dashboard/notifications" className="relative p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"><Bell size={20}/>{unread>0&&<span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-brand-primary text-white text-[9px] font-black flex items-center justify-center">{unread}</span>}</Link></div>
   {resume ? <motion.section initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/70 shadow-2xl"><div className="grid md:grid-cols-[.9fr_1.1fr] min-h-[260px]"><div className="relative min-h-[180px]"><Image src={courses.find(c=>c.id===resume.modules?.[0]?.course_id)?.image_url??'/placeholder-course.png'} alt="" fill className="object-cover brightness-50"/><div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900"/></div><div className="p-7 md:p-9 flex flex-col justify-center"><p className="text-brand-primary text-[10px] font-black uppercase tracking-widest mb-2">Continue de onde parou</p><h2 className="text-2xl md:text-3xl text-white font-black uppercase italic tracking-tight">{resume.title}</h2><p className="text-slate-500 text-xs mt-2 uppercase font-bold">{resume.modules?.[0]?.title}</p><div className="mt-6 flex items-center gap-4"><div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-brand-primary rounded-full" style={{width:`${progress}%`}}/></div><span className="text-white font-black text-sm">{progress}%</span></div><Link href={`/dashboard/lessons/${resume.id}`} className="mt-6 inline-flex items-center justify-center gap-2 bg-brand-primary text-white font-black uppercase italic text-xs rounded-2xl h-12 px-5 hover:opacity-90">Continuar <ArrowRight size={16}/></Link></div></div></motion.section> : <section className="rounded-[2rem] border border-dashed border-white/10 p-8 text-center bg-slate-900/40"><BookOpen className="mx-auto text-slate-600"/><p className="text-white font-black mt-3">Você concluiu tudo por enquanto.</p><p className="text-slate-500 text-sm mt-1">Explore seus cursos ou seus desafios.</p></section>}
   <section><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-black text-white uppercase italic">Sua evolução</h2>{nxt&&<span className="text-[10px] text-slate-500 font-bold uppercase">{nxt.min-xp} XP para {nxt.name}</span>}</div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[[BookOpen,stats.lessons,'Aulas concluídas'],[Zap,stats.quizzes,'Quizzes'],[Target,stats.challenges,'Desafios'],[FolderKanban,stats.projects,'Projetos']].map(([I,v,l]:any)=><div key={l} className="bg-slate-900/60 border border-white/10 rounded-2xl p-5"><I size={18} className="text-brand-primary mb-4"/><p className="text-2xl font-black text-white">{v}</p><p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mt-1">{l}</p></div>)}</div></section>
   <section><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-black text-white uppercase italic">Seus cursos</h2><Link href="/dashboard/jornada" className="text-brand-primary text-xs font-black uppercase">Ver jornada →</Link></div><div className="grid md:grid-cols-2 gap-4">{courses.slice(0,4).map(c=><Link href={`/dashboard/courses/${c.id}`} key={c.id} className="group relative overflow-hidden rounded-3xl h-52 border border-white/10"><Image src={c.image_url??'/placeholder-course.png'} alt={c.title} fill className="object-cover brightness-50 group-hover:scale-105 transition-transform duration-500"/><div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"/><div className="absolute bottom-0 p-6"><p className="text-white text-xl font-black uppercase italic">{c.title}</p><p className="text-slate-400 text-xs mt-1 line-clamp-1">{c.description}</p></div></Link>)}</div></section>
   <div className="grid md:grid-cols-3 gap-4"><Link href="/dashboard/challenges" className="bg-gradient-to-br from-brand-primary to-orange-600 p-6 rounded-3xl text-white"><Target/><h3 className="font-black uppercase italic text-xl mt-5">Missão da semana</h3><p className="text-white/75 text-xs mt-1">Pratique, entregue e ganhe XP.</p></Link><Link href="/dashboard/sequencia" className="bg-slate-900/70 border border-white/10 p-6 rounded-3xl"><Flame className="text-orange-400"/><p className="text-[10px] text-slate-500 uppercase font-black mt-5">Sequência</p><p className="text-3xl text-white font-black">{streak} <span className="text-sm text-slate-500">dias</span></p><p className="text-[10px] text-slate-500 mt-1">O estudo de hoje mantém sua sequência.</p></Link><Link href="/dashboard/sequencia" className="bg-slate-900/70 border border-white/10 p-6 rounded-3xl"><Zap className="text-[#7B4FBF]"/><p className="text-[10px] text-slate-500 uppercase font-black mt-5">Recurso</p><p className="text-white font-black uppercase italic text-xl">Baú de Prompts</p><p className="text-xs text-slate-500 mt-1">Ferramentas para estudar e praticar com IA.</p></Link></div>
  </div></div>;
}
