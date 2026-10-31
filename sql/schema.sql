-- ReportSense database schema.
-- You do NOT need to run this by hand: the backend creates it automatically.
-- Paste it into Supabase > SQL Editor only if you prefer to create it manually.

create extension if not exists pgcrypto;

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  language    text not null default 'English',
  summary     text,
  results     jsonb not null default '[]'::jsonb,
  urgent      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists reports_user_created_idx
  on public.reports (user_id, created_at desc);

alter table public.reports enable row level security;

create policy "Users read own reports" on public.reports
  for select using (auth.uid() = user_id);

create policy "Users delete own reports" on public.reports
  for delete using (auth.uid() = user_id);
