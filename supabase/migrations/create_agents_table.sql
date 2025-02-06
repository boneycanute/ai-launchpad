-- Create the agents table
create table "public"."agents" (
  -- Primary Fields
  "id" uuid primary key default gen_random_uuid(),
  "agent_id" text not null unique,
  "status" text not null,
  "vector_db_data" jsonb,
  "deployed_link" text,

  -- Basic Information
  "user_id" text not null,
  "agent_name" text not null,
  "description" text not null default '',
  "primary_model" text not null check (primary_model in ('openai', 'claude', 'deepseek')),
  "fallback_model" text not null check (fallback_model in ('openai', 'claude', 'deepseek')),

  -- Capabilities
  "system_prompt" text not null default '',
  "knowledge_base" jsonb not null default '{"files": []}'::jsonb,

  -- Appearance
  "agent_icon" jsonb,
  "user_message_color" text not null default '#F0F9FF',
  "agent_message_color" text not null default '#E0F2FE',
  "opening_message" text not null default '',
  "quick_messages" jsonb not null default '[]'::jsonb,

  -- RAG Configuration
  "vector_db_config" jsonb,
  "document_urls" jsonb not null default '[]'::jsonb,

  -- Creation Progress
  "creation_progress" jsonb not null default '{
    "state": "initialized",
    "started_at": null,
    "updated_at": null,
    "error": null
  }'::jsonb,

  -- Access Control
  "is_paid" boolean not null default false,
  "is_public" boolean not null default false,

  -- Metadata
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
  "updated_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for frequently queried columns
create index agents_user_id_idx on public.agents(user_id);
create index agents_agent_name_idx on public.agents(agent_name);
create index agents_status_idx on public.agents(status);
create index agents_agent_id_idx on public.agents(agent_id);

-- Add RLS (Row Level Security) policies
alter table "public"."agents" enable row level security;

-- Policy for users to read their own agents and public agents
create policy "Users can read their own agents and public agents"
  on "public"."agents"
  for select
  using (
    auth.uid()::text = user_id
    or is_public = true
  );

-- Policy for users to create their own agents
create policy "Users can create their own agents"
  on "public"."agents"
  for insert
  with check (auth.uid()::text = user_id);

-- Policy for users to update their own agents
create policy "Users can update their own agents"
  on "public"."agents"
  for update
  using (auth.uid()::text = user_id);

-- Policy for users to delete their own agents
create policy "Users can delete their own agents"
  on "public"."agents"
  for delete
  using (auth.uid()::text = user_id);

-- Function to automatically update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the updated_at function before update
create trigger handle_agents_updated_at
  before update on public.agents
  for each row
  execute procedure public.handle_updated_at();
