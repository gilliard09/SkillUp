-- Permite vincular a atividade a uma aula cadastrada ou informar um título livre.
-- Coluna opcional para preservar compatibilidade com atividades já existentes.
alter table public.practical_activities
  add column if not exists lesson_title text;
