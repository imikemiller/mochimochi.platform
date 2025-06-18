-- Question banks table
     create table question_banks (
       id uuid default gen_random_uuid() primary key,
       server_id text not null,
       name text not null,
       description text,
       status text not null default 'active' check (status in ('active', 'archived')),
       owner_id text not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null,
       updated_at timestamp with time zone default timezone('utc'::text, now()) not null
     );

     -- Questions table
     create table questions (
       id uuid default gen_random_uuid() primary key,
       bank_id uuid references question_banks(id) on delete cascade,
       content text not null,
       category text,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
     );

     -- Research sessions table
     create table research_sessions (
       id uuid default gen_random_uuid() primary key,
       server_id text not null,
       bank_id uuid references question_banks(id) on delete cascade,
       status text not null,
       started_at timestamp with time zone default timezone('utc'::text, now()) not null,
       ended_at timestamp with time zone
     );

     -- Responses table
     create table responses (
       id uuid default gen_random_uuid() primary key,
       session_id uuid references research_sessions(id) on delete cascade,
       user_id text not null,
       question_id uuid references questions(id) on delete cascade,
       response text not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
     );

     -- Rate limits table
     create table rate_limits (
       id uuid default gen_random_uuid() primary key,
       server_id text not null,
       limit_type text not null,
       limit_value integer not null,
       window_seconds integer not null,
       operation_count integer not null default 0,
       window_start timestamp with time zone not null default timezone('utc'::text, now()),
       rate_key text not null,
       deleted_at timestamp with time zone,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
     );

     -- Add indexes
     create index idx_question_banks_server_id on question_banks(server_id);
     create index idx_question_banks_owner_id on question_banks(owner_id);
     create index idx_question_banks_status on question_banks(status);
     create index idx_questions_bank_id on questions(bank_id);
     create index idx_research_sessions_server_id on research_sessions(server_id);
     create index idx_responses_session_id on responses(session_id);
     create index idx_rate_limits_server_id on rate_limits(server_id);
     create index idx_rate_limits_active on rate_limits (rate_key, window_start) where deleted_at is null;
     create index idx_rate_limits_deleted_at on rate_limits (deleted_at) where deleted_at is not null;