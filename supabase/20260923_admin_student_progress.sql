-- Permite que administradores consultem o progresso de alunos da própria escola
-- sem abrir a tabela lesson_progress para outros usuários.

create or replace function public.get_student_lesson_progress(p_student_id uuid)
returns table (
  lesson_id uuid,
  is_completed boolean,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_role text;
  v_admin_org_id uuid;
  v_student_org_id uuid;
begin
  select role, organization_id
    into v_admin_role, v_admin_org_id
  from public.profiles
  where id = auth.uid();

  if v_admin_role <> 'admin' then
    raise exception 'Acesso não autorizado';
  end if;

  select organization_id
    into v_student_org_id
  from public.profiles
  where id = p_student_id
    and role = 'student';

  if v_student_org_id is null or v_admin_org_id is null or v_student_org_id <> v_admin_org_id then
    raise exception 'Aluno não pertence à organização do administrador';
  end if;

  return query
  select lp.lesson_id, lp.is_completed, lp.completed_at
  from public.lesson_progress lp
  where lp.user_id = p_student_id
    and lp.is_completed = true
  order by lp.completed_at desc;
end;
$$;

revoke all on function public.get_student_lesson_progress(uuid) from public;
grant execute on function public.get_student_lesson_progress(uuid) to authenticated;
