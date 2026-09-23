import { supabase } from '@/lib/supabase';

/** Registra um dia de aprendizagem. Abrir o dashboard sozinho não conta como estudo. */
export async function recordLearningActivity(
  activityType: 'lesson' | 'quiz' | 'challenge' | 'project',
  referenceId?: string,
  xp = 0,
) {
  const { data, error } = await supabase.rpc('record_learning_activity', {
    p_activity_type: activityType,
    p_reference_id: referenceId ?? null,
    p_xp: xp,
  });
  if (error) throw error;
  return data as { streak: number; xp: number; already_today: boolean };
}
