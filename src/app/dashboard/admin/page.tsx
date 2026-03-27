'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import {
  PlusCircle, Video, CheckCircle2,
  Trash2, Loader2, Book,
  Briefcase, Users, Trophy, BookOpen,
  UserPlus, ShieldCheck, AlertCircle, Eye, Copy, Pencil, X,
  Settings, Lock, KeyRound, Sparkles, Building2, Link, FileText
} from 'lucide-react';

// Botão simples para substituir o que está faltando
const Button = ({ children, className, disabled, ...props }: any) => (
  <button 
    disabled={disabled}
    className={`${className} disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95`}
    {...props}
  >
    {children}
  </button>
);

// ============================================================
// TIPOS
// ============================================================
type Organization = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

type Course = {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string;
};

type Module = {
  id: string;
  title: string;
  course_id: string;
  order_index: number;
  courses?: { title: string };
};

type Lesson = {
  id: string;
  title: string;
  content: string;
  video_url: string;
  activity_pdf_url: string;
  module_id: string;
  order_index: number;
  modules?: { title: string };
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  category: string;
  difficulty: string;
};

type Submission = {
  id: string;
  user_id: string;
  status: string;
  solution_url: string;
  challenges?: { title: string; xp_reward: number };
  profiles?: { full_name: string; xp: number };
};

type GeneratedQuestion = {
  question_text: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_option_index: number;
  points: number;
};

// ============================================================
// ESTADO INICIAL DOS FORMULÁRIOS
// ============================================================
const INITIAL_COURSE    = { title: '', category: 'Tecnologia', description: '', image_url: '' };
const INITIAL_MODULE    = { title: '', course_id: '' };
const INITIAL_LESSON    = { title: '', content: '', video_url: '', activity_pdf_url: '', module_id: '', order: 1 };
const INITIAL_STUDENT   = { email: '', password: '', fullName: '', selectedCourse: '' };
const INITIAL_CHALLENGE = { title: '', description: '', xp_reward: 50, category: 'Tecnologia', difficulty: 'Fácil' };
const INITIAL_ORG       = { name: '', slug: '' };

