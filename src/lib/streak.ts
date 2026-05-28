import { supabase } from '@/lib/supabase';

/**
 * Chame essa função toda vez que o aluno acessar o dashboard.
 * Ela atualiza streak + last_practice_date com base em acesso diário,
 * sem depender de exercícios ou XP.
 */
export async function updateStreakOnAccess(userId: string): Promise<void> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('streak, last_practice_date')
    .eq('id', userId)
    .maybeSingle();

  if (error || !profile) return;

  const today     = new Date();
  const todayStr  = today.toDateString();
  const lastDate  = profile.last_practice_date ? new Date(profile.last_practice_date) : null;
  const lastStr   = lastDate?.toDateString();

  // Já acessou hoje → não faz nada
  if (lastStr === todayStr) return;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  // Acessou ontem → mantém e incrementa streak
  // Não acessou ontem → reseta para 1
  const newStreak = lastStr === yesterdayStr ? (profile.streak ?? 0) + 1 : 1;

  await supabase
    .from('profiles')
    .update({
      streak: newStreak,
      last_practice_date: today.toISOString(),
    })
    .eq('id', userId);
}