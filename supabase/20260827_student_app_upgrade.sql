-- Tecnologge / SkillUp — upgrade da experiência do aluno
-- Execute este arquivo no SQL Editor do Supabase antes de publicar.

create extension if not exists pgcrypto;

create table if not exists public.learning_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null check (activity_type in ('lesson','quiz','challenge','project','login')),
  reference_id uuid,
  xp_earned integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists learning_activity_user_created_idx on public.learning_activity(user_id, created_at desc);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon text not null default '🏆',
  xp_reward integer not null default 0,
  requirement_type text not null,
  requirement_value integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

create table if not exists public.student_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  url text,
  file_url text,
  status text not null default 'em_andamento' check (status in ('em_andamento','enviado','aprovado','revisao')),
  grade numeric(5,2),
  teacher_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists student_projects_user_updated_idx on public.student_projects(user_id, updated_at desc);

insert into public.achievements (slug,title,description,icon,xp_reward,requirement_type,requirement_value) values
('first-lesson','Primeiro Passo','Conclua sua primeira aula.','🚀',50,'lessons',1),
('ten-lessons','Mente em Expansão','Conclua 10 aulas.','🧠',100,'lessons',10),
('twenty-lessons','Maratonista','Conclua 20 aulas.','📚',200,'lessons',20),
('first-challenge','Mão na Massa','Entregue seu primeiro desafio.','💻',100,'challenges',1),
('first-project','Construtor','Crie seu primeiro projeto.','🛠️',100,'projects',1),
('seven-day-streak','Em Chamas','Mantenha uma sequência de 7 dias de estudo.','🔥',150,'streak',7),
('level-five','Mestre Tech','Alcance 4000 XP.','🏆',300,'xp',4000)
on conflict (slug) do update set title=excluded.title, description=excluded.description, icon=excluded.icon, xp_reward=excluded.xp_reward, requirement_type=excluded.requirement_type, requirement_value=excluded.requirement_value;

-- Garante que a regra de uma conclusão por aluno/aula exista.
create unique index if not exists lesson_progress_user_lesson_uidx on public.lesson_progress(user_id, lesson_id);

-- RLS: aluno só lê/escreve seus próprios dados nas novas tabelas.
alter table public.learning_activity enable row level security;
alter table public.user_achievements enable row level security;
alter table public.notifications enable row level security;
alter table public.student_projects enable row level security;
alter table public.achievements enable row level security;

drop policy if exists "learning_activity_select_own" on public.learning_activity;
create policy "learning_activity_select_own" on public.learning_activity for select using (auth.uid() = user_id);
drop policy if exists "user_achievements_select_own" on public.user_achievements;
create policy "user_achievements_select_own" on public.user_achievements for select using (auth.uid() = user_id);
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select using (user_id is null or auth.uid() = user_id);
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);
drop policy if exists "projects_select_own" on public.student_projects;
create policy "projects_select_own" on public.student_projects for select using (auth.uid() = user_id);
drop policy if exists "projects_insert_own" on public.student_projects;
create policy "projects_insert_own" on public.student_projects for insert with check (auth.uid() = user_id);
drop policy if exists "projects_update_own" on public.student_projects;
create policy "projects_update_own" on public.student_projects for update using (auth.uid() = user_id);
drop policy if exists "achievements_select_authenticated" on public.achievements;
create policy "achievements_select_authenticated" on public.achievements for select using (auth.role() = 'authenticated');

