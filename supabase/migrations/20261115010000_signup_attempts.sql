-- Durable rate limit for self-learner sign-up. The old limit lived in server memory,
-- which resets on every deploy and isn't shared between serverless instances, so on
-- Vercel it barely limited anything. This table is shared by all instances.
-- Additive only. Server-only: RLS on, no policies, no access for anon/authenticated.
create table public.signup_attempts (
  id bigint generated always as identity primary key,
  client_key text not null,
  created_at timestamptz not null default now()
);

create index signup_attempts_client_time_idx on public.signup_attempts (client_key, created_at desc);
create index signup_attempts_time_idx on public.signup_attempts (created_at desc);

alter table public.signup_attempts enable row level security;
revoke all on public.signup_attempts from anon, authenticated;
