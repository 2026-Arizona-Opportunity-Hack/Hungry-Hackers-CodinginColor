-- Self-learners: people who learn on their own (no class, no teacher). They get a
-- real account (a "learner" profile) and a roster row in ONE hidden, self-paced class,
-- so the existing lesson screens, progress API, analytics and admin dashboard work
-- unchanged, and the admin sees them as their own cohort.
--
-- Mostly additive. The role default changes to the least-privileged value.

-- 1. A new role. The default is now 'learner': anyone who ends up with a profile and
--    nobody assigned them a role can't teach, review or administer. Server code that
--    makes teachers, admins and reviewers (the seed and the onboard route) sets the
--    role explicitly. NOTE: a user added by hand in the Supabase dashboard is now a
--    'learner' until you set profiles.role.
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('teacher', 'admin', 'reviewer', 'learner'));
alter table public.profiles alter column role set default 'learner';

-- 2. The hidden class has no teacher, and is marked self-paced (every module is open
--    and new modules appear automatically).
alter table public.classes alter column teacher_id drop not null;
alter table public.classes add column self_paced boolean not null default false;
-- At most one self-paced class per course, so two sign-ups at once can't make two.
create unique index classes_one_self_paced_per_course on public.classes (course_id) where self_paced;

-- 3. Links a roster row to the account that owns it. Null for ordinary class students.
alter table public.roster_students add column user_id uuid unique references auth.users (id) on delete cascade;

-- 4. The hidden class itself. Its join code is random and never shown anywhere, and the
--    join routes also refuse self-paced classes, so nobody can "join" it by code.
insert into public.classes (name, school, teacher_name, code, course_id, assigned_module_ids, self_paced)
values ('Independent learners', 'Independent learners', 'Self-paced', upper(substr(md5(random()::text), 1, 6)), 'intro-ai', '{}', true)
on conflict (course_id) where self_paced do nothing;
