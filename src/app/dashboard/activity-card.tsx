'use client';

import { FileText, Download, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ActivityCard({ pdfUrl }: { pdfUrl?: string }) {
  if (!pdfUrl) return null; // Não exibe o card se não houver PDF cadastrado

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/40 border border-brand-primary/20 rounded-3xl p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-primary/10 rounded-xl">
          <FileText className="text-brand-primary" size={20} />
        </div>
        <h3 className="font-black text-white">Atividade Prática</h3>
      </div>
      
      <p className="text-slate-400 text-sm">
        Coloque o que aprendeu em prática. Baixe o PDF abaixo para realizar o exercício desta aula.
      </p>

      <div className="flex gap-2">
        {/* Botão de Visualizar */}
        <a 
          href={pdfUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
        >
          <Eye size={16} /> Ver
        </a>
        
        {/* Botão de Download */}
        <a 
          href={pdfUrl} 
          download
          className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 rounded-xl transition-all"
        >
          <Download size={16} /> Baixar
        </a>
      </div>
    </motion.div>
  );
}