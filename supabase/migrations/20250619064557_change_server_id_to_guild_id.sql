-- Create new guild table
create table guild (
  id text primary key,
  question_limit integer not null default 3,
  question_bank_limit integer not null default 3,
  research_sessions_limit integer not null default 3,
  responses_limit integer not null default 50,
  active boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Drop rate_limits table and its indexes
drop index if exists idx_rate_limits_deleted_at;
drop index if exists idx_rate_limits_active;
drop index if exists idx_rate_limits_server_id;
drop table if exists rate_limits;

-- Add owner_id to research_sessions
alter table research_sessions add column owner_id text;

-- Add guild_id to questions and responses
alter table questions add column guild_id text;
alter table responses add column guild_id text;

-- Rename server_id to guild_id in all tables
alter table question_banks rename column server_id to guild_id;
alter table research_sessions rename column server_id to guild_id;

-- Update indexes to reflect the new column names
drop index if exists idx_question_banks_server_id;
drop index if exists idx_research_sessions_server_id;

create index idx_question_banks_guild_id on question_banks(guild_id);
create index idx_research_sessions_guild_id on research_sessions(guild_id);
create index idx_questions_guild_id on questions(guild_id);
create index idx_responses_guild_id on responses(guild_id);

-- Add foreign key constraints to link tables to guild
alter table question_banks add constraint fk_question_banks_guild_id foreign key (guild_id) references guild(id) on delete cascade;
alter table research_sessions add constraint fk_research_sessions_guild_id foreign key (guild_id) references guild(id) on delete cascade;
alter table questions add constraint fk_questions_guild_id foreign key (guild_id) references guild(id) on delete cascade;
alter table responses add constraint fk_responses_guild_id foreign key (guild_id) references guild(id) on delete cascade;

-- Create index for guild_id lookups
create index idx_guild_id on guild(id);
