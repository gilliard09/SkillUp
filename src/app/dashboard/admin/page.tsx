'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, Video, LayoutGrid, CheckCircle2, 
  HelpCircle, Plus, Trash2, Edit3, Loader2, Book,
  FileText, Tag, Briefcase, Users, Trophy, BookOpen,
  UserPlus, ShieldCheck, AlertCircle, Sword, Star, ExternalLink, Eye, X, Copy
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'content' | 'students' | 'challenges' | 'approvals'>('content');
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Estados de Dados
  const [courses, setCourses] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]); 
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  // Estados de Edição
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados de Formulário
  const [newCourse, setNewCourse] = useState({ title: '', category: 'Tecnologia', description: '', image_url: '' });
  const [newModule, setNewModule] = useState({ title: '', course_id: '' });
  const [newLesson, setNewLesson] = useState({ title: '', content: '', video_url: '', activity_pdf_url: '', module_id: '', order: 1 });
  const [studentForm, setStudentForm] = useState({ email: '', password: '', fullName: '', selectedCourse: '' });
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', xp_reward: 50, category: 'Tecnologia', difficulty: 'Fácil' });

  async function loadData() {
    try {
      const { data: courData } = await supabase.from('courses').select('*').order('title');
      const { data: modData } = await supabase.from('modules').select('*, courses(title)').order('order_index');
      const { data: lesData } = await supabase.from('lessons').select('*, modules(title)').order('created_at', { ascending: false });
      const { data: challData } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
      
      const { data: subData, error: subError } = await supabase
        .from('challenge_submissions')
        .select(`*, challenges (title, xp_reward), profiles (full_name, xp)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (subError) {
        const { data: basicSub } = await supabase.from('challenge_submissions').select('*').eq('status', 'pending');
        if (basicSub) setSubmissions(basicSub);
      } else {
        if (subData) setSubmissions(subData);
      }

      if (courData) setCourses(courData);
      if (modData) setModules(modData);
      if (lesData) setLessons(lesData);
      if (challData) setChallenges(challData);
    } catch (err) {
      console.log("Erro ao carregar dados...");
    }
  }

  useEffect(() => { loadData(); }, []);

  // --- FUNÇÃO PARA DUPLICAR AULA (REAPROVEITAMENTO) ---
  const handleDuplicateLesson = async (lesson: any) => {
    const targetModuleId = prompt("Para qual ID de Módulo deseja copiar esta aula? (Deixe em branco para o mesmo módulo)");
    const moduleId = targetModuleId || lesson.module_id;

    setLoading(true);
    try {
      const { error } = await supabase.from('lessons').insert([{
        title: `${lesson.title} (Cópia)`,
        content: lesson.content,
        video_url: lesson.video_url,
        activity_pdf_url: lesson.activity_pdf_url,
        module_id: moduleId,
        order_index: lesson.order_index
      }]);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Aula duplicada com sucesso!' });
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro ao duplicar: ' + error.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleApproveSubmission = async (submission: any) => {
    setApprovingId(submission.id);
    try {
      const { error: subError } = await supabase.from('challenge_submissions').update({ status: 'approved' }).eq('id', submission.id);
      if (subError) throw subError;

      const xpGanho = Number(submission.challenges?.xp_reward) || 0;
      const xpAtual = Number(submission.profiles?.xp) || 0;
      const novoXp = xpAtual + xpGanho;

      const { error: profileError } = await supabase.from('profiles').update({ xp: novoXp }).eq('id', submission.user_id);
      if (profileError) throw profileError;

      setMessage({ type: 'success', text: `Aprovado! +${xpGanho} XP enviado.` });
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: "Erro na aprovação." });
    } finally {
      setApprovingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { title: newCourse.title, category: newCourse.category, description: newCourse.description || "", image_url: newCourse.image_url || "" };
    try {
      let error;
      if (editingId) error = (await supabase.from('courses').update(payload).eq('id', editingId)).error;
      else error = (await supabase.from('courses').insert([payload])).error;
      if (error) throw error;
      setMessage({ type: 'success', text: editingId ? 'Curso atualizado!' : 'Curso criado!' });
      setNewCourse({ title: '', category: 'Tecnologia', description: '', image_url: '' });
      setEditingId(null);
      await loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro: ' + error.message });
    } finally { setLoading(false); setTimeout(() => setMessage(null), 3000); }
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { title: newModule.title, course_id: newModule.course_id, order_index: modules.length + 1 };
    await supabase.from('modules').insert([payload]);
    setNewModule({ title: '', course_id: '' });
    await loadData(); setLoading(false);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...newLesson, order_index: newLesson.order };
    await supabase.from('lessons').insert([payload]);
    setNewLesson({ title: '', content: '', video_url: '', activity_pdf_url: '', module_id: '', order: 1 });
    await loadData(); setLoading(false);
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...newChallenge, xp_reward: Number(newChallenge.xp_reward) };
    await supabase.from('challenges').insert([payload]);
    setNewChallenge({ title: '', description: '', xp_reward: 50, category: 'Tecnologia', difficulty: 'Fácil' });
    await loadData(); setLoading(false);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: studentForm.email,
        password: studentForm.password,
        options: { data: { full_name: studentForm.fullName } }
      });
      if (authError) throw authError;
      if (authData.user) {
        await supabase.from('profiles').upsert([{ id: authData.user.id, full_name: studentForm.fullName, xp: 0 }]);
        await supabase.from('enrollments').insert([{ user_id: authData.user.id, product_id: studentForm.selectedCourse }]);
        setMessage({ type: 'success', text: 'Aluno matriculado!' });
        setStudentForm({ email: '', password: '', fullName: '', selectedCourse: '' });
        await loadData();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally { setLoading(false); }
  };

  const deleteChallenge = async (id: string) => {
    if (confirm("Excluir desafio?")) {
      await supabase.from('challenges').delete().eq('id', id);
      await loadData();
    }
  };

  return (
    <div className="min-h-screen space-y-10 pb-32">
      {message && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-2xl border shadow-2xl animate-in slide-in-from-right-4 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
          <div className="flex items-center gap-3 font-bold uppercase text-xs">
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tight uppercase">Painel Admin</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Gestão de Alunos e Conteúdo</p>
        </div>
        
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/5 shadow-2xl overflow-x-auto">
          <button onClick={() => setActiveTab('content')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><BookOpen size={16} /> Conteúdo</button>
          <button onClick={() => setActiveTab('students')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'students' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Users size={16} /> Alunos</button>
          <button onClick={() => setActiveTab('challenges')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'challenges' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Trophy size={16} /> Desafios</button>
          <button onClick={() => setActiveTab('approvals')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'approvals' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><ShieldCheck size={16} /> Aprovações</button>
        </div>
      </header>

      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/50 border border-brand-primary/20 p-6 rounded-[2rem]">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Briefcase className="text-brand-primary" size={20}/> {editingId ? 'Editar Curso' : 'Novo Curso'}</h2>
              <form onSubmit={handleSaveCourse} className="space-y-4">
                <input required value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="Título" />
                <select value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-sm">
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Teologia">Teologia</option>
                </select>
                <input value={newCourse.image_url} onChange={e => setNewCourse({...newCourse, image_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="URL da Capa" />
                <textarea value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm h-20" placeholder="Descrição..." />
                <Button disabled={loading} className={`w-full font-bold h-12 rounded-xl uppercase ${editingId ? 'bg-amber-500' : 'bg-brand-primary'} text-white`}>
                   {loading ? <Loader2 className="animate-spin" /> : editingId ? 'Atualizar' : 'Salvar Curso'}
                </Button>
              </form>
            </div>
            
            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem]">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><PlusCircle className="text-brand-secondary" size={20}/> Novo Módulo</h2>
              <form onSubmit={handleSaveModule} className="space-y-4">
                <select required value={newModule.course_id} onChange={e => setNewModule({...newModule, course_id: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white text-sm">
                  <option value="">Curso...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <input required value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm" placeholder="Nome Módulo" />
                <Button disabled={loading} className="w-full bg-slate-800 text-white font-bold h-12 rounded-xl">Criar Módulo</Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem]">
              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2"><Video className="text-brand-primary" size={24} /> Publicar Aula</h2>
              <form onSubmit={handleSaveLesson} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select required value={newLesson.module_id} onChange={e => setNewLesson({...newLesson, module_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white">
                  <option value="">Módulo...</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
                <input required value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="Título" />
                <input value={newLesson.video_url} onChange={e => setNewLesson({...newLesson, video_url: e.target.value})} className="md:col-span-2 w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="URL Vídeo" />
                <textarea value={newLesson.content} onChange={e => setNewLesson({...newLesson, content: e.target.value})} className="md:col-span-2 w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white h-32" placeholder="Conteúdo..." />
                <Button disabled={loading} className="md:col-span-2 h-14 bg-brand-primary text-white font-bold rounded-2xl uppercase">Publicar Aula</Button>
              </form>
            </div>

            {/* LISTA DE AULAS PARA REAPROVEITAMENTO */}
            <div className="bg-slate-900/30 border border-white/5 p-8 rounded-[2.5rem]">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Copy className="text-brand-secondary" size={20} /> Reaproveitar Aulas Existentes</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {lessons.map(lesson => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div>
                      <p className="text-white font-bold text-sm">{lesson.title}</p>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{lesson.modules?.title || 'Sem módulo'}</p>
                    </div>
                    <Button 
                      onClick={() => handleDuplicateLesson(lesson)} 
                      variant="outline" 
                      className="h-9 gap-2 border-brand-secondary/50 text-brand-secondary hover:bg-brand-secondary hover:text-white"
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

      {activeTab === 'students' && (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
          <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[2.5rem]">
            <h2 className="text-2xl font-black uppercase text-white mb-8 flex items-center gap-3"><UserPlus className="text-brand-primary" /> Matricular Aluno</h2>
            <form onSubmit={handleCreateStudent} className="space-y-6">
              <input required value={studentForm.fullName} onChange={e => setStudentForm({...studentForm, fullName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="Nome Completo" />
              <div className="grid grid-cols-2 gap-4">
                <input required type="email" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="E-mail" />
                <input required type="text" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="Senha" />
              </div>
              <select required value={studentForm.selectedCourse} onChange={e => setStudentForm({...studentForm, selectedCourse: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white">
                <option value="">Selecione o Curso...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <Button disabled={loading} className="w-full h-16 bg-brand-primary text-white font-black rounded-2xl">Finalizar Matrícula</Button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-5">
            <div className="bg-slate-900/50 border border-brand-primary/20 p-8 rounded-[2.5rem]">
              <h2 className="text-2xl font-black uppercase text-white mb-8 flex items-center gap-3"><Sword className="text-brand-primary" /> Novo Desafio</h2>
              <form onSubmit={handleSaveChallenge} className="space-y-4">
                <input required value={newChallenge.title} onChange={e => setNewChallenge({...newChallenge, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="Título" />
                <textarea required value={newChallenge.description} onChange={e => setNewChallenge({...newChallenge, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white h-32" placeholder="Descrição" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={newChallenge.xp_reward} onChange={e => setNewChallenge({...newChallenge, xp_reward: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" placeholder="XP" />
                  <select value={newChallenge.difficulty} onChange={e => setNewChallenge({...newChallenge, difficulty: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white">
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
                <Button className="w-full h-14 bg-brand-primary text-white font-black rounded-2xl">Criar Desafio</Button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {challenges.map(chall => (
                <div key={chall.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold">{chall.title}</h4>
                    <span className="text-brand-primary text-xs font-black">+{chall.xp_reward} XP</span>
                  </div>
                  <button onClick={() => deleteChallenge(chall.id)} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
          <div className="grid grid-cols-1 gap-6">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-slate-900/80 border border-white/5 p-8 rounded-[2.5rem] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 hover:border-brand-primary/20 transition-all">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white uppercase italic">{sub.profiles?.full_name}</h3>
                  <p className="text-slate-500 text-xs font-medium">Desafio: {sub.challenges?.title}</p>
                </div>
                <div className="flex items-center gap-4">
                  <a href={sub.solution_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/5 text-white px-6 py-4 rounded-2xl text-xs font-black border border-white/5"><Eye size={16} /> Ver</a>
                  <Button onClick={() => handleApproveSubmission(sub)} disabled={approvingId !== null} className="bg-brand-primary text-white px-8 py-4 h-auto rounded-2xl text-xs font-black uppercase">
                    {approvingId === sub.id ? <Loader2 className="animate-spin" /> : "Aprovar"}
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