-- CIC Learn: initial schema.
--
-- Access model
--   * Teachers/admins sign in with Supabase Auth (magic link) and use the
--     normal client; row-level security (RLS) limits them to their own classes.
--   * Students have NO auth account. They join with a class code + picture
--     code through Next.js server routes that use the service-role key, which
--     bypasses RLS. So student-owned tables have teacher/admin policies only,
--     and the `anon` role gets nothing.
--   * Curriculum (courses/modules/activities) lives in code, so `course_id`
--     and activity ids are plain text, not foreign keys.

-- ---------- profiles (roles) ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'teacher' check (role in ('teacher', 'admin', 'reviewer')),
  display_name text,
  created_at timestamptz not null default now()
);

-- Every new sign-in gets a teacher profile. Promote to admin by hand:
--   update public.profiles set role = 'admin' where id = '<user uuid>';
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

revoke execute on function public.is_admin() from public, anon;

-- ---------- classes ----------

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  school text not null default '' check (char_length(school) <= 80),
  teacher_name text not null default '' check (char_length(teacher_name) <= 80),
  -- Six characters, no look-alikes (0/O, 1/I), same alphabet as the app.
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  course_id text not null,
  assigned_module_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index classes_teacher_id_idx on public.classes (teacher_id);

-- ---------- roster ----------

create table public.roster_students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  -- We never store a full name: first name + last initial only.
  first_name text not null check (char_length(first_name) between 1 and 40),
  last_initial text not null default '' check (char_length(last_initial) <= 2),
  -- Three of nine emoji, in order. See web/src/lib/picture-codes.ts.
  picture_code text[] not null check (cardinality(picture_code) = 3),
  last_active_at timestamptz,
  streak_days integer not null default 0 check (streak_days >= 0),
  created_at timestamptz not null default now()
);

create index roster_students_class_id_idx on public.roster_students (class_id);

-- ---------- progress ----------

create table public.activity_results (
  student_id uuid not null references public.roster_students (id) on delete cascade,
  activity_id text not null,
  completed_at timestamptz not null default now(),
  score numeric check (score is null or (score >= 0 and score <= 1)),
  attempts integer not null default 1 check (attempts >= 0),
  seconds_on_task integer not null default 0 check (seconds_on_task >= 0),
  response jsonb,
  primary key (student_id, activity_id)
);

create table public.failed_checks (
  student_id uuid not null references public.roster_students (id) on delete cascade,
  activity_id text not null,
  count integer not null default 0 check (count >= 0),
  primary key (student_id, activity_id)
);

-- ---------- row-level security ----------

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.roster_students enable row level security;
alter table public.activity_results enable row level security;
alter table public.failed_checks enable row level security;

-- profiles: read your own; admins read all. Role changes are done by hand.
create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- classes: teachers manage their own; admins can see everything.
create policy "teachers manage own classes" on public.classes
  for all to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));

create policy "admins read all classes" on public.classes
  for select to authenticated
  using ((select public.is_admin()));

-- roster: through the class.
create policy "teachers manage own roster" on public.roster_students
  for all to authenticated
  using (exists (select 1 from public.classes c
                 where c.id = class_id and c.teacher_id = (select auth.uid())))
  with check (exists (select 1 from public.classes c
                      where c.id = class_id and c.teacher_id = (select auth.uid())));

create policy "admins read all roster" on public.roster_students
  for select to authenticated
  using ((select public.is_admin()));

-- results + failed checks: teachers read their students' progress (read-only;
-- students write through the server routes), admins read all.
create policy "teachers read own results" on public.activity_results
  for select to authenticated
  using (exists (select 1 from public.roster_students s
                 join public.classes c on c.id = s.class_id
                 where s.id = student_id and c.teacher_id = (select auth.uid())));

create policy "admins read all results" on public.activity_results
  for select to authenticated
  using ((select public.is_admin()));

create policy "teachers read own failed checks" on public.failed_checks
  for select to authenticated
  using (exists (select 1 from public.roster_students s
                 join public.classes c on c.id = s.class_id
                 where s.id = student_id and c.teacher_id = (select auth.uid())));

create policy "admins read all failed checks" on public.failed_checks
  for select to authenticated
  using ((select public.is_admin()));

-- Teachers may reset a student's progress (the app's "reset" button).
create policy "teachers delete own results" on public.activity_results
  for delete to authenticated
  using (exists (select 1 from public.roster_students s
                 join public.classes c on c.id = s.class_id
                 where s.id = student_id and c.teacher_id = (select auth.uid())));

create policy "teachers delete own failed checks" on public.failed_checks
  for delete to authenticated
  using (exists (select 1 from public.roster_students s
                 join public.classes c on c.id = s.class_id
                 where s.id = student_id and c.teacher_id = (select auth.uid())));

-- The anonymous (signed-out) role never touches these tables directly.
revoke all on public.profiles, public.classes, public.roster_students,
  public.activity_results, public.failed_checks from anon;