// ============================================================
// MODAL GENÉRICO DE CONFIRMAÇÃO
// ============================================================
function ConfirmModal({
  title,
  description,
  onConfirm,
  onClose,
  loading,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="h-12 w-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 flex-shrink-0">
            <Trash2 size={22} />
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div>
          <h3 className="text-white font-black text-xl uppercase mb-2">{title}</h3>
          <p className="text-slate-400 text-sm">{description}</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={onClose} variant="outline" className="flex-1 border-white/10 text-slate-400 rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Excluir'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL DE DUPLICAR AULA
// ============================================================
function DuplicateLessonModal({
  lesson,
  modules,
  onConfirm,
  onClose,
}: {
  lesson: Lesson;
  modules: Module[];
  onConfirm: (moduleId: string) => void;
  onClose: () => void;
}) {
  const [selectedModule, setSelectedModule] = useState(lesson.module_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl space-y-6">
        <h3 className="text-white font-black text-xl uppercase">Duplicar Aula</h3>
        <p className="text-slate-400 text-sm">
          Destino para <span className="text-white font-bold">"{lesson.title}"</span>
        </p>
        <select
          value={selectedModule}
          onChange={e => setSelectedModule(e.target.value)}
          className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white text-sm"
        >
          {modules.map(m => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
        <div className="flex gap-4">
          <Button onClick={onClose} variant="outline" className="flex-1 border-white/10 text-slate-400 rounded-xl">
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(selectedModule)} className="flex-1 bg-brand-primary text-white font-bold rounded-xl">
            Duplicar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function AdminPage() {
  const router = useRouter();

  const [activeTab, setActiveTab]       = useState<'content' | 'students' | 'challenges' | 'approvals' | 'settings' | 'quiz'>('content');
  const [loading, setLoading]           = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [approvingId, setApprovingId]   = useState<string | null>(null);
  const [message, setMessage]           = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [duplicateTarget, setDuplicateTarget]     = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget]           = useState<Challenge | null>(null);

  // Dados
  const [courses, setCourses]         = useState<Course[]>([]);
  const [modules, setModules]         = useState<Module[]>([]);
  const [lessons, setLessons]         = useState<Lesson[]>([]);
  const [challenges, setChallenges]   = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Edição de curso
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Formulários
  const [newCourse,    setNewCourse]    = useState(INITIAL_COURSE);
  const [newModule,    setNewModule]    = useState(INITIAL_MODULE);
  const [newLesson,    setNewLesson]    = useState(INITIAL_LESSON);
  const [studentForm,  setStudentForm]  = useState(INITIAL_STUDENT);
  const [newChallenge, setNewChallenge] = useState(INITIAL_CHALLENGE);
  const [newOrg,       setNewOrg]       = useState(INITIAL_ORG);

  // Configurações
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showPasswords,   setShowPasswords]   = useState(false);

  // Quiz IA
  const [quizLesson,        setQuizLesson]        = useState('');
  const [generatedQs,       setGeneratedQs]       = useState<GeneratedQuestion[]>([]);
  const [generatingQuiz,    setGeneratingQuiz]    = useState(false);
  const [savingQuiz,        setSavingQuiz]        = useState(false);
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { router.push('/dashboard'); return; }
      setAuthChecking(false);
    };
    checkAdmin();
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      const [courRes, modRes, lesRes, challRes, subRes, orgRes] = await Promise.all([
        supabase.from('courses').select('*').order('title'),
        supabase.from('modules').select('*, courses(title)').order('order_index'),
        supabase.from('lessons').select('*, modules(title)').order('created_at', { ascending: false }),
        supabase.from('challenges').select('*').order('created_at', { ascending: false }),
        supabase.from('challenge_submissions').select('*, challenges(title, xp_reward), profiles(full_name, xp)').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('organizations').select('*').order('name'),
      ]);

      if (courRes.data)  setCourses(courRes.data);
      if (modRes.data)   setModules(modRes.data);
      if (lesRes.data)   setLessons(lesRes.data);
      if (challRes.data) setChallenges(challRes.data);
      if (subRes.data)   setSubmissions(subRes.data);
      if (orgRes.data)   setOrganizations(orgRes.data);
    } catch {
      notify('error', 'Erro ao carregar dados.');
    }
  }, []);

  useEffect(() => {
    if (!authChecking) loadData();
  }, [authChecking, loadData]);

  const loadCurrentPassword = useCallback(async () => {
    const { data } = await supabase.from('settings').select('value').eq('key', 'validation_password').single();
    if (data) setCurrentPassword(data.value);
  }, []);

  useEffect(() => {
    if (activeTab === 'settings') loadCurrentPassword();
  }, [activeTab, loadCurrentPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) { notify('error', 'Mínimo 4 caracteres.'); return; }
    if (newPassword !== confirmPassword) { notify('error', 'Senhas não coincidem.'); return; }
    setLoadingPassword(true);
    try {
      await supabase.from('settings').update({ value: newPassword, updated_at: new Date().toISOString() }).eq('key', 'validation_password');
      notify('success', 'Senha atualizada!');
      setCurrentPassword(newPassword); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) { notify('error', err.message); } finally { setLoadingPassword(false); }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('organizations').insert([newOrg]);
      if (error) throw error;
      notify('success', 'Escola criada!');
      setNewOrg(INITIAL_ORG);
      await loadData();
    } catch (err: any) { notify('error', err.message); } finally { setLoading(false); }
  };

  const copyInviteLink = (courseId: string) => {
    const link = `${window.location.origin}/register?course=${courseId}`;
    navigator.clipboard.writeText(link);
    notify('success', 'Link copiado!');
  };

  const handleDuplicateLesson = async (moduleId: string) => {
    if (!duplicateTarget) return;
    setLoading(true);
    try {
      await supabase.from('lessons').insert([{
        title: `${duplicateTarget.title} (Cópia)`,
        content: duplicateTarget.content,
        video_url: duplicateTarget.video_url,
        activity_pdf_url: duplicateTarget.activity_pdf_url,
        module_id: moduleId,
        order_index: duplicateTarget.order_index,
      }]);
      notify('success', 'Aula duplicada!');
      await loadData();
    } catch (err: any) { notify('error', err.message); } finally { setLoading(false); setDuplicateTarget(null); }
  };

  const handleApproveSubmission = async (submission: Submission) => {
    setApprovingId(submission.id);
    try {
      await supabase.from('challenge_submissions').update({ status: 'approved' }).eq('id', submission.id);
      const xpGanho = Number(submission.challenges?.xp_reward) || 0;
      const xpAtual = Number(submission.profiles?.xp) || 0;
      await supabase.from('profiles').update({ xp: xpAtual + xpGanho }).eq('id', submission.user_id);
      notify('success', `Aprovado! +${xpGanho} XP.`);
      await loadData();
    } catch { notify('error', 'Erro.'); } finally { setApprovingId(null); }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { title: newCourse.title, category: newCourse.category, description: newCourse.description || '', image_url: newCourse.image_url || '' };
    try {
      const { error } = editingCourseId ? await supabase.from('courses').update(payload).eq('id', editingCourseId) : await supabase.from('courses').insert([payload]);
      if (error) throw error;
      notify('success', 'Curso salvo!');
      setNewCourse(INITIAL_COURSE); setEditingCourseId(null); await loadData();
    } catch (err: any) { notify('error', err.message); } finally { setLoading(false); }
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data: maxOrder } = await supabase.from('modules').select('order_index').eq('course_id', newModule.course_id).order('order_index', { ascending: false }).limit(1).maybeSingle();
      await supabase.from('modules').insert([{ title: newModule.title, course_id: newModule.course_id, order_index: (maxOrder?.order_index ?? 0) + 1 }]);
      notify('success', 'Módulo criado!'); setNewModule(INITIAL_MODULE); await loadData();
    } catch (err: any) { notify('error', err.message); } finally { setLoading(false); }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data: maxOrder } = await supabase.from('lessons').select('order_index').eq('module_id', newLesson.module_id).order('order_index', { ascending: false }).limit(1).maybeSingle();
      await supabase.from('lessons').insert([{ ...newLesson, order_index: (maxOrder?.order_index ?? 0) + 1 }]);
      notify('success', 'Aula publicada!'); setNewLesson(INITIAL_LESSON); await loadData();
    } catch (err: any) { notify('error', err.message); } finally { setLoading(false); }
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await supabase.from('challenges').insert([{ ...newChallenge, xp_reward: Number(newChallenge.xp_reward) }]);
      notify('success', 'Desafio criado!'); setNewChallenge(INITIAL_CHALLENGE); await loadData();
    } catch (err: any) { notify('error', err.message); } finally { setLoading(false); }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.selectedCourse) { notify('error', 'Selecione um curso.'); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ email: studentForm.email, password: studentForm.password, fullName: studentForm.fullName, courseId: studentForm.selectedCourse }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      notify('success', 'Aluno criado!'); setStudentForm(INITIAL_STUDENT);
    } catch (err: any) { notify('error', err.message); } finally { setLoading(false); }
  };

  const handleDeleteChallenge = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await supabase.from('challenges').delete().eq('id', deleteTarget.id);
      notify('success', 'Excluído.'); await loadData();
    } catch (err: any) { notify('error', err.message); } finally { setDeletingId(null); setDeleteTarget(null); }
  };

  const handleGenerateQuiz = async () => {
  if (!quizLesson) return alert("Selecione uma aula primeiro!");
  
  setGeneratingQuiz(true);
  try {
    const lesson = lessons.find(l => l.id === quizLesson);
    
    const response = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonTitle: lesson?.title,
        lessonContent: lesson?.content || "Conteúdo geral da aula", // Garante que não vá vazio
        questionCount: 5
      }),
    });

    const data = await response.json();

    if (data.questions) {
      setGeneratedQs(data.questions);
    } else {
      throw new Error(data.error || "Erro desconhecido");
    }
  } catch (error: any) {
    console.error("Erro ao gerar quiz:", error);
    alert("Não foi possível gerar o quiz com IA: " + error.message);
  } finally {
    setGeneratingQuiz(false);
  }
};

  const handleSaveQuiz = async () => {
    if (!quizLesson || generatedQs.length === 0) return;
    setSavingQuiz(true);
    try {
      const { data: existingQuiz } = await supabase.from('quizzes').select('id').eq('lesson_id', quizLesson).maybeSingle();
      let quizId = existingQuiz?.id;
      if (!quizId) {
        const lesson = lessons.find(l => l.id === quizLesson);
        const { data: newQuiz } = await supabase.from('quizzes').insert([{ lesson_id: quizLesson, title: `Quiz — ${lesson?.title ?? ''}` }]).select('id').single();
        quizId = newQuiz.id;
      }
      await supabase.from('questions').insert(generatedQs.map(q => ({ quiz_id: quizId, question_text: q.question_text, type: q.type, options: q.options, correct_option_index: q.correct_option_index, points: q.points })));
      notify('success', 'Quiz salvo!'); setGeneratedQs([]); setQuizLesson('');
    } catch (err: any) { notify('error', err.message); } finally { setSavingQuiz(false); }
  };

  const updateQuestion = (index: number, field: keyof GeneratedQuestion, value: any) => {
    setGeneratedQs(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (index: number) => {
    setGeneratedQs(prev => prev.filter((_, i) => i !== index));
  };

  if (authChecking) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-brand-primary" size={40} /></div>;

  return (
    <div className="space-y-10 pb-8">
      {duplicateTarget && <DuplicateLessonModal lesson={duplicateTarget} modules={modules} onConfirm={handleDuplicateLesson} onClose={() => setDuplicateTarget(null)} />}
      {deleteTarget && <ConfirmModal title="Excluir Desafio" description={`Tem certeza?`} onConfirm={handleDeleteChallenge} onClose={() => setDeleteTarget(null)} loading={deletingId === deleteTarget.id} />}
      
      {message && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 font-bold uppercase text-xs ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tight uppercase">Painel Admin</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Gestão de Alunos e Conteúdo</p>
        </div>
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/5 shadow-2xl overflow-x-auto">
          {[
            { key: 'content',    label: 'Conteúdo',   icon: <BookOpen size={16} /> },
            { key: 'students',   label: 'Alunos',      icon: <Users size={16} /> },
            { key: 'challenges', label: 'Desafios',    icon: <Trophy size={16} /> },
            { key: 'approvals',  label: 'Aprovações',  icon: <ShieldCheck size={16} /> },
            { key: 'quiz',       label: 'Quiz IA',     icon: <Sparkles size={16} /> },
            { key: 'settings',   label: 'Config',      icon: <Settings size={16} /> },
          ].map((tab: any) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/50 border border-brand-primary/20 p-6 rounded-[2rem]">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Briefcase className="text-brand-primary" size={20} />{editingCourseId ? 'Editar Curso' : 'Novo Curso'}</h2>
              <form onSubmit={handleSaveCourse} className="space-y-4">
                <input required value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="Título" />
                <select value={newCourse.category} onChange={e => setNewCourse({ ...newCourse, category: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-sm">
                  <option value="Tecnologia">Tecnologia</option><option value="Administrativo">Administrativo</option><option value="Teologia">Teologia</option>
                </select>
                <input value={newCourse.image_url} onChange={e => setNewCourse({ ...newCourse, image_url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="URL da Capa" />
                <textarea value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm h-20" placeholder="Descrição..." />
                <Button disabled={loading} className={`w-full font-bold h-12 rounded-xl uppercase ${editingCourseId ? 'bg-amber-500' : 'bg-brand-primary'} text-white`}>
                  {loading ? <Loader2 className="animate-spin" size={16} /> : editingCourseId ? 'Atualizar' : 'Salvar'}
                </Button>
              </form>
            </div>

            {courses.map(course => (
              <div key={course.id} className="bg-slate-900/30 border border-white/5 p-6 rounded-[2rem] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-bold truncate pr-4">{course.title}</span>
                  <div className="flex gap-2">
                    <button onClick={() => copyInviteLink(course.id)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-brand-primary" title="Copiar Link"><Link size={14}/></button>
                    <button onClick={() => setEditingCourseId(course.id)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-amber-500"><Pencil size={14}/></button>
                  </div>
                </div>
                <div className="flex flex-col items-center p-4 bg-white rounded-2xl">
                  <QRCodeSVG value={`${window.location.origin}/register?course=${course.id}`} size={100} />
                  <p className="text-[9px] text-slate-900 font-black mt-2 uppercase">Convite via QR</p>
                </div>
              </div>
            ))}

            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem]">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><PlusCircle className="text-brand-secondary" size={20} /> Novo Módulo</h2>
              <form onSubmit={handleSaveModule} className="space-y-4">
                <select required value={newModule.course_id} onChange={e => setNewModule({ ...newModule, course_id: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white text-sm">
                  <option value="">Curso...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <input required value={newModule.title} onChange={e => setNewModule({ ...newModule, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm" placeholder="Nome do Módulo" />
                <Button disabled={loading} className="w-full bg-slate-800 text-white font-bold h-12 rounded-xl">Criar Módulo</Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2"><Video className="text-brand-primary" size={24} /> Publicar Aula</h2>
              <form onSubmit={handleSaveLesson} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select required value={newLesson.module_id} onChange={e => setNewLesson({ ...newLesson, module_id: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white">
                  <option value="">Módulo...</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.title} ({m.courses?.title})</option>)}
                </select>
                <input required value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="Título" />
                <input value={newLesson.video_url} onChange={e => setNewLesson({ ...newLesson, video_url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="URL YouTube" />
                <input value={newLesson.activity_pdf_url} onChange={e => setNewLesson({ ...newLesson, activity_pdf_url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="URL do PDF (Material)" />
                <textarea value={newLesson.content} onChange={e => setNewLesson({ ...newLesson, content: e.target.value })} className="md:col-span-2 w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white h-32" placeholder="Conteúdo da aula..." />
                <Button disabled={loading} className="md:col-span-2 w-full bg-brand-primary text-white font-black h-14 rounded-2xl shadow-xl italic uppercase">Publicar</Button>
              </form>
            </div>

            <div className="bg-slate-900/30 border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="text-white font-black text-xs uppercase italic">Aulas Recentes</h3>
                <span className="text-slate-500 text-[10px] font-bold">{lessons.length} Aulas</span>
              </div>
              <div className="divide-y divide-white/5">
                {lessons.map(lesson => (
                  <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div>
                      <p className="text-white font-bold text-sm">{lesson.title}</p>
                      <div className="flex gap-2 items-center">
                         <p className="text-slate-500 text-[10px] uppercase font-bold">{lesson.modules?.title}</p>
                         {lesson.activity_pdf_url && <FileText size={12} className="text-emerald-500" />}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setDuplicateTarget(lesson)} className="p-2 text-slate-400 hover:text-brand-primary" title="Duplicar"><Copy size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="max-w-4xl mx-auto animate-in fade-in">
          <div className="bg-slate-900/50 border border-brand-primary/20 p-8 rounded-[2.5rem]">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2"><UserPlus className="text-brand-primary" size={24} /> Matricular Aluno</h2>
            <form onSubmit={handleCreateStudent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required value={studentForm.fullName} onChange={e => setStudentForm({ ...studentForm, fullName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="Nome Completo" />
              <input required type="email" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="E-mail" />
              <input required type="password" value={studentForm.password} onChange={e => setStudentForm({ ...studentForm, password: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="Senha" />
              <select required value={studentForm.selectedCourse} onChange={e => setStudentForm({ ...studentForm, selectedCourse: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white">
                <option value="">Selecionar Curso...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <Button disabled={loading} className="md:col-span-2 w-full bg-brand-primary text-white font-black h-14 rounded-2xl shadow-xl italic uppercase">Cadastrar Aluno</Button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
          <div className="lg:col-span-4">
            <div className="bg-slate-900/50 border border-brand-primary/20 p-6 rounded-[2rem]">
              <h2 className="text-lg font-bold text-white mb-6">Novo Desafio</h2>
              <form onSubmit={handleSaveChallenge} className="space-y-4">
                <input required value={newChallenge.title} onChange={e => setNewChallenge({ ...newChallenge, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="Título" />
                <textarea value={newChallenge.description} onChange={e => setNewChallenge({ ...newChallenge, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm h-24" placeholder="Descrição..." />
                <div className="grid grid-cols-2 gap-4">
                   <input type="number" value={newChallenge.xp_reward} onChange={e => setNewChallenge({ ...newChallenge, xp_reward: Number(e.target.value) })} className="bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="XP" />
                   <select value={newChallenge.difficulty} onChange={e => setNewChallenge({ ...newChallenge, difficulty: e.target.value })} className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-sm">
                     <option value="Fácil">Fácil</option><option value="Médio">Médio</option><option value="Difícil">Difícil</option>
                   </select>
                </div>
                <Button disabled={loading} className="w-full bg-brand-primary text-white font-bold h-12 rounded-xl">Criar Desafio</Button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] overflow-hidden">
              {challenges.map(c => (
                <div key={c.id} className="p-6 flex items-center justify-between border-b border-white/5">
                  <div>
                    <h3 className="text-white font-bold">{c.title}</h3>
                    <p className="text-slate-500 text-xs italic">XP: {c.xp_reward} | {c.difficulty}</p>
                  </div>
                  <button onClick={() => setDeleteTarget(c)} className="text-slate-500 hover:text-red-500"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
          {submissions.length === 0 ? (
            <div className="bg-slate-900/50 border border-white/5 p-20 rounded-[3rem] text-center">
              <CheckCircle2 size={40} className="mx-auto text-slate-800 mb-4" />
              <p className="text-slate-500 font-bold uppercase text-xs">Tudo em dia!</p>
            </div>
          ) : (
            submissions.map(sub => (
              <div key={sub.id} className="bg-slate-900/50 border border-white/10 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary"><Trophy size={24}/></div>
                  <div>
                    <p className="text-white font-black text-sm uppercase">{sub.profiles?.full_name}</p>
                    <p className="text-slate-500 text-xs font-bold uppercase">{sub.challenges?.title} (+{sub.challenges?.xp_reward} XP)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a href={sub.solution_url} target="_blank" className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white"><Eye size={20}/></a>
                  <Button onClick={() => handleApproveSubmission(sub)} disabled={approvingId === sub.id} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 rounded-xl uppercase h-12 italic">Aprovar</Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
           <div className="bg-slate-900/50 border border-brand-primary/20 p-8 rounded-[2.5rem]">
              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2"><Sparkles className="text-brand-primary" size={24} /> Gerador de Quiz IA</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <select value={quizLesson} onChange={e => setQuizLesson(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white">
                    <option value="">Selecionar Aula...</option>
                    {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                 </select>
                 <div className="flex gap-4">
                    <input type="number" min="1" max="10" value={quizQuestionCount} onChange={e => setQuizQuestionCount(Number(e.target.value))} className="w-24 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-center" />
                    <Button onClick={handleGenerateQuiz} disabled={generatingQuiz} className="flex-1 bg-brand-primary text-white font-black rounded-xl uppercase italic">
                       {generatingQuiz ? <Loader2 className="animate-spin" size={20}/> : 'Gerar com IA'}
                    </Button>
                 </div>
              </div>
           </div>
           {generatedQs.length > 0 && (
             <div className="space-y-6">
                {generatedQs.map((q, idx) => (
                  <div key={idx} className="bg-slate-900/30 border border-white/5 p-6 rounded-[2rem] relative group">
                    <button onClick={() => removeQuestion(idx)} className="absolute top-4 right-4 text-slate-600 hover:text-red-500"><X size={18}/></button>
                    <input value={q.question_text} onChange={e => updateQuestion(idx, 'question_text', e.target.value)} className="w-full bg-transparent text-white font-bold mb-4 border-b border-white/5 pb-2 focus:border-brand-primary outline-none" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {q.options.map((opt, oIdx) => (
                         <div key={oIdx} className="flex items-center gap-3">
                            <button onClick={() => updateQuestion(idx, 'correct_option_index', oIdx)} className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${q.correct_option_index === oIdx ? 'bg-brand-primary border-brand-primary' : 'border-white/10'}`}>
                               {q.correct_option_index === oIdx && <CheckCircle2 size={12} className="text-white"/>}
                            </button>
                            <input value={opt} onChange={e => { const n = [...q.options]; n[oIdx] = e.target.value; updateQuestion(idx, 'options', n); }} className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-white text-xs" />
                         </div>
                       ))}
                    </div>
                  </div>
                ))}
                <Button onClick={handleSaveQuiz} disabled={savingQuiz} className="w-full bg-emerald-500 text-white font-black h-16 rounded-2xl shadow-xl shadow-emerald-500/10 uppercase italic">
                   {savingQuiz ? <Loader2 className="animate-spin" size={20}/> : 'Salvar Quiz no Banco de Dados'}
                </Button>
             </div>
           )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900/50 border border-brand-primary/20 p-8 rounded-[2.5rem]">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Building2 className="text-brand-primary" size={24} /> Registrar Escola</h2>
                <form onSubmit={handleCreateOrg} className="space-y-4">
                  <input required value={newOrg.name} onChange={e => setNewOrg({ ...newOrg, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="Nome da Escola" />
                  <input required value={newOrg.slug} onChange={e => setNewOrg({ ...newOrg, slug: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="slug-url" />
                  <Button disabled={loading} className="w-full bg-brand-primary text-white font-black h-14 rounded-2xl uppercase italic">Criar Escola</Button>
                </form>
              </div>
              <div className="bg-slate-900/30 border border-white/5 p-8 rounded-[2.5rem]">
                <h2 className="text-xl font-bold text-white mb-6">Escolas Ativas</h2>
                <div className="space-y-3 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {organizations.map(org => (
                    <div key={org.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold text-sm">{org.name}</p>
                        <p className="text-slate-500 text-[9px] uppercase font-bold tracking-tighter">ID: {org.id}</p>
                      </div>
                      <div className="h-8 w-8 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary"><CheckCircle2 size={14}/></div>
                    </div>
                  ))}
                </div>
              </div>
           </div>

           <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[3rem]">
              <h2 className="text-2xl font-black text-white italic uppercase mb-8 flex items-center gap-3"><Lock className="text-brand-primary" size={28}/> Senha de Validação</h2>
              <form onSubmit={handleChangePassword} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-4">Nova Senha</label><input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-brand-primary transition-all" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-4">Confirmar</label><input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-brand-primary transition-all" /></div>
                 </div>
                 <div className="flex items-center justify-between gap-4">
                    <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-2">{showPasswords ? <Eye size={14}/> : <Eye size={14}/>} {showPasswords ? 'Ocultar' : 'Mostrar'} Senhas</button>
                    <Button disabled={loadingPassword} className="bg-brand-primary text-white font-black px-10 h-14 rounded-2xl shadow-xl shadow-brand-primary/20 uppercase italic">{loadingPassword ? <Loader2 className="animate-spin"/> : 'Atualizar Senha'}</Button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}