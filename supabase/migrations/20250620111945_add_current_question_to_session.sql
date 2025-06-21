alter table research_sessions add column current_question_id uuid;
alter table research_sessions add column responder_id text;

alter table research_sessions add constraint fk_research_sessions_current_question_id foreign key (current_question_id) references questions(id) on delete cascade;
alter table research_sessions add constraint fk_research_sessions_responder_id foreign key (responder_id) references discord_users(discord_user_id) on delete cascade;

create index idx_research_sessions_current_question_id on research_sessions(current_question_id);

alter table responses drop column guild_id;

alter table responses add column owner_id text;