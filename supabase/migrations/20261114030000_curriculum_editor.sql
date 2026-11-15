-- Curriculum editor: CIC staff build and publish modules without a developer.
-- ADDITIVE ONLY (one new table), so `main` keeps working against this database.
--
-- Each course has two rows: a `draft` (what admins edit) and a `published` copy
-- (what students, teachers and reviewers see). Publishing copies draft -> published.
--
-- There is deliberately NO write policy. All writes go through the admin API
-- route, which checks the caller is an admin and validates the content (sizes,
-- https-only links, answer indexes, unchanged Python tasks) before saving, so
-- unvalidated JSON can never reach this table through the REST API.
-- Reads of the published course go through a public server route, which is fine:
-- the answer keys already ship to every browser today.

create table public.curriculum_courses (
  id uuid primary key default gen_random_uuid(),
  course_id text not null check (char_length(course_id) between 1 and 60),
  status text not null check (status in ('draft', 'published')),
  content jsonb not null,
  version integer not null default 1 check (version >= 1),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  unique (course_id, status)
);

alter table public.curriculum_courses enable row level security;

create policy "admins read curriculum" on public.curriculum_courses
  for select to authenticated
  using ((select public.is_admin()));

revoke all on public.curriculum_courses from anon;
