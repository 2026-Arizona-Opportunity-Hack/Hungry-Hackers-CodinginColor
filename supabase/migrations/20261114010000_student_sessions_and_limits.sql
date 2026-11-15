-- Student login support. These tables are reachable ONLY by the server (service
-- role): RLS is on, there are no policies, and anon/authenticated are revoked.

-- Generated class codes still avoid look-alikes (see newClassCode in the app),
-- but the demo class code "MVH3AI" contains an I, so don't reject it here.
alter table public.classes drop constraint classes_code_check;
alter table public.classes add constraint classes_code_check check (code ~ '^[A-Z0-9]{6}$');

-- A student who passed the picture-code check gets a random token in an httpOnly
-- cookie. We store only its hash, so a database leak can't be replayed.
create table public.student_sessions (
  token_hash text primary key,
  student_id uuid not null references public.roster_students (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index student_sessions_student_id_idx on public.student_sessions (student_id);
create index student_sessions_expires_at_idx on public.student_sessions (expires_at);

-- There are only 9^3 = 729 picture codes, so wrong guesses are counted per
-- student (and per client) and the join route locks out after a few misses.
create table public.join_attempts (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.roster_students (id) on delete cascade,
  client_key text not null,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);

create index join_attempts_student_time_idx on public.join_attempts (student_id, created_at desc);
create index join_attempts_client_time_idx on public.join_attempts (client_key, created_at desc);

alter table public.student_sessions enable row level security;
alter table public.join_attempts enable row level security;

revoke all on public.student_sessions, public.join_attempts from anon, authenticated;

-- Atomic "+1 wrong answer" (an upsert alone can't increment). Server-only.
create function public.increment_failed_check(p_student_id uuid, p_activity_id text)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.failed_checks (student_id, activity_id, count)
  values (p_student_id, p_activity_id, 1)
  on conflict (student_id, activity_id)
  do update set count = public.failed_checks.count + 1
  returning count;
$$;

revoke execute on function public.increment_failed_check(uuid, text) from public, anon, authenticated;
