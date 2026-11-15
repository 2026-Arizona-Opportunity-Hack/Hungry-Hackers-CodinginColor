-- CIC admin + external reviewer support. ADDITIVE ONLY: new table, nullable new
-- columns, new policies. Nothing is renamed or dropped, so `main` (and the demo
-- teacher login) keep working against this same database.
--
-- Roles live in public.profiles.role: teacher | admin | reviewer.
--   admin     sees every class and cohort, onboards partner schools.
--   reviewer  reads the curriculum only; no student data, no writes.
-- Roles are NEVER taken from user-editable metadata. Accounts are created by
-- the server (service role) or the seed script, which then sets profiles.role.
-- Turn OFF "Allow new users to sign up" in Supabase -> Authentication so nobody
-- can self-register.

-- ---------- schools ----------

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  city text not null default '' check (char_length(city) <= 80),
  state text not null default 'AZ' check (char_length(state) <= 40),
  contact_name text not null default '' check (char_length(contact_name) <= 80),
  contact_email text not null default '' check (char_length(contact_email) <= 120),
  notes text not null default '' check (char_length(notes) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index schools_name_lower_idx on public.schools (lower(name));

alter table public.classes add column school_id uuid references public.schools (id) on delete set null;
alter table public.profiles add column school_id uuid references public.schools (id) on delete set null;
alter table public.profiles add column email text;

create index classes_school_id_idx on public.classes (school_id);
create index profiles_school_id_idx on public.profiles (school_id);

-- Teacher emails live in auth.users, which the browser can't read. Keep a copy
-- on the profile so admins can list their teachers.
update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, split_part(new.email, '@', 1), new.email);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- reviewers are read-only at the database level ----------

create function public.can_teach()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles
                 where id = (select auth.uid()) and role in ('teacher', 'admin'));
$$;

revoke execute on function public.can_teach() from public, anon;

-- Same rules as before, plus: only teachers/admins may create classes or roster
-- rows, so a reviewer account can't write through the API.
drop policy "teachers manage own classes" on public.classes;
create policy "teachers manage own classes" on public.classes
  for all to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()) and (select public.can_teach()));

drop policy "teachers manage own roster" on public.roster_students;
create policy "teachers manage own roster" on public.roster_students
  for all to authenticated
  using (exists (select 1 from public.classes c
                 where c.id = class_id and c.teacher_id = (select auth.uid())))
  with check ((select public.can_teach()) and exists (select 1 from public.classes c
                 where c.id = class_id and c.teacher_id = (select auth.uid())));

-- ---------- schools: RLS ----------

alter table public.schools enable row level security;

create policy "admins manage schools" on public.schools
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "teachers read own school" on public.schools
  for select to authenticated
  using (id = (select school_id from public.profiles where id = (select auth.uid())));

revoke all on public.schools from anon;
