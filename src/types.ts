// Discord types
export type ServerId = string;
export type UserId = string;

// Question Bank types
export interface QuestionBank {
  id: string;
  server_id: ServerId;
  name: string;
  status: "active" | "archived";
  owner_id: UserId;
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: string;
  bank_id: string;
  content: string;
  category?: string;
  created_at: Date;
}

// Research Session types
export interface ResearchSession {
  id: string;
  server_id: ServerId;
  bank_id: string;
  status: "active" | "completed" | "cancelled";
  started_at: Date;
  endedAt?: Date;
}

export interface Response {
  id: string;
  session_id: string;
  user_id: UserId;
  question_id: string;
  response: string;
  created_at: Date;
}
