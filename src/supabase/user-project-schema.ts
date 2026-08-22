export const USER_PROJECT_SCHEMA_SQL = `create table if not exists public.script_batches (
  id text primary key,
  name text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.scripts (
  id text primary key,
  batch_id text not null references public.script_batches(id) on delete cascade,
  number_no text,
  title text not null,
  content text not null,
  enabled boolean not null default true,
  order_index integer not null default 0,
  source jsonb,
  source_spreadsheet_id text,
  source_sheet_url text,
  source_sheet_name text,
  source_row_number integer,
  output_column text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.google_sheet_configs (
  id text primary key,
  name text not null,
  sheet_url text not null,
  sheet_name text,
  app_script_url text not null,
  app_script_token text not null default '',
  updated_at timestamptz not null
);

create table if not exists public.runs (
  id text primary key,
  batch_id text,
  profile_snapshot jsonb,
  selected_script_ids jsonb not null default '[]'::jsonb,
  current_job_index integer not null default 0,
  status text not null,
  active_tab_id integer,
  progress jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.run_jobs (
  id text primary key,
  run_id text not null references public.runs(id) on delete cascade,
  script_id text,
  script_title text,
  script_number_no text,
  profile_name text,
  input_field text,
  order_index integer not null default 0,
  status text,
  tab_id integer,
  url text,
  current_tab_url text,
  started_at timestamptz,
  submitted_at timestamptz,
  output text not null default '',
  error_message text,
  source jsonb,
  sheet_writeback jsonb
);

create table if not exists public.job_results (
  id text primary key,
  run_id text references public.runs(id) on delete cascade,
  script_id text,
  output_stage_id text,
  final_output text not null default '',
  status text,
  stage_result_ids jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  error_message text
);

create table if not exists public.stage_results (
  id text primary key,
  run_id text references public.runs(id) on delete cascade,
  job_id text,
  stage_id text,
  stage_name text,
  input text not null default '',
  response text not null default '',
  started_at timestamptz,
  ended_at timestamptz,
  status text,
  error_message text,
  attempts jsonb not null default '[]'::jsonb
);

create table if not exists public.run_calendar_entries (
  id text primary key,
  run_id text,
  run_ids jsonb not null default '[]'::jsonb,
  calendar_date text,
  profile_name text,
  batch_id text,
  status text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  items jsonb not null default '[]'::jsonb
);

alter table public.script_batches disable row level security;
alter table public.scripts disable row level security;
alter table public.google_sheet_configs disable row level security;
alter table public.runs disable row level security;
alter table public.run_jobs disable row level security;
alter table public.job_results disable row level security;
alter table public.stage_results disable row level security;
alter table public.run_calendar_entries disable row level security;`;
