-- SkillUp — ranking por período
-- Execute no SQL Editor do Supabase.

create or replace function public.get_student_ranking(p_period_days integer default 28)
returns table (
  user_id uuid,
  full_name text,
  period_xp bigint,
  total_xp integer,
  position bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_days integer := greatest(1, least(coalesce(p_period_days, 28), 365));
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;

  select organization_id
    into v_org
  from public.profiles
  where id = v_user;

  if v_org is null then
    raise exception 'Aluno sem organização';
  end if;

  return query
  with period_scores as (
    select
      p.id as user_id,
      p.full_name,
      coalesce(sum(la.xp_earned), 0)::bigint as period_xp,
      coalesce(p.xp, 0)::integer as total_xp
    from public.profiles p
    left join public.learning_activity la
      on la.user_id = p.id
     and la.created_at >= case
       when v_days = 7 then date_trunc('week', now())
       else now() - make_interval(days => v_days)
     end
    where p.organization_id = v_org
      and exists (
        select 1
        from public.learning_activity active
        where active.user_id = p.id
          and active.created_at >= now() - make_interval(days => v_days)
          and active.xp_earned > 0
      )
    group by p.id, p.full_name, p.xp
  ),
  ranked as (
    select
      ps.*,
      rank() over (order by ps.period_xp desc, ps.total_xp desc, ps.full_name asc) as position
    from period_scores ps
  ),
  top_ten as (
    select *
    from ranked
    where position <= 10
  ),
  current_user_row as (
    select *
    from ranked
    where user_id = v_user
      and position > 10
  )
  select * from top_ten
  union all
  select * from current_user_row
  order by position;
end;
$$;

grant execute on function public.get_student_ranking(integer) to authenticated;


-- Registra bônus diário de compartilhamento com histórico de XP.
create or replace function public.record_share_bonus(p_bonus integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_last date;
  v_xp integer;
begin
  if v_user is null then raise exception 'Não autenticado'; end if;

  select last_share_date, xp
    into v_last, v_xp
  from public.profiles
  where id = v_user
  for update;

  if v_last = v_today then
    return jsonb_build_object('already_today', true, 'xp', coalesce(v_xp, 0));
  end if;

  v_xp := coalesce(v_xp, 0) + greatest(coalesce(p_bonus, 0), 0);

  update public.profiles
     set xp = v_xp,
         last_share_date = v_today
   where id = v_user;

  insert into public.learning_activity(user_id, activity_type, xp_earned)
  values (v_user, 'project', greatest(coalesce(p_bonus, 0), 0));

  return jsonb_build_object('already_today', false, 'xp', v_xp);
end;
$$;

grant execute on function public.record_share_bonus(integer) to authenticated;
