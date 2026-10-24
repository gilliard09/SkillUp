-- SkillUp: Atividades Práticas isoladas das aulas existentes.
-- Seguro para aplicar em produção: cria tabelas novas e não altera lesson_progress nem dados de alunos.

create extension if not exists pgcrypto;

create table if not exists public.practical_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null check (length(trim(title)) between 3 and 160),
  description text not null default '',
  instructions text not null default '',
  difficulty text not null default 'Iniciante' check (difficulty in ('Iniciante','Intermediário','Avançado')),
  xp_reward integer not null default 50 check (xp_reward between 0 and 1000),
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) between 1 and 40),
  is_published boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists practical_activities_org_course_idx
  on public.practical_activities(organization_id, course_id, is_published);

create table if not exists public.practical_activity_progress (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.practical_activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  current_step integer not null default 0 check (current_step >= 0),
  status text not null default 'in_progress' check (status in ('in_progress','pending','completed')),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  completed_at timestamptz,
  unique(activity_id, user_id)
);

create index if not exists practical_activity_progress_user_idx
  on public.practical_activity_progress(user_id, updated_at desc);
create index if not exists practical_activity_progress_activity_idx
  on public.practical_activity_progress(activity_id, status);

alter table public.practical_activities enable row level security;
alter table public.practical_activity_progress enable row level security;

drop policy if exists practical_activities_select_scoped on public.practical_activities;
create policy practical_activities_select_scoped on public.practical_activities
for select to authenticated
using (
  (is_published = true and exists (
    select 1 from public.profiles p
    join public.enrollments e on e.user_id = p.id and e.product_id = practical_activities.course_id
    where p.id = auth.uid() and p.organization_id = practical_activities.organization_id
  ))
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
      and p.organization_id = practical_activities.organization_id
  )
);

drop policy if exists practical_activities_insert_admin on public.practical_activities;
create policy practical_activities_insert_admin on public.practical_activities
for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
      and p.organization_id = practical_activities.organization_id
  )
);

drop policy if exists practical_activities_update_admin on public.practical_activities;
create policy practical_activities_update_admin on public.practical_activities
for update to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
    and p.organization_id = practical_activities.organization_id
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
    and p.organization_id = practical_activities.organization_id
));

drop policy if exists practical_activities_delete_admin on public.practical_activities;
create policy practical_activities_delete_admin on public.practical_activities
for delete to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
    and p.organization_id = practical_activities.organization_id
));

drop policy if exists practical_progress_select_own_or_admin on public.practical_activity_progress;
create policy practical_progress_select_own_or_admin on public.practical_activity_progress
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles admin
    join public.profiles student on student.id = practical_activity_progress.user_id
    join public.practical_activities a on a.id = practical_activity_progress.activity_id
    where admin.id = auth.uid() and admin.role = 'admin'
      and admin.organization_id = student.organization_id
      and admin.organization_id = a.organization_id
  )
);

drop policy if exists practical_progress_insert_own on public.practical_activity_progress;
drop policy if exists practical_progress_update_own on public.practical_activity_progress;

grant select, insert, update, delete on public.practical_activities to authenticated;
grant select on public.practical_activity_progress to authenticated;

