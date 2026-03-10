'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Send, Loader2, CheckCircle, Upload, Link as LinkIcon, X } from 'lucide-react';

export function SubmitChallengeModal({ challenge, onClose, onSuccess }: any) {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Manipular seleção de imagem
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setUrl(''); // Limpa o link se escolher arquivo
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let finalSolutionUrl = url;

      // Se houver arquivo, faz o upload para o Storage
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `submissions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('challenge-submissions')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Pega a URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage
          .from('challenge-submissions')
          .getPublicUrl(filePath);
        
        finalSolutionUrl = publicUrl;
      }

      // Salva a submissão no banco
      const { error } = await supabase.from('challenge_submissions').insert([
        {
          challenge_id: challenge.id,
          user_id: user.id,
          solution_url: finalSolutionUrl,
          status: 'pending'
        }
      ]);

      if (error) throw error;

      setSent(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (error: any) {
      alert("Erro ao enviar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl">
        {!sent ? (
          <>
            <h2 className="text-2xl font-black text-white uppercase italic mb-2">Entregar Missão</h2>
            <p className="text-slate-400 text-sm mb-6">Escolha como deseja enviar sua prova:</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OPÇÃO 1: UPLOAD DE PRINT */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Opção A: Print da Solução</label>
                {!previewUrl ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-brand-primary/50 hover:bg-white/5 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="text-slate-500 mb-2" size={24} />
                      <p className="text-xs text-slate-500 font-bold uppercase">Anexar Imagem</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-brand-primary">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => { setFile(null); setPreviewUrl(null); }}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute w-full h-[1px] bg-white/5"></div>
                <span className="relative bg-slate-900 px-3 text-[10px] font-black text-slate-600 uppercase">Ou</span>
              </div>

              {/* OPÇÃO 2: LINK */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Opção B: Link do Projeto</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="url"
                    disabled={!!file}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white outline-none focus:border-brand-primary disabled:opacity-30 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" onClick={onClose} variant="ghost" className="flex-1 text-slate-500 font-bold uppercase text-[10px]">Cancelar</Button>
                <Button disabled={loading || (!url && !file)} className="flex-[2] bg-brand-primary text-white font-black rounded-2xl gap-2 uppercase italic tracking-widest text-xs h-14 shadow-lg shadow-brand-primary/20">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Finalizar</>}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-10 space-y-4">
            <div className="flex justify-center text-brand-primary animate-bounce"><CheckCircle size={64} /></div>
            <h2 className="text-2xl font-black text-white uppercase italic">Missão Concluída!</h2>
            <p className="text-slate-400 text-sm font-medium">Sua entrega foi enviada para avaliação.</p>
          </div>
        )}
      </div>
    </div>
  );
}