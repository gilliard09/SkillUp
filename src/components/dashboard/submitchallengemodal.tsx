'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Send, Loader2, CheckCircle, Upload, Link as LinkIcon, X, AlertCircle } from 'lucide-react';
import Image from 'next/image';

// ============================================================
// TIPOS
// ============================================================
type Challenge = {
  id: string;
  title: string;
  xp_reward: number;
};

interface SubmitChallengeModalProps {
  challenge: Challenge;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================================
// CONSTANTES
// ============================================================
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ============================================================
// COMPONENTE
// ============================================================
export function SubmitChallengeModal({ challenge, onClose, onSuccess }: SubmitChallengeModalProps) {
  const router = useRouter();

  const [url, setUrl]             = useState('');
  const [file, setFile]           = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ----------------------------------------------------------
  // LIMPA blob URL ao desmontar — evita memory leak
  // ----------------------------------------------------------
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ----------------------------------------------------------
  // SELEÇÃO DE ARQUIVO
  // ----------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validação de tipo
    if (!selected.type.startsWith('image/')) {
      setError('Apenas imagens são aceitas.');
      return;
    }

    // Validação de tamanho
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError(`Arquivo muito grande. Máximo ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setError(null);

    // Revoga URL anterior antes de criar nova
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setUrl('');
  };

  // ----------------------------------------------------------
  // REMOVER ARQUIVO
  // ----------------------------------------------------------
  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Verifica se já submeteu esse desafio
      const { data: existing } = await supabase
        .from('challenge_submissions')
        .select('id')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        setError('Você já enviou uma submissão para este desafio.');
        return;
      }

      let finalSolutionUrl = url;

      // 2. Upload de arquivo se houver
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `submissions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('challenge-submissions')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('challenge-submissions')
          .getPublicUrl(filePath);

        finalSolutionUrl = publicUrl;
      }

      // 3. Salva submissão
      const { error: insertError } = await supabase
        .from('challenge_submissions')
        .insert([{
          challenge_id: challenge.id,
          user_id:      user.id,
          solution_url: finalSolutionUrl,
          status:       'pending',
        }]);

      if (insertError) throw insertError;

      // 4. Feedback e fecha
      setSent(true);

    } catch (err: any) {
      setError(err.message ?? 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // TELA DE SUCESSO — fecha e notifica ao clicar em "Ok"
  // ----------------------------------------------------------
  if (sent) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl text-center py-10 space-y-4">
          <div className="flex justify-center text-brand-primary">
            <CheckCircle size={64} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic">Missão Entregue!</h2>
          <p className="text-slate-400 text-sm font-medium">
            Sua entrega foi enviada para avaliação. Em breve você receberá o XP!
          </p>
          <Button
            onClick={() => { onClose(); onSuccess(); }}
            className="w-full h-12 bg-brand-primary text-white font-black rounded-2xl uppercase italic mt-4"
          >
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic">Entregar Missão</h2>
            <p className="text-slate-400 text-sm mt-1">Escolha como deseja enviar sua prova:</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Erro inline */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-xs font-bold mb-6">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Opção A: Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-2">
              Opção A: Print da Solução (máx. {MAX_FILE_SIZE_MB}MB)
            </label>
            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-brand-primary/50 hover:bg-white/5 transition-all">
                <Upload className="text-slate-500 mb-2" size={24} />
                <p className="text-xs text-slate-500 font-bold uppercase">Anexar Imagem</p>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-brand-primary">
                <Image
                  src={previewUrl}
                  alt="Preview da solução"
                  fill
                  className="object-cover"
                  unoptimized // blob URL não passa pelo Next Image optimizer
                />
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-full h-[1px] bg-white/5" />
            <span className="relative bg-slate-900 px-3 text-[10px] font-black text-slate-600 uppercase">Ou</span>
          </div>

          {/* Opção B: Link */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-2">
              Opção B: Link do Projeto
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="url"
                disabled={!!file || loading}
                value={url}
                onChange={e => { setUrl(e.target.value); setError(null); }}
                placeholder="https://github.com/..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white outline-none focus:border-brand-primary disabled:opacity-30 transition-all"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              variant="ghost"
              className="flex-1 text-slate-500 font-bold uppercase text-[10px] disabled:opacity-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || (!url && !file)}
              className="flex-[2] bg-brand-primary text-white font-black rounded-2xl gap-2 uppercase italic tracking-widest text-xs h-14 shadow-lg shadow-brand-primary/20 disabled:opacity-50"
            >
              {loading
                ? <Loader2 className="animate-spin" size={18} />
                : <><Send size={18} /> Finalizar</>
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}