'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';

export function RankingList({ students }: { students: any[] }) {
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="text-yellow-500" size={24} />
        <h2 className="text-xl font-bold text-white">Ranking de alunos</h2>
      </div>

      <div className="space-y-4">
        {students.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-4 rounded-2xl border ${
              index === 0 ? 'bg-brand-primary/10 border-brand-primary/30' : 'bg-white/5 border-white/5'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className={`w-8 h-8 flex items-center justify-center font-black rounded-full text-xs ${
                index === 0 ? 'bg-yellow-500 text-slate-950' : 
                index === 1 ? 'bg-slate-300 text-slate-950' :
                index === 2 ? 'bg-amber-700 text-white' : 'text-slate-500'
              }`}>
                {index + 1}
              </span>
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                {student.avatar_url ? (
                   <img src={student.avatar_url} alt={student.full_name} className="h-full w-full object-cover" />
                ) : (
                   <span className="text-xs font-bold">{student.full_name?.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">{student.full_name}</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1 tracking-tighter">Nível {Math.floor(student.xp / 500) + 1}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-black text-brand-secondary">{student.xp.toLocaleString()} XP</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}