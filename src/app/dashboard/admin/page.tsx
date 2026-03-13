'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  PlusCircle, Video, CheckCircle2,
  Trash2, Loader2, Book,
  Briefcase, Users, Trophy, BookOpen,
  UserPlus, ShieldCheck, AlertCircle, Eye, Copy, Pencil, X
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
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

// ============================================================
// ESTADO INICIAL DOS FORMULÁRIOS
// ============================================================
const INITIAL_COURSE    = { title: '', category: 'Tecnologia', description: '', image_url: '' };
const INITIAL_MODULE    = { title: '', course_id: '' };
const INITIAL_LESSON    = { title: '', content: '', video_url: '', activity_pdf_url: '', module_id: '', order: 1 };
const INITIAL_STUDENT   = { email: '', password: '', fullName: '', selectedCourse: '' };
const INITIAL_CHALLENGE = { title: '', description: '', xp_reward: 50, category: 'Tecnologia', difficulty: 'Fácil' };

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

  const [activeTab, setActiveTab]       = useState<'content' | 'students' | 'challenges' | 'approvals'>('content');
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

  // Edição de curso
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Formulários
  const [newCourse,    setNewCourse]    = useState(INITIAL_COURSE);
  const [newModule,    setNewModule]    = useState(INITIAL_MODULE);
  const [newLesson,    setNewLesson]    = useState(INITIAL_LESSON);
  const [studentForm,  setStudentForm]  = useState(INITIAL_STUDENT);
  const [newChallenge, setNewChallenge] = useState(INITIAL_CHALLENGE);

  // ----------------------------------------------------------
  // NOTIFICAÇÃO
  // ----------------------------------------------------------
  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  // ----------------------------------------------------------
  // PROTEÇÃO DE ROTA — verifica role 'admin'
  // ----------------------------------------------------------
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();

      if (profile?.role !== 'admin') { router.push('/dashboard'); return; }
      setAuthChecking(false);
    };
    checkAdmin();
  }, [router]);

  // ----------------------------------------------------------
  // CARREGAMENTO DE DADOS
  // ----------------------------------------------------------
  const loadData = useCallback(async () => {
    try {
      const [courRes, modRes, lesRes, challRes, subRes] = await Promise.all([
        supabase.from('courses').select('*').order('title'),
        supabase.from('modules').select('*, courses(title)').order('order_index'),
        supabase.from('lessons').select('*, modules(title)').order('created_at', { ascending: false }),
        supabase.from('challenges').select('*').order('created_at', { ascending: false }),
        supabase
          .from('challenge_submissions')
          .select('*, challenges(title, xp_reward), profiles(full_name, xp)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      if (courRes.data)  setCourses(courRes.data);
      if (modRes.data)   setModules(modRes.data);
      if (lesRes.data)   setLessons(lesRes.data);
      if (challRes.data) setChallenges(challRes.data);

      if (subRes.error) {
        const { data: basicSub } = await supabase
          .from('challenge_submissions').select('*').eq('status', 'pending');
        if (basicSub) setSubmissions(basicSub);
      } else {
        if (subRes.data) setSubmissions(subRes.data);
      }
    } catch {
      notify('error', 'Erro ao carregar dados.');
    }
  }, []);

  useEffect(() => {
    if (!authChecking) loadData();
  }, [authChecking, loadData]);

  // ----------------------------------------------------------
  // DUPLICAR AULA
  // ----------------------------------------------------------
  const handleDuplicateLesson = async (moduleId: string) => {
    if (!duplicateTarget) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('lessons').insert([{
        title: `${duplicateTarget.title} (Cópia)`,
        content: duplicateTarget.content,
        video_url: duplicateTarget.video_url,
        activity_pdf_url: duplicateTarget.activity_pdf_url,
        module_id: moduleId,
        order_index: duplicateTarget.order_index,
      }]);
      if (error) throw error;
      notify('success', 'Aula duplicada!');
      await loadData();
    } catch (err: any) {
      notify('error', 'Erro ao duplicar: ' + err.message);
    } finally {
      setLoading(false);
      setDuplicateTarget(null);
    }
  };

  // ----------------------------------------------------------
  // APROVAR SUBMISSÃO
  // ----------------------------------------------------------
  const handleApproveSubmission = async (submission: Submission) => {
    setApprovingId(submission.id);
    try {
      const { error: subError } = await supabase
        .from('challenge_submissions').update({ status: 'approved' }).eq('id', submission.id);
      if (subError) throw subError;

      const xpGanho  = Number(submission.challenges?.xp_reward) || 0;
      const xpAtual  = Number(submission.profiles?.xp) || 0;

      const { error: profileError } = await supabase
        .from('profiles').update({ xp: xpAtual + xpGanho }).eq('id', submission.user_id);
      if (profileError) throw profileError;

      notify('success', `Aprovado! +${xpGanho} XP enviado.`);
      await loadData();
    } catch {
      notify('error', 'Erro na aprovação.');
    } finally {
      setApprovingId(null);
    }
  };

  // ----------------------------------------------------------
  // SALVAR CURSO (criar ou editar)
  // ----------------------------------------------------------
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      title:       newCourse.title,
      category:    newCourse.category,
      description: newCourse.description || '',
      image_url:   newCourse.image_url || '',
    };
    try {
      const { error } = editingCourseId
        ? await supabase.from('courses').update(payload).eq('id', editingCourseId)
        : await supabase.from('courses').insert([payload]);
      if (error) throw error;
      notify('success', editingCourseId ? 'Curso atualizado!' : 'Curso criado!');
      setNewCourse(INITIAL_COURSE);
      setEditingCourseId(null);
      await loadData();
    } catch (err: any) {
      notify('error', 'Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // SALVAR MÓDULO — order_index correto com maybeSingle
  // ----------------------------------------------------------
  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: maxOrder } = await supabase
        .from('modules')
        .select('order_index')
        .eq('course_id', newModule.course_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle(); // ← maybeSingle: não quebra se não houver módulos

      const nextOrder = (maxOrder?.order_index ?? 0) + 1;

      const { error } = await supabase.from('modules').insert([{
        title:       newModule.title,
        course_id:   newModule.course_id,
        order_index: nextOrder,
      }]);
      if (error) throw error;
      notify('success', 'Módulo criado!');
      setNewModule(INITIAL_MODULE);
      await loadData();
    } catch (err: any) {
      notify('error', 'Erro ao criar módulo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // SALVAR AULA — order_index dinâmico por módulo
  // ----------------------------------------------------------
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Busca o próximo order_index para o módulo selecionado
      const { data: maxOrder } = await supabase
        .from('lessons')
        .select('order_index')
        .eq('module_id', newLesson.module_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxOrder?.order_index ?? 0) + 1;

      const { error } = await supabase.from('lessons').insert([{
        title:            newLesson.title,
        content:          newLesson.content,
        video_url:        newLesson.video_url,
        activity_pdf_url: newLesson.activity_pdf_url,
        module_id:        newLesson.module_id,
        order_index:      nextOrder, // ← dinâmico, nunca fixo em 1
      }]);
      if (error) throw error;
      notify('success', 'Aula publicada!');
      setNewLesson(INITIAL_LESSON);
      await loadData();
    } catch (err: any) {
      notify('error', 'Erro ao publicar aula: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // SALVAR DESAFIO
  // ----------------------------------------------------------
  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('challenges').insert([{
        ...newChallenge,
        xp_reward: Number(newChallenge.xp_reward),
      }]);
      if (error) throw error;
      notify('success', 'Desafio criado!');
      setNewChallenge(INITIAL_CHALLENGE);
      await loadData();
    } catch (err: any) {
      notify('error', 'Erro ao criar desafio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // CRIAR ALUNO — via Edge Function (não desloga o admin)
  // ----------------------------------------------------------
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentForm.selectedCourse) {
      notify('error', 'Selecione um curso para o aluno.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            email:    studentForm.email,
            password: studentForm.password,
            fullName: studentForm.fullName,
            courseId: studentForm.selectedCourse,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro desconhecido');

      notify('success', 'Aluno matriculado com sucesso!');
      setStudentForm(INITIAL_STUDENT);
    } catch (err: any) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // DELETAR DESAFIO — com modal de confirmação
  // ----------------------------------------------------------
  const handleDeleteChallenge = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const { error } = await supabase.from('challenges').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      notify('success', 'Desafio excluído.');
      await loadData();
    } catch (err: any) {
      notify('error', 'Erro ao excluir: ' + err.message);
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  // ----------------------------------------------------------
  // LOADING DE AUTH
  // ----------------------------------------------------------
  if (authChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="space-y-10 pb-8">

      {/* Modal Duplicar */}
      {duplicateTarget && (
        <DuplicateLessonModal
          lesson={duplicateTarget}
          modules={modules}
          onConfirm={handleDuplicateLesson}
          onClose={() => setDuplicateTarget(null)}
        />
      )}

      {/* Modal Deletar Desafio */}
      {deleteTarget && (
        <ConfirmModal
          title="Excluir Desafio"
          description={`Tem certeza que deseja excluir "${deleteTarget.title}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleDeleteChallenge}
          onClose={() => setDeleteTarget(null)}
          loading={deletingId === deleteTarget.id}
        />
      )}

      {/* Toast */}
      {message && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-2xl border shadow-2xl animate-in slide-in-from-right-4 flex items-center gap-3 font-bold uppercase text-xs ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
            : 'bg-red-500/10 border-red-500 text-red-500'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tight uppercase">Painel Admin</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Gestão de Alunos e Conteúdo</p>
        </div>

        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/5 shadow-2xl overflow-x-auto">
          {([
            { key: 'content',   label: 'Conteúdo',  icon: <BookOpen size={16} /> },
            { key: 'students',  label: 'Alunos',     icon: <Users size={16} /> },
            { key: 'challenges',label: 'Desafios',   icon: <Trophy size={16} /> },
            { key: 'approvals', label: 'Aprovações', icon: <ShieldCheck size={16} /> },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.key ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ======================================================
          ABA: CONTEÚDO
      ====================================================== */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-4 space-y-6">

            {/* Formulário de Curso */}
            <div className="bg-slate-900/50 border border-brand-primary/20 p-6 rounded-[2rem]">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Briefcase className="text-brand-primary" size={20} />
                {editingCourseId ? 'Editar Curso' : 'Novo Curso'}
              </h2>
              <form onSubmit={handleSaveCourse} className="space-y-4">
                <input
                  required
                  value={newCourse.title}
                  onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm"
                  placeholder="Título"
                />
                <select
                  value={newCourse.category}
                  onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-sm"
                >
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Teologia">Teologia</option>
                </select>
                <input
                  value={newCourse.image_url}
                  onChange={e => setNewCourse({ ...newCourse, image_url: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm"
                  placeholder="URL da Capa"
                />
                <textarea
                  value={newCourse.description}
                  onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm h-20"
                  placeholder="Descrição..."
                />
                <Button
                  disabled={loading}
                  className={`w-full font-bold h-12 rounded-xl uppercase ${editingCourseId ? 'bg-amber-500' : 'bg-brand-primary'} text-white`}
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : editingCourseId ? 'Atualizar Curso' : 'Salvar Curso'}
                </Button>
                {editingCourseId && (
                  <button
                    type="button"
                    onClick={() => { setEditingCourseId(null); setNewCourse(INITIAL_COURSE); }}
                    className="w-full text-slate-500 text-xs font-bold uppercase hover:text-white transition-colors"
                  >
                    Cancelar edição
                  </button>
                )}
              </form>
            </div>

            {/* Listagem de Cursos existentes */}
            {courses.length > 0 && (
              <div className="bg-slate-900/30 border border-white/5 p-6 rounded-[2rem] space-y-3">
                <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4">Cursos Cadastrados</h3>
                {courses.map(course => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-white text-sm font-bold truncate pr-4">{course.title}</span>
                    <button
                      onClick={() => {
                        setEditingCourseId(course.id);
                        setNewCourse({
                          title:       course.title,
                          category:    course.category,
                          description: course.description,
                          image_url:   course.image_url,
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-slate-500 hover:text-brand-primary transition-colors flex-shrink-0"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário de Módulo */}
            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem]">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <PlusCircle className="text-brand-secondary" size={20} /> Novo Módulo
              </h2>
              <form onSubmit={handleSaveModule} className="space-y-4">
                <select
                  required
                  value={newModule.course_id}
                  onChange={e => setNewModule({ ...newModule, course_id: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white text-sm"
                >
                  <option value="">Curso...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <input
                  required
                  value={newModule.title}
                  onChange={e => setNewModule({ ...newModule, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm"
                  placeholder="Nome do Módulo"
                />
                <Button disabled={loading} className="w-full bg-slate-800 text-white font-bold h-12 rounded-xl">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Criar Módulo'}
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">

            {/* Formulário de Aula */}
            <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                <Video className="text-brand-primary" size={24} /> Publicar Aula
              </h2>
              <form onSubmit={handleSaveLesson} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select
                  required
                  value={newLesson.module_id}
                  onChange={e => setNewLesson({ ...newLesson, module_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                >
                  <option value="">Módulo...</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
                <input
                  required
                  value={newLesson.title}
                  onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                  placeholder="Título da Aula"
                />
                <input
                  value={newLesson.video_url}
                  onChange={e => setNewLesson({ ...newLesson, video_url: e.target.value })}
                  className="md:col-span-2 w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                  placeholder="URL do Vídeo (YouTube)"
                />
                <textarea
                  value={newLesson.content}
                  onChange={e => setNewLesson({ ...newLesson, content: e.target.value })}
                  className="md:col-span-2 w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white h-32"
                  placeholder="Conteúdo / Resumo da aula..."
                />
                <Button disabled={loading} className="md:col-span-2 h-14 bg-brand-primary text-white font-bold rounded-2xl uppercase">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Publicar Aula'}
                </Button>
              </form>
            </div>

            {/* Lista para Reaproveitar Aulas */}
            <div className="bg-slate-900/30 border border-white/5 p-8 rounded-[2.5rem]">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Copy className="text-brand-secondary" size={20} /> Reaproveitar Aulas
              </h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {lessons.length === 0 && (
                  <p className="text-slate-600 text-sm font-bold uppercase text-center py-8">Nenhuma aula cadastrada.</p>
                )}
                {lessons.map(lesson => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div>
                      <p className="text-white font-bold text-sm">{lesson.title}</p>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                        {lesson.modules?.title || 'Sem módulo'}
                      </p>
                    </div>
                    <Button
                      onClick={() => setDuplicateTarget(lesson)}
                      variant="outline"
                      className="h-9 gap-2 border-brand-secondary/50 text-brand-secondary hover:bg-brand-secondary hover:text-white flex-shrink-0"
                    >
                      <Copy size={14} /> Duplicar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ABA: ALUNOS
      ====================================================== */}
      {activeTab === 'students' && (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
          <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[2.5rem]">
            <h2 className="text-2xl font-black uppercase text-white mb-2 flex items-center gap-3">
              <UserPlus className="text-brand-primary" /> Matricular Aluno
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">
              O aluno receberá acesso imediato sem e-mail de confirmação.
            </p>
            <form onSubmit={handleCreateStudent} className="space-y-6">
              <input
                required
                value={studentForm.fullName}
                onChange={e => setStudentForm({ ...studentForm, fullName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                placeholder="Nome Completo"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  type="email"
                  autoComplete="off"
                  value={studentForm.email}
                  onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                  placeholder="E-mail"
                />
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={studentForm.password}
                  onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                  placeholder="Senha"
                />
              </div>
              <select
                required
                value={studentForm.selectedCourse}
                onChange={e => setStudentForm({ ...studentForm, selectedCourse: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white"
              >
                <option value="">Selecione o Curso...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <Button disabled={loading} className="w-full h-16 bg-brand-primary text-white font-black rounded-2xl">
                {loading ? <Loader2 className="animate-spin" /> : 'Finalizar Matrícula'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          ABA: DESAFIOS
      ====================================================== */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-5">
            <div className="bg-slate-900/50 border border-brand-primary/20 p-8 rounded-[2.5rem]">
              <h2 className="text-2xl font-black uppercase text-white mb-8 flex items-center gap-3">
                <Book className="text-brand-primary" /> Novo Desafio
              </h2>
              <form onSubmit={handleSaveChallenge} className="space-y-4">
                <input
                  required
                  value={newChallenge.title}
                  onChange={e => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                  placeholder="Título"
                />
                <textarea
                  required
                  value={newChallenge.description}
                  onChange={e => setNewChallenge({ ...newChallenge, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white h-32"
                  placeholder="Descrição"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    min={1}
                    value={newChallenge.xp_reward}
                    onChange={e => setNewChallenge({ ...newChallenge, xp_reward: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white"
                    placeholder="XP"
                  />
                  <select
                    value={newChallenge.difficulty}
                    onChange={e => setNewChallenge({ ...newChallenge, difficulty: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
                <Button disabled={loading} className="w-full h-14 bg-brand-primary text-white font-black rounded-2xl">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Criar Desafio'}
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {challenges.length === 0 && (
                <p className="text-slate-600 text-sm font-bold uppercase text-center py-12">
                  Nenhum desafio criado ainda.
                </p>
              )}
              {challenges.map(chall => (
                <div key={chall.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold">{chall.title}</h4>
                    <span className="text-brand-primary text-xs font-black">+{chall.xp_reward} XP</span>
                    <span className="ml-3 text-slate-500 text-xs font-bold">{chall.difficulty}</span>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(chall)}
                    disabled={deletingId === chall.id}
                    className="text-slate-600 hover:text-red-500 transition-colors p-2 disabled:opacity-50"
                    title="Excluir desafio"
                  >
                    {deletingId === chall.id
                      ? <Loader2 size={18} className="animate-spin" />
                      : <Trash2 size={18} />
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ABA: APROVAÇÕES
      ====================================================== */}
      {activeTab === 'approvals' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white italic uppercase flex items-center gap-3">
              <ShieldCheck className="text-brand-primary" size={32} /> Central de Avaliação
            </h2>
            <span className="bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
              {submissions.length} Pendentes
            </span>
          </div>

          {submissions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-600 gap-4">
              <CheckCircle2 size={48} />
              <p className="font-black uppercase text-sm tracking-widest">Nenhuma submissão pendente</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {submissions.map(sub => (
              <div
                key={sub.id}
                className="bg-slate-900/80 border border-white/5 p-8 rounded-[2.5rem] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 hover:border-brand-primary/20 transition-all"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white uppercase italic">{sub.profiles?.full_name}</h3>
                  <p className="text-slate-500 text-xs font-medium">Desafio: {sub.challenges?.title}</p>
                  <span className="text-brand-primary text-xs font-black">+{sub.challenges?.xp_reward} XP</span>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href={sub.solution_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-white/5 text-white px-6 py-4 rounded-2xl text-xs font-black border border-white/5 hover:bg-white/10 transition-all"
                  >
                    <Eye size={16} /> Ver
                  </a>
                  <Button
                    onClick={() => handleApproveSubmission(sub)}
                    disabled={approvingId !== null}
                    className="bg-brand-primary text-white px-8 py-4 h-auto rounded-2xl text-xs font-black uppercase"
                  >
                    {approvingId === sub.id ? <Loader2 className="animate-spin" size={16} /> : 'Aprovar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}