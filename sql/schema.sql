-- ReportSense database schema.
-- You do NOT need to run this by hand: the backend creates it automatically.
-- Paste it into Supabase > SQL Editor only if you prefer to create it manually.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_phone_idx on public.profiles (phone);

alter table public.profiles enable row level security;

create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  language          text not null default 'English',
  summary           text,
  results           jsonb not null default '[]'::jsonb,
  urgent            boolean not null default false,
  report_type       text not null default 'other_medical',
  report_type_label text not null default 'Medical Report',
  created_at        timestamptz not null default now()
);

alter table public.reports add column if not exists report_type text default 'other_medical';
alter table public.reports add column if not exists report_type_label text default 'Medical Report';

create index if not exists reports_user_created_idx
  on public.reports (user_id, created_at desc);

alter table public.reports enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users read own profile') then
    create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users update own profile') then
    create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reports' and policyname = 'Users read own reports') then
    create policy "Users read own reports" on public.reports for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reports' and policyname = 'Users delete own reports') then
    create policy "Users delete own reports" on public.reports for delete using (auth.uid() = user_id);
  end if;
end
$$;
