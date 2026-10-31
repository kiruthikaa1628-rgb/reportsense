// SQL that the backend runs automatically (idempotent: safe to run many times).
// The same SQL is also in /sql/schema.sql if you prefer to paste it in the Supabase SQL editor.
export const SCHEMA = `
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

do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'reports'
                   and policyname = 'Users read own reports') then
    create policy "Users read own reports" on public.reports
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'reports'
                   and policyname = 'Users delete own reports') then
    create policy "Users delete own reports" on public.reports
      for delete using (auth.uid() = user_id);
  end if;
end
$$;
`;
