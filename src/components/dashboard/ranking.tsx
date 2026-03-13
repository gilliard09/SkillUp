'use client';

import { motion } from 'framer-motion';
import { Trophy, Crown } from 'lucide-react';
import Image from 'next/image';

// ============================================================
// TIPOS
// ============================================================
type Student = {
  id: string;
  full_name: string | null;
  xp: number | null;
  avatar_url: string | null;
};

// ============================================================
// CONSTANTES — sistema de níveis consistente com o resto do app
// ============================================================
const LEVELS = [
  { min: 5000, name: 'Lendário Digital' },
  { min: 4000, name: 'Mestre Tech' },
  { min: 3000, name: 'Especialista Digital' },
  { min: 2000, name: 'Criador de Soluções' },
  { min: 1000, name: 'Desenvolvedor Iniciante' },
  { min: 0,    name: 'Explorador Digital' },
];

function getLevelName(xp: number): string {
  return LEVELS.find(l => xp >= l.min)?.name ?? 'Explorador Digital';
}

// Extrai iniciais de forma segura para nomes com acentos/emoji
function getInitials(name: string | null): string {
  if (!name) return '?';
  return Array.from(name.trim())[0]?.toUpperCase() ?? '?';
}

// Estilos do badge de posição
const POSITION_STYLES: Record<number, string> = {
  0: 'bg-yellow-500 text-slate-950',
  1: 'bg-slate-300 text-slate-950',
  2: 'bg-amber-700 text-white',
};

// ============================================================
// COMPONENTE
// ============================================================
export function RankingList({ students }: { students: Student[] }) {
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="text-yellow-500" size={24} />
        <h2 className="text-xl font-bold text-white">Ranking de Alunos</h2>
      </div>

      {/* Empty state */}
      {(!students || students.length === 0) && (
        <p className="text-slate-600 text-sm font-bold uppercase text-center py-8">
          Nenhum aluno no ranking ainda.
        </p>
      )}

      <div className="space-y-4">
        {students?.map((student, index) => {
          const xp           = student.xp ?? 0;
          const isFirst      = index === 0;
          const positionStyle = POSITION_STYLES[index] ?? 'text-slate-500';
          const hasBg        = index in POSITION_STYLES;

          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-2xl border ${
                isFirst
                  ? 'bg-brand-primary/10 border-brand-primary/30'
                  : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex items-center gap-4">

                {/* Badge de posição */}
                <span className={`w-8 h-8 flex items-center justify-center font-black rounded-full text-xs flex-shrink-0 ${
                  hasBg ? positionStyle : 'text-slate-500'
                }`}>
                  {isFirst ? <Crown size={16} /> : index + 1}
                </span>

                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                  {student.avatar_url ? (
                    <Image
                      src={student.avatar_url}
                      alt={student.full_name ?? 'Avatar'}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">
                      {getInitials(student.full_name)}
                    </span>
                  )}
                </div>

                {/* Nome + Nível */}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-none truncate">
                    {student.full_name ?? 'Anônimo'}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase mt-1 tracking-tighter truncate">
                    {getLevelName(xp)}
                  </p>
                </div>
              </div>

              {/* XP */}
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-sm font-black text-brand-primary">
                  {xp.toLocaleString('pt-BR')} XP
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}