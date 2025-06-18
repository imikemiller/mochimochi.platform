// Discord types
export type ServerId = string;
export type UserId = string;

// Question Bank types
export interface QuestionBank {
  id: string;
  serverId: ServerId;
  name: string;
  description?: string;
  status: "active" | "archived";
  ownerId: UserId;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  bankId: string;
  content: string;
  category?: string;
  createdAt: Date;
}

// Research Session types
export interface ResearchSession {
  id: string;
  serverId: ServerId;
  bankId: string;
  status: "active" | "completed" | "cancelled";
  startedAt: Date;
  endedAt?: Date;
}

export interface Response {
  id: string;
  sessionId: string;
  userId: UserId;
  questionId: string;
  response: string;
  createdAt: Date;
}
