'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight,
  Clock3, Code2, GraduationCap, Loader2, LockKeyhole, Plus, Save,
  ShieldCheck, Trash2, Trophy, X, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Course = { id: string; title: string };
type ModuleItem = { id: string; title: string; course_id: string };
type LessonItem = { id: string; title: string; module_id: string };
type Step = { title: string; content: string; code?: string };
type ActivityItem = {
  id: string; organization_id: string; course_id: string; module_id: string | null;
  lesson_id: string | null; lesson_title: string | null; title: string; description: string; instructions: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado'; xp_reward: number;
  steps: Step[]; is_published: boolean; created_at: string;
};
type Progress = {
  activity_id: string; current_step: number; status: 'in_progress' | 'pending' | 'completed';
  updated_at: string; completed_at: string | null;
};

const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary placeholder:text-slate-600';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50';

function parseSteps(raw: string): Step[] {
  return raw.split(/\n\s*\n/).map((part, index) => {
    const lines = part.trim().split('\n');
    const first = lines.shift()?.trim() || `Etapa ${index + 1}`;
    return { title: first.replace(/^etapa\s*\d*\s*[:.-]?\s*/i, '') || `Etapa ${index + 1}`, content: lines.join('\n').trim() || first };
  }).filter(step => step.title.trim() && step.content.trim());
}
function stepsToText(steps: Step[]) {
  return steps.map((step, i) => `${step.title || `Etapa ${i + 1}`}\n${step.content || ''}`).join('\n\n');
}

