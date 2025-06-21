create table discord_users (
    id uuid default gen_random_uuid() primary key,
    discord_user_id text not null unique,
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);


alter table research_sessions add column responder_id text;

alter table research_sessions add constraint fk_research_sessions_responder_id foreign key (responder_id) references discord_users(discord_user_id) on delete cascade;

create index idx_research_sessions_responder_id on research_sessions(responder_id);

create index idx_discord_users_discord_user_id on discord_users(discord_user_id);