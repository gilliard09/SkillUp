'use client';

import { useState } from 'react';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================================
// COMPONENTE
// ============================================================
export function ActivityCard({ pdfUrl }: { pdfUrl?: string }) {
  const [downloading, setDownloading] = useState(false);

  // Guard — string vazia também é inválida
  if (!pdfUrl?.trim()) return null;

  // ----------------------------------------------------------
  // DOWNLOAD via fetch + Blob — funciona com URLs cross-origin
  // (Supabase Storage retorna CORS headers corretos)
  // ----------------------------------------------------------
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error('Falha ao baixar o arquivo.');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Extrai nome do arquivo da URL ou usa fallback
      const fileName = pdfUrl.split('/').pop()?.split('?')[0] ?? 'atividade.pdf';

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Libera memória
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error('Erro no download:', err);
    } finally {
      setDownloading(false);
    }
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/40 border border-brand-primary/20 rounded-3xl p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-primary/10 rounded-xl">
          <FileText className="text-brand-primary" size={20} />
        </div>
        <h3 className="font-black text-white">Atividade Prática</h3>
      </div>

      <p className="text-slate-400 text-sm">
        Coloque o que aprendeu em prática. Baixe o material abaixo para realizar o exercício desta aula.
      </p>

      {/* Ações */}
      <div className="flex gap-2">
        {/* Ver — abre em nova aba */}
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all text-sm"
        >
          <Eye size={16} /> Ver
        </a>

        {/* Baixar — fetch + Blob para funcionar com Supabase Storage */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-70"
        >
          {downloading
            ? <><Loader2 size={16} className="animate-spin" /> Baixando...</>
            : <><Download size={16} /> Baixar</>
          }
        </button>
      </div>
    </motion.div>
  );
}