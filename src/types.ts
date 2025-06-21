// Discord types

export type UserId = string;
export type GuildId = string;

// Guild types
export interface Guild {
  id: GuildId;
  question_limit: number;
  question_bank_limit: number;
  research_sessions_limit: number;
  responses_limit: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Question Bank types
export interface QuestionBank {
  id: string;
  guild_id: GuildId;
  name: string;
  status: "active" | "archived";
  owner_id: UserId;
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: string;
  bank_id: string;
  guild_id: GuildId;
  content: string;
  category?: string;
  created_at: Date;
}

// Research Session types
export interface ResearchSession {
  id: string;
  guild_id: GuildId;
  bank_id: string;
  owner_id: UserId;
  responder_id: UserId;
  status: "active" | "completed" | "cancelled";
  started_at: Date;
  ended_at?: Date;
}

export interface Response {
  id: string;
  session_id: string;
  owner_id: UserId;
  user_id: UserId;
  question_id: string;
  response: string;
  created_at: Date;
}

export interface DiscordUser {
  id: string;
  discord_user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}
