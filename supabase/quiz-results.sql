create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id text not null,
  dataset_version text not null,
  level text not null check (level in ('basic', 'intermediate', 'advanced')),
  total_questions integer not null check (total_questions > 0),
  correct_answers integer not null check (correct_answers between 0 and total_questions),
  score_percent integer not null check (score_percent between 0 and 100),
  answers jsonb not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, attempt_id)
);

alter table public.quiz_attempts enable row level security;

create policy "Users can read their own quiz results"
  on public.quiz_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quiz results"
  on public.quiz_attempts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own quiz results"
  on public.quiz_attempts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