export default function PracticalActivitiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [progressRows, setProgressRows] = useState<Progress[]>([]);
  const [selected, setSelected] = useState<ActivityItem | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [adminTab, setAdminTab] = useState<'activities' | 'create'>('activities');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', course_id: '', module_id: '', lesson_id: '', lesson_title: '', description: '', instructions: '',
    difficulty: 'Iniciante' as ActivityItem['difficulty'], xp_reward: '50',
    stepsText: 'Etapa 1: Preparação\nLeia as instruções e organize o que você vai precisar.\n\nEtapa 2: Execução\nRealize a atividade prática seguindo o conteúdo estudado.\n\nEtapa 3: Revisão e entrega\nRevise o resultado e chame o professor para validar.'
  });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) { router.push('/login'); return; }
      const user = authData.user;
      setUserId(user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('role,organization_id').eq('id', user.id).single();
      if (profileError || !profile) throw new Error('Não foi possível identificar seu perfil.');
      setRole(profile.role); setOrganizationId(profile.organization_id || '');

      let availableCourses: Course[] = [];
      if (profile.role === 'admin') {
        const { data, error: courseError } = await supabase.from('courses').select('id,title').order('title');
        if (courseError) throw courseError;
        availableCourses = (data || []) as Course[];
      } else {
        const { data: enrollmentRows, error: enrollmentError } = await supabase
          .from('enrollments').select('product_id').eq('user_id', user.id);
        if (enrollmentError) throw enrollmentError;
        const ids = (enrollmentRows || []).map(row => row.product_id);
        if (ids.length) {
          const { data, error: courseError } = await supabase.from('courses').select('id,title').in('id', ids).order('title');
          if (courseError) throw courseError;
          availableCourses = (data || []) as Course[];
        }
      }
      setCourses(availableCourses);
      const courseIds = availableCourses.map(course => course.id);
      if (courseIds.length) {
        const { data: moduleRows, error: moduleError } = await supabase.from('modules')
          .select('id,title,course_id').in('course_id', courseIds).order('order_index');
        if (moduleError) throw moduleError;
        const loadedModules = (moduleRows || []) as ModuleItem[];
        setModules(loadedModules);
        const moduleIds = loadedModules.map(module => module.id);
        if (moduleIds.length) {
          const { data: lessonRows, error: lessonError } = await supabase.from('lessons')
            .select('id,title,module_id').in('module_id', moduleIds).order('order_index');
          if (lessonError) throw lessonError;
          setLessons((lessonRows || []) as LessonItem[]);
        } else setLessons([]);
      } else { setModules([]); setLessons([]); }
      const { data: activityRows, error: activityError } = await supabase
        .from('practical_activities').select('*').order('created_at', { ascending: false });
      if (activityError) throw activityError;
      setActivities((activityRows || []) as ActivityItem[]);

      const { data: progressData, error: progressError } = await supabase
        .from('practical_activity_progress')
        .select('activity_id,current_step,status,updated_at,completed_at').eq('user_id', user.id);
      if (progressError) throw progressError;
      setProgressRows((progressData || []) as Progress[]);
    } catch (e: any) {
      console.error('Erro ao carregar atividades práticas:', e);
      setError(e?.message || 'Não foi possível carregar as atividades.');
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const isAdmin = role === 'admin';
  const progressFor = (activityId: string) => progressRows.find(p => p.activity_id === activityId);
  const visibleActivities = useMemo(() => activities.filter(a =>
    isAdmin ? true : a.is_published && courses.some(c => c.id === a.course_id)
  ), [activities, isAdmin, courses]);
  const completedCount = visibleActivities.filter(a => progressFor(a.id)?.status === 'completed').length;
  const startedCount = visibleActivities.filter(a => progressFor(a.id) && progressFor(a.id)?.status !== 'completed').length;

  const updateProgress = async (activity: ActivityItem, nextStep: number): Promise<boolean> => {
    if (!userId || progressFor(activity.id)?.status === 'completed') return true;
    const current = progressFor(activity.id);
    const safeStep = Math.max(0, Math.min(nextStep, activity.steps.length - 1));
    const { data, error: saveError } = await supabase.rpc('save_practical_activity_progress', {
      p_activity_id: activity.id,
      p_current_step: safeStep
    });
    if (saveError) { setError(saveError.message || 'Não foi possível salvar seu progresso. Tente novamente.'); return false; }
    const payload = {
      activity_id: activity.id, user_id: userId,
      current_step: Number(data?.current_step ?? safeStep),
      status: (data?.completed ? 'completed' : 'in_progress') as Progress['status'],
      updated_at: new Date().toISOString(),
      completed_at: current?.completed_at || null
    };
    setProgressRows(rows => {
      const rest = rows.filter(p => p.activity_id !== activity.id);
      return [...rest, payload];
    });
    return true;
  };

  const openActivity = (activity: ActivityItem) => {
    setError(''); setNotice(''); setPin(''); setPinOpen(false);
    setSelected(activity);
    const p = progressFor(activity.id);
    const initialStep = Math.min(p?.current_step ?? 0, Math.max(0, activity.steps.length - 1));
    setStepIndex(initialStep);
    if (p?.status !== 'completed') void updateProgress(activity, initialStep);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({
      title: '', course_id: courses[0]?.id || '', module_id: '', lesson_id: '', lesson_title: '', description: '', instructions: '',
      difficulty: 'Iniciante', xp_reward: '50',
      stepsText: 'Etapa 1: Preparação\nLeia as instruções e organize o que você vai precisar.\n\nEtapa 2: Execução\nRealize a atividade prática seguindo o conteúdo estudado.\n\nEtapa 3: Revisão e entrega\nRevise o resultado e chame o professor para validar.'
    });
    setAdminTab('create');
  };

  const startEdit = (activity: ActivityItem) => {
    setEditingId(activity.id);
    setForm({
      title: activity.title, course_id: activity.course_id, module_id: activity.module_id || '', lesson_id: activity.lesson_id || '', lesson_title: activity.lesson_title || '', description: activity.description || '',
      instructions: activity.instructions || '', difficulty: activity.difficulty,
      xp_reward: String(activity.xp_reward), stepsText: stepsToText(activity.steps || [])
    });
    setAdminTab('create');
  };

  const saveActivity = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    const steps = parseSteps(form.stepsText);
    if (!organizationId) { setError('Seu usuário administrador precisa estar vinculado a uma escola (organization_id).'); return; }
    if (!form.course_id) { setError('Selecione um curso.'); return; }
    if (steps.length < 1) { setError('Adicione pelo menos uma etapa. Separe as etapas com uma linha em branco.'); return; }
    setSaving(true);
    try {
      const payload = {
        organization_id: organizationId, course_id: form.course_id,
        module_id: form.module_id || null, lesson_id: form.lesson_title.trim() ? null : (form.lesson_id || null), lesson_title: form.lesson_title.trim() || null,
        title: form.title.trim(), description: form.description.trim(),
        instructions: form.instructions.trim(), difficulty: form.difficulty,
        xp_reward: Math.max(0, Math.min(1000, Number(form.xp_reward) || 0)),
        steps, updated_at: new Date().toISOString()
      };
      const result = editingId
        ? await supabase.from('practical_activities').update(payload).eq('id', editingId)
        : await supabase.from('practical_activities').insert({ ...payload, created_by: userId, is_published: false });
      if (result.error) throw result.error;
      setNotice(editingId ? 'Atividade atualizada.' : 'Atividade criada como rascunho. Publique quando estiver pronta.');
      setAdminTab('activities'); await load();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Não foi possível salvar a atividade.');
    } finally { setSaving(false); }
  };

  const togglePublish = async (activity: ActivityItem) => {
    setError(''); setNotice('');
    const { error: updateError } = await supabase.from('practical_activities')
      .update({ is_published: !activity.is_published, updated_at: new Date().toISOString() }).eq('id', activity.id);
    if (updateError) { setError(updateError.message); return; }
    setNotice(activity.is_published ? 'Atividade retirada do ar.' : 'Atividade publicada para alunos matriculados.');
    await load();
  };

  const deleteActivity = async (activity: ActivityItem) => {
    if (!window.confirm(`Excluir "${activity.title}" e o progresso vinculado a ela? Esta ação não pode ser desfeita.`)) return;
    const { error: deleteError } = await supabase.from('practical_activities').delete().eq('id', activity.id);
    if (deleteError) { setError(deleteError.message); return; }
    if (selected?.id === activity.id) setSelected(null);
    setNotice('Atividade excluída. O progresso desta atividade também foi removido.');
    await load();
  };

  const complete = async () => {
    if (!selected || !pin.trim()) return;
    setSaving(true); setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('complete_practical_activity_secure', {
        p_activity_id: selected.id, p_validation_pin: pin.trim()
      });
      if (rpcError) throw rpcError;
      setNotice(data?.newly_completed
        ? `Atividade concluída! Você ganhou +${data?.xp_earned ?? 0} XP.`
        : 'Esta atividade já estava concluída; nenhum XP foi duplicado.');
      setPin(''); setPinOpen(false); await load();
      const { data: fresh } = await supabase.from('practical_activities').select('*').eq('id', selected.id).single();
      if (fresh) setSelected(fresh as ActivityItem);
    } catch (e: any) {
      setError(e?.message?.replace(/^.*?: /, '') || 'Não foi possível validar a atividade.');
    } finally { setSaving(false); }
  };

  const currentStep = selected?.steps?.[stepIndex];

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={38} /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-brand-primary"><Activity size={20}/><span className="text-xs font-black uppercase tracking-[.2em]">SkillUp • Aprender fazendo</span></div>
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-white sm:text-4xl">Atividade prática</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Atividades guiadas por etapas. Seu progresso fica salvo e não altera suas aulas ou conquistas anteriores.
          </p>
        </div>
        {isAdmin && <button onClick={startCreate} className={buttonClass + ' bg-brand-primary text-white hover:brightness-110'}><Plus size={16}/> Nova atividade</button>}
      </header>

      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"><X size={18} className="mt-0.5 shrink-0"/><span>{error}</span><button className="ml-auto" onClick={() => setError('')} aria-label="Fechar erro"><X size={16}/></button></div>}
      {notice && <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"><CheckCircle2 size={18} className="shrink-0"/><span>{notice}</span><button className="ml-auto" onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={16}/></button></div>}

      {isAdmin && <div className="flex gap-2 border-b border-white/10 pb-3">
        <button onClick={() => setAdminTab('activities')} className={buttonClass + ' ' + (adminTab === 'activities' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white')}>Atividades cadastradas</button>
        <button onClick={startCreate} className={buttonClass + ' ' + (adminTab === 'create' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white')}>{editingId ? 'Editar atividade' : 'Cadastrar atividade'}</button>
      </div>}

      {isAdmin && adminTab === 'create' ? (
        <form onSubmit={saveActivity} className="space-y-5 rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-7">
          <div><h2 className="text-xl font-black uppercase italic text-white">{editingId ? 'Editar atividade' : 'Nova atividade prática'}</h2><p className="mt-1 text-sm text-slate-400">Cada bloco separado por uma linha em branco será uma etapa.</p></div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-xs font-bold text-slate-400">Título da atividade<input required minLength={3} maxLength={160} className={inputClass} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ex.: Crie sua primeira página web"/></label>
            <label className="space-y-2 text-xs font-bold text-slate-400">Curso<select required className={inputClass} value={form.course_id} onChange={e=>setForm({...form,course_id:e.target.value,module_id:'',lesson_id:'',lesson_title:''})}><option value="">Selecione um curso</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
            <label className="space-y-2 text-xs font-bold text-slate-400">Módulo (opcional)<select className={inputClass} value={form.module_id} onChange={e=>setForm({...form,module_id:e.target.value,lesson_id:'',lesson_title:''})}><option value="">Sem módulo específico</option>{modules.filter(m=>m.course_id===form.course_id).map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
            <label className="space-y-2 text-xs font-bold text-slate-400">Aula existente (opcional)<select className={inputClass} value={form.lesson_id} onChange={e=>setForm({...form,lesson_id:e.target.value,lesson_title:''})}><option value="">Sem aula específica</option>{lessons.filter(l=>modules.some(m=>m.id===l.module_id && m.course_id===form.course_id) && (!form.module_id || l.module_id===form.module_id)).map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select><span className="block font-normal text-slate-600">Escolha uma aula cadastrada no curso e, se quiser, filtre pelo módulo.</span></label>
            <label className="space-y-2 text-xs font-bold text-slate-400">Ou escreva o nome da aula (opcional)<input maxLength={160} className={inputClass} value={form.lesson_title} onChange={e=>setForm({...form,lesson_title:e.target.value,lesson_id:''})} placeholder="Ex.: Introdução ao HTML"/><span className="block font-normal text-slate-600">Se preencher este campo, o nome digitado será usado no lugar da aula existente.</span></label>
            <label className="space-y-2 text-xs font-bold text-slate-400">Nível<select className={inputClass} value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value as ActivityItem['difficulty']})}><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select></label>
            <label className="space-y-2 text-xs font-bold text-slate-400">Recompensa em XP<input type="number" min="0" max="1000" className={inputClass} value={form.xp_reward} onChange={e=>setForm({...form,xp_reward:e.target.value})}/></label>
          </div>
          <label className="block space-y-2 text-xs font-bold text-slate-400">Resumo<textarea rows={2} className={inputClass} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="O que o aluno vai construir ou aprender?"/></label>
          <label className="block space-y-2 text-xs font-bold text-slate-400">Orientações gerais<textarea rows={3} className={inputClass} value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})} placeholder="Materiais necessários, objetivo e critérios de conclusão."/></label>
          <label className="block space-y-2 text-xs font-bold text-slate-400">Etapas<textarea required rows={12} className={inputClass + ' font-mono leading-6'} value={form.stepsText} onChange={e=>setForm({...form,stepsText:e.target.value})} placeholder={'Etapa 1: Planejamento\nExplique o que fazer.\n\nEtapa 2: Execução\nDescreva a tarefa.'}/><span className="block font-normal text-slate-600">Formato: primeira linha de cada bloco é o título; linhas seguintes são as instruções. Separe cada etapa com uma linha em branco.</span></label>
          <div className="flex flex-wrap gap-3"><button type="submit" disabled={saving} className={buttonClass + ' bg-brand-primary text-white'}>{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>} Salvar rascunho</button><button type="button" onClick={()=>{setEditingId(null);setAdminTab('activities')}} className={buttonClass+' border border-white/10 text-slate-300'}>Cancelar</button></div>
        </form>
      ) : selected && !isAdmin ? (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
          <div className="border-b border-white/10 p-5 sm:p-7">
            <button onClick={()=>{setSelected(null);setPinOpen(false);setError('')}} className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"><ArrowLeft size={16}/> Todas as atividades</button>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider"><span className="rounded-full bg-brand-primary/10 px-3 py-1 text-brand-primary">{selected.difficulty}</span><span className="rounded-full bg-yellow-500/10 px-3 py-1 text-yellow-300"><Trophy size={12} className="mr-1 inline"/> {selected.xp_reward} XP</span><span className="rounded-full bg-white/5 px-3 py-1 text-slate-400">{stepIndex+1} de {selected.steps.length} etapas</span></div>
            <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">{selected.title}</h2>
            {selected.description && <p className="mt-2 text-sm text-slate-400">{selected.description}</p>}
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-brand-primary transition-all" style={{width: `${((stepIndex+1)/selected.steps.length)*100}%`}}/></div>
          </div>
          <div className="p-5 sm:p-8">
            {selected.instructions && <div className="mb-6 rounded-2xl border border-brand-primary/15 bg-brand-primary/5 p-4"><p className="mb-2 text-[10px] font-black uppercase tracking-widest text-brand-primary">Orientações gerais</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{selected.instructions}</p></div>}
            <div className="min-h-64">
              <p className="text-xs font-black uppercase tracking-widest text-brand-primary">Etapa {stepIndex+1}</p>
              <h3 className="mt-2 text-xl font-black text-white">{currentStep?.title}</h3>
              <div className="prose prose-invert mt-5 max-w-none whitespace-pre-wrap text-sm leading-7 text-slate-300">{currentStep?.content}</div>
              {currentStep?.code && <pre className="mt-5 overflow-x-auto rounded-2xl bg-black/50 p-4 text-sm text-emerald-200"><code>{currentStep.code}</code></pre>}
            </div>
            {progressFor(selected.id)?.status === 'completed' ? (
              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300"><CheckCircle2 size={22}/><div><p className="font-black">Atividade concluída</p><p className="text-xs text-emerald-200/70">Seu progresso foi registrado. O XP desta atividade não será duplicado.</p></div></div>
            ) : pinOpen ? (
              <div className="mt-8 space-y-4 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-5">
                <div className="flex items-center gap-3"><LockKeyhole className="text-brand-primary"/><div><h4 className="font-black text-white">Validação do professor</h4><p className="text-xs text-slate-400">Peça ao professor para digitar o PIN. A validação ocorre no servidor.</p></div></div>
                <div className="flex gap-2"><input type={showPin?'text':'password'} autoComplete="off" value={pin} onChange={e=>setPin(e.target.value)} className={inputClass} placeholder="PIN do professor"/><button type="button" onClick={()=>setShowPin(!showPin)} className="rounded-xl border border-white/10 px-3 text-slate-400" aria-label={showPin?'Ocultar PIN':'Mostrar PIN'}>{showPin?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
                <div className="flex flex-wrap gap-3"><button type="button" disabled={saving||!pin.trim()} onClick={complete} className={buttonClass+' bg-brand-primary text-white'}>{saving?<Loader2 size={16} className="animate-spin"/>:<ShieldCheck size={16}/>} Validar e concluir</button><button type="button" onClick={()=>{setPinOpen(false);setPin('')}} className={buttonClass+' border border-white/10 text-slate-300'}>Cancelar</button></div>
              </div>
            ) : (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                <button type="button" disabled={stepIndex===0||saving} onClick={async()=>{const next=stepIndex-1;if(await updateProgress(selected,next))setStepIndex(next)}} className={buttonClass+' border border-white/10 text-slate-300 hover:bg-white/5'}><ArrowLeft size={16}/> Voltar</button>
                {stepIndex < selected.steps.length-1 ? <button type="button" disabled={saving} onClick={async()=>{const next=stepIndex+1;if(await updateProgress(selected,next))setStepIndex(next)}} className={buttonClass+' bg-brand-primary text-white'}>Próxima etapa <ArrowRight size={16}/></button> : <button type="button" disabled={saving} onClick={async()=>{if(await updateProgress(selected,stepIndex))setPinOpen(true)}} className={buttonClass+' bg-emerald-600 text-white hover:bg-emerald-500'}><ShieldCheck size={16}/> Concluir atividade</button>}
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {!isAdmin && <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4"><p className="text-xs text-slate-500">Disponíveis</p><p className="mt-1 text-2xl font-black text-white">{visibleActivities.length}</p></div><div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4"><p className="text-xs text-slate-500">Em andamento</p><p className="mt-1 text-2xl font-black text-white">{startedCount}</p></div><div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4"><p className="text-xs text-slate-500">Concluídas</p><p className="mt-1 text-2xl font-black text-emerald-300">{completedCount}</p></div></div>}
          {isAdmin && adminTab === 'activities' && <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-white">Atividades cadastradas</h2><p className="text-sm text-slate-500">Rascunhos não aparecem para os alunos.</p></div><button onClick={startCreate} className={buttonClass+' bg-brand-primary text-white'}><Plus size={16}/> Criar</button></div>}
          {visibleActivities.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center"><BookOpen size={36} className="mx-auto text-slate-600"/><h3 className="mt-4 font-black text-white">{isAdmin?'Nenhuma atividade cadastrada':'Nenhuma atividade disponível ainda'}</h3><p className="mt-2 text-sm text-slate-500">{isAdmin?'Crie uma atividade, revise as etapas e publique quando estiver pronta.':'Quando sua escola publicar atividades para seus cursos, elas aparecerão aqui.'}</p>{isAdmin&&<button onClick={startCreate} className={buttonClass+' mt-5 bg-brand-primary text-white'}><Plus size={16}/> Nova atividade</button>}</div> :
            <div className="grid gap-4 md:grid-cols-2">
              {visibleActivities.map(activity => {
                const p=progressFor(activity.id); const course=courses.find(c=>c.id===activity.course_id);
                return <article key={activity.id} className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-brand-primary/30">
                  <div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary"><Code2 size={22}/></div><div className="flex flex-wrap justify-end gap-2"><span className="rounded-full bg-white/5 px-3 py-1 text-[9px] font-black uppercase text-slate-400">{activity.difficulty}</span>{isAdmin&&<span className={'rounded-full px-3 py-1 text-[9px] font-black uppercase '+(activity.is_published?'bg-emerald-500/10 text-emerald-300':'bg-amber-500/10 text-amber-300')}>{activity.is_published?'Publicada':'Rascunho'}</span>}</div></div>
                  <h3 className="mt-4 text-lg font-black text-white">{activity.title}</h3><p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-400">{activity.description||activity.instructions||'Atividade prática guiada por etapas.'}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-slate-500"><span className="inline-flex items-center gap-1"><GraduationCap size={13}/>{course?.title||'Curso'}</span>{activity.module_id&&<span className="inline-flex items-center gap-1"><BookOpen size={13}/>{modules.find(m=>m.id===activity.module_id)?.title||'Módulo'}</span>}{(activity.lesson_title || activity.lesson_id)&&<span className="inline-flex items-center gap-1"><BookOpen size={13}/>{activity.lesson_title || lessons.find(l=>l.id===activity.lesson_id)?.title || 'Aula'}</span>}<span className="inline-flex items-center gap-1"><BookOpen size={13}/>{activity.steps?.length||0} etapas</span><span className="inline-flex items-center gap-1 text-yellow-300"><Trophy size={13}/>{activity.xp_reward} XP</span></div>
                  {!isAdmin&&p&&<div className="mt-4 flex items-center gap-2 text-xs">{p.status==='completed'?<span className="inline-flex items-center gap-1 font-bold text-emerald-300"><CheckCircle2 size={14}/> Concluída</span>:<span className="inline-flex items-center gap-1 font-bold text-brand-primary"><Clock3 size={14}/> Em andamento · etapa {p.current_step+1}</span>}</div>}
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                    {isAdmin ? <><button onClick={()=>startEdit(activity)} className={buttonClass+' border border-white/10 text-slate-300'}>Editar</button><button onClick={()=>void togglePublish(activity)} className={buttonClass+' '+(activity.is_published?'border border-amber-500/20 text-amber-300':'bg-emerald-600 text-white')}>{activity.is_published?'Despublicar':'Publicar'}</button><button onClick={()=>void deleteActivity(activity)} className={buttonClass+' border border-red-500/20 text-red-300'}><Trash2 size={14}/></button></> : <button onClick={()=>openActivity(activity)} className={buttonClass+' w-full bg-brand-primary text-white'}>{p?.status==='completed'?'Rever atividade':'Continuar atividade'} <ChevronRight size={16}/></button>}
                  </div>
                </article>;
              })}
            </div>}
        </>
      )}
    </div>
  );
}