-- O progresso só avança por RPC autenticada, sem permitir que o cliente salte etapas via REST.
create or replace function public.save_practical_activity_progress(
  p_activity_id uuid,
  p_current_step integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity public.practical_activities%rowtype;
  v_profile public.profiles%rowtype;
  v_current integer;
  v_status text;
begin
  if v_user is null then raise exception 'Faça login para salvar seu progresso.'; end if;
  select * into v_activity from public.practical_activities
    where id = p_activity_id and is_published = true;
  if not found then raise exception 'Atividade não encontrada ou indisponível.'; end if;
  select * into v_profile from public.profiles where id = v_user;
  if not found or v_profile.role = 'admin' then raise exception 'Perfil de aluno inválido.'; end if;
  if v_profile.organization_id is distinct from v_activity.organization_id then
    raise exception 'Esta atividade não pertence à sua escola.';
  end if;
  if not exists (select 1 from public.enrollments e
    where e.user_id = v_user and e.product_id = v_activity.course_id) then
    raise exception 'Você não está matriculado neste curso.';
  end if;
  if p_current_step < 0 or p_current_step >= jsonb_array_length(v_activity.steps) then
    raise exception 'Etapa inválida.';
  end if;

  select current_step, status into v_current, v_status
    from public.practical_activity_progress
    where activity_id = p_activity_id and user_id = v_user
    for update;

  if not found then
    if p_current_step <> 0 then raise exception 'Comece pela primeira etapa.'; end if;
    insert into public.practical_activity_progress(activity_id,user_id,current_step,status)
      values(p_activity_id,v_user,0,'in_progress')
      on conflict(activity_id,user_id) do nothing;
    select current_step, status into v_current, v_status
      from public.practical_activity_progress
      where activity_id = p_activity_id and user_id = v_user
      for update;
  end if;

  if v_status = 'completed' then
    return jsonb_build_object('current_step',v_current,'completed',true);
  end if;
  if p_current_step > v_current + 1 then
    raise exception 'Conclua as etapas em ordem.';
  end if;

  update public.practical_activity_progress
    set current_step = p_current_step, status = 'in_progress', updated_at = now()
    where activity_id = p_activity_id and user_id = v_user;
  return jsonb_build_object('current_step',p_current_step,'completed',false);
end;
$$;

revoke all on function public.save_practical_activity_progress(uuid,integer) from public;
grant execute on function public.save_practical_activity_progress(uuid,integer) to authenticated;

-- A atividade prática tem trilha própria; não altera nem conclui aulas antigas.
-- Registra o tipo novo no histórico de aprendizagem sem apagar tipos existentes.
alter table public.learning_activity drop constraint if exists learning_activity_activity_type_check;
alter table public.learning_activity
  add constraint learning_activity_activity_type_check
  check (activity_type in ('lesson','quiz','challenge','project','login','practical_activity'));

create or replace function public.complete_practical_activity_secure(
  p_activity_id uuid,
  p_validation_pin text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_activity public.practical_activities%rowtype;
  v_profile public.profiles%rowtype;
  v_expected text;
  v_inserted boolean := false;
  v_xp integer := 0;
  v_new_xp integer := 0;
  v_streak integer := 0;
  v_last date;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_yesterday date := (now() at time zone 'America/Sao_Paulo')::date - 1;
begin
  if v_user is null then raise exception 'Faça login para concluir a atividade.'; end if;
  if coalesce(trim(p_validation_pin),'') = '' then raise exception 'Informe o PIN do professor.'; end if;

  select * into v_activity
  from public.practical_activities
  where id = p_activity_id and is_published = true;
  if not found then raise exception 'Atividade não encontrada ou indisponível.'; end if;

  select * into v_profile from public.profiles where id = v_user;
  if not found or v_profile.role = 'admin' then
    raise exception 'Somente alunos podem concluir esta atividade.';
  end if;
  if v_profile.organization_id is distinct from v_activity.organization_id then
    raise exception 'Esta atividade não pertence à sua escola.';
  end if;
  if not exists (
    select 1 from public.enrollments e
    where e.user_id = v_user and e.product_id = v_activity.course_id
  ) then raise exception 'Você não está matriculado neste curso.'; end if;

  if not exists (
    select 1 from public.practical_activity_progress pr
    where pr.activity_id = p_activity_id and pr.user_id = v_user
      and pr.current_step >= jsonb_array_length(v_activity.steps) - 1
      and pr.status in ('in_progress','pending','completed')
  ) then raise exception 'Avance por todas as etapas antes de concluir.'; end if;

  select value into v_expected from public.settings where key = 'validation_password' limit 1;
  if v_expected is null or trim(p_validation_pin) <> trim(v_expected) then
    raise exception 'PIN do professor inválido.';
  end if;

  update public.practical_activity_progress
    set status = 'completed', submitted_at = coalesce(submitted_at, now()),
        completed_at = coalesce(completed_at, now()), updated_at = now()
    where activity_id = p_activity_id and user_id = v_user and status <> 'completed';
  v_inserted := found;

  select xp, streak, last_practice_date::date
    into v_new_xp, v_streak, v_last
    from public.profiles where id = v_user for update;

  if v_inserted then
    v_xp := v_activity.xp_reward;
    v_new_xp := coalesce(v_new_xp,0) + v_xp;
    v_streak := case
      when v_last = v_today then coalesce(v_streak,0)
      when v_last = v_yesterday then coalesce(v_streak,0) + 1
      else 1
    end;
    update public.profiles
      set xp = v_new_xp, streak = v_streak, last_practice_date = now()
      where id = v_user;
    insert into public.learning_activity(user_id, activity_type, reference_id, xp_earned)
      values(v_user, 'practical_activity', p_activity_id, v_xp);
  else
    select xp, streak into v_new_xp, v_streak from public.profiles where id = v_user;
  end if;

  return jsonb_build_object(
    'completed', true,
    'newly_completed', v_inserted,
    'xp_earned', case when v_inserted then v_xp else 0 end,
    'xp', coalesce(v_new_xp,0),
    'streak', coalesce(v_streak,0)
  );
end;
$$;

revoke all on function public.complete_practical_activity_secure(uuid,text) from public;
grant execute on function public.complete_practical_activity_secure(uuid,text) to authenticated;
