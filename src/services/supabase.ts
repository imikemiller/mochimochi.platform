import { createClient } from "@supabase/supabase-js";
import type {
  QuestionBank,
  Question,
  ResearchSession,
  Response,
} from "../types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Question Bank operations
export async function getQuestionBanks(serverId: string) {
  const { data, error } = await supabase
    .from("question_banks")
    .select("*")
    .eq("server_id", serverId)
    .eq("status", "active");

  if (error) throw error;
  return data as QuestionBank[];
}

// Question operations
export async function getQuestions(bankId: string) {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("bank_id", bankId);

  if (error) throw error;
  return data as Question[];
}

// Research Session operations
export async function createResearchSession(
  session: Omit<ResearchSession, "id" | "startedAt">
) {
  const { data, error } = await supabase
    .from("research_sessions")
    .insert(session)
    .select()
    .single();

  if (error) throw error;
  return data as ResearchSession;
}

// Response operations
export async function saveResponse(
  response: Omit<Response, "id" | "createdAt">
) {
  const { data, error } = await supabase
    .from("responses")
    .insert(response)
    .select()
    .single();

  if (error) throw error;
  return data as Response;
}