-- Conclusão segura da aula. A senha do professor NUNCA é enviada ao cliente.
create or replace function public.complete_lesson_secure(p_lesson_id uuid, p_validation_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_lesson public.lessons%rowtype;
  v_course_id uuid;
  v_enrolled boolean;
  v_expected text;
  v_inserted boolean := false;
  v_xp integer := 0;
  v_new_xp integer := 0;
  v_streak integer := 0;
  v_last date;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_yesterday date := ((now() at time zone 'America/Sao_Paulo')::date - 1);
  v_count integer := 0;
  v_ach public.achievements%rowtype;
begin
  if v_user is null then raise exception 'Não autenticado'; end if;
  if coalesce(trim(p_validation_pin),'') = '' then raise exception 'PIN obrigatório'; end if;

  select l.*, m.course_id into v_lesson, v_course_id from public.lessons l join public.modules m on m.id=l.module_id where l.id=p_lesson_id;
  if not found then raise exception 'Aula não encontrada'; end if;

  select exists(select 1 from public.enrollments e where e.user_id=v_user and e.product_id=v_course_id) into v_enrolled;
  if not v_enrolled then raise exception 'Aluno não matriculado neste curso'; end if;

  select value into v_expected from public.settings where key='validation_password' limit 1;
  if v_expected is null or trim(p_validation_pin) <> trim(v_expected) then raise exception 'PIN do professor inválido'; end if;

  insert into public.lesson_progress(user_id,lesson_id,is_completed)
  values(v_user,p_lesson_id,true)
  on conflict (user_id,lesson_id) do nothing;
  v_inserted := found;

  if v_inserted then
    v_xp := coalesce(v_lesson.xp_reward,0);
    select xp, streak, last_practice_date::date into v_new_xp, v_streak, v_last from public.profiles where id=v_user for update;
    v_new_xp := coalesce(v_new_xp,0) + v_xp;
    v_streak := case when v_last=v_today then coalesce(v_streak,0) when v_last=v_yesterday then coalesce(v_streak,0)+1 else 1 end;
    update public.profiles set xp=v_new_xp, streak=v_streak, last_practice_date=now() where id=v_user;
    insert into public.learning_activity(user_id,activity_type,reference_id,xp_earned) values(v_user,'lesson',p_lesson_id,v_xp);

    for v_ach in select * from public.achievements order by requirement_value loop
      select count(*) into v_count from public.learning_activity where user_id=v_user and activity_type='lesson';
      if (v_ach.requirement_type='lessons' and v_count>=v_ach.requirement_value)
         or (v_ach.requirement_type='streak' and v_streak>=v_ach.requirement_value)
         or (v_ach.requirement_type='xp' and v_new_xp>=v_ach.requirement_value) then
        insert into public.user_achievements(user_id,achievement_id) values(v_user,v_ach.id) on conflict do nothing;
      end if;
    end loop;
  end if;

  return jsonb_build_object('completed',true,'newly_completed',v_inserted,'xp_earned',case when v_inserted then v_xp else 0 end,'xp',v_new_xp,'streak',v_streak);
end;
$$;

-- Quiz seguro: as respostas corretas permanecem no banco.
create or replace function public.submit_quiz_secure(p_lesson_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_quiz_id uuid;
  v_course_id uuid;
  v_enrolled boolean;
  v_already boolean;
  v_score integer := 0;
  v_total integer := 0;
  v_xp integer := 0;
  v_xp_per integer := 50;
  q record;
  v_new_xp integer := 0;
  v_streak integer := 0;
  v_last date;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_yesterday date := ((now() at time zone 'America/Sao_Paulo')::date - 1);
begin
  if v_user is null then raise exception 'Não autenticado'; end if;
  select m.course_id into v_course_id from public.lessons l join public.modules m on m.id=l.module_id where l.id=p_lesson_id;
  if v_course_id is null then raise exception 'Aula não encontrada'; end if;
  select exists(select 1 from public.enrollments where user_id=v_user and product_id=v_course_id) into v_enrolled;
  if not v_enrolled then raise exception 'Aluno não matriculado'; end if;
  select id, coalesce(xp_per_question,50) into v_quiz_id,v_xp_per from public.quizzes where lesson_id=p_lesson_id limit 1;
  if v_quiz_id is null then raise exception 'Quiz não encontrado'; end if;

  for q in select id, correct_option_index from public.questions where quiz_id=v_quiz_id loop
    v_total := v_total + 1;
    if (p_answers ->> q.id::text) is not null and (p_answers ->> q.id::text)::integer = q.correct_option_index then v_score := v_score + 1; end if;
  end loop;
  v_xp := v_score * v_xp_per;
  select exists(select 1 from public.lesson_progress where user_id=v_user and lesson_id=p_lesson_id) into v_already;

  if not v_already then
    insert into public.lesson_progress(user_id,lesson_id,is_completed) values(v_user,p_lesson_id,true) on conflict (user_id,lesson_id) do nothing;
    select xp,streak,last_practice_date::date into v_new_xp,v_streak,v_last from public.profiles where id=v_user for update;
    v_new_xp := coalesce(v_new_xp,0)+v_xp;
    v_streak := case when v_last=v_today then coalesce(v_streak,0) when v_last=v_yesterday then coalesce(v_streak,0)+1 else 1 end;
    update public.profiles set xp=v_new_xp,streak=v_streak,last_practice_date=now() where id=v_user;
    insert into public.learning_activity(user_id,activity_type,reference_id,xp_earned) values(v_user,'quiz',p_lesson_id,v_xp);
  else
    select xp,streak into v_new_xp,v_streak from public.profiles where id=v_user;
  end if;
  return jsonb_build_object('score',v_score,'total',v_total,'xp_earned',case when v_already then 0 else v_xp end,'already_completed',v_already,'xp',v_new_xp,'streak',v_streak);
end;
$$;

grant execute on function public.complete_lesson_secure(uuid,text) to authenticated;
grant execute on function public.submit_quiz_secure(uuid,jsonb) to authenticated;

-- Função simples para marcar atividade diária sem transformar simples login em sequência.
create or replace function public.record_learning_activity(p_activity_type text, p_reference_id uuid default null, p_xp integer default 0)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_today date:=(now() at time zone 'America/Sao_Paulo')::date; v_yesterday date:=v_today-1; v_last date; v_streak integer; v_xp integer;
begin
 if v_user is null then raise exception 'Não autenticado'; end if;
 select last_practice_date::date,streak,xp into v_last,v_streak,v_xp from profiles where id=v_user for update;
 if v_last=v_today then
   return jsonb_build_object('streak',coalesce(v_streak,0),'xp',coalesce(v_xp,0),'already_today',true);
 end if;
 v_streak:=case when v_last=v_yesterday then coalesce(v_streak,0)+1 else 1 end;
 v_xp:=coalesce(v_xp,0)+greatest(coalesce(p_xp,0),0);
 update profiles set last_practice_date=now(),streak=v_streak,xp=v_xp where id=v_user;
 insert into learning_activity(user_id,activity_type,reference_id,xp_earned) values(v_user,p_activity_type,p_reference_id,greatest(coalesce(p_xp,0),0));
 return jsonb_build_object('streak',v_streak,'xp',v_xp,'already_today',false);
end; $$;
grant execute on function public.record_learning_activity(text,uuid,integer) to authenticated;

-- Aprovação de desafio atômica: evita conceder XP duas vezes e usa o XP configurado no desafio.
create or replace function public.approve_challenge_secure(p_submission_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin uuid:=auth.uid(); v_sub public.challenge_submissions%rowtype; v_reward integer; v_newxp integer; v_streak integer; v_last date; v_today date:=(now() at time zone 'America/Sao_Paulo')::date; v_yesterday date:=(now() at time zone 'America/Sao_Paulo')::date-1;
begin
 if v_admin is null then raise exception 'Não autenticado'; end if;
 if not exists(select 1 from profiles where id=v_admin and role='admin') then raise exception 'Sem permissão'; end if;
 select * into v_sub from challenge_submissions where id=p_submission_id for update;
 if not found then raise exception 'Submissão não encontrada'; end if;
 select xp_reward into v_reward from challenges where id=v_sub.challenge_id;
 if v_sub.status='approved' then return jsonb_build_object('approved',true,'already_approved',true,'xp_earned',0); end if;
 update challenge_submissions set status='approved' where id=p_submission_id;
 select xp,streak,last_practice_date::date into v_newxp,v_streak,v_last from profiles where id=v_sub.user_id for update;
 v_newxp:=coalesce(v_newxp,0)+coalesce(v_reward,0);
 v_streak:=case when v_last=v_today then coalesce(v_streak,0) when v_last=v_yesterday then coalesce(v_streak,0)+1 else 1 end;
 update profiles set xp=v_newxp,streak=v_streak,last_practice_date=now() where id=v_sub.user_id;
 insert into learning_activity(user_id,activity_type,reference_id,xp_earned) values(v_sub.user_id,'challenge',v_sub.challenge_id,coalesce(v_reward,0));
 insert into notifications(user_id,title,message,type) values(v_sub.user_id,'Desafio aprovado!','Seu desafio foi aprovado. Você ganhou +'||coalesce(v_reward,0)||' XP.','success');
 return jsonb_build_object('approved',true,'already_approved',false,'xp_earned',coalesce(v_reward,0),'xp',v_newxp,'streak',v_streak);
end; $$;
grant execute on function public.approve_challenge_secure(uuid) to authenticated;
create or replace function public.set_student_project_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists student_project_updated_at on public.student_projects;
create trigger student_project_updated_at before update on public.student_projects for each row execute function public.set_student_project_updated_at();
