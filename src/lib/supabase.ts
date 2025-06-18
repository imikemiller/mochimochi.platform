import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  QuestionBank,
  Question,
  ResearchSession,
  Response,
} from "../types";

let supabase: SupabaseClient | null = null;

export function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL and SUPABASE_KEY must be set");
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// Question Bank operations
export async function getQuestionBanks(serverId: string) {
  const { data, error } = await getSupabase()
    .from("question_banks")
    .select("*")
    .eq("server_id", serverId)
    .eq("status", "active");

  if (error) throw error;
  return data as QuestionBank[];
}

// Question operations
export async function getQuestions(bankId: string) {
  const { data, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
    .from("responses")
    .insert(response)
    .select()
    .single();

  if (error) throw error;
  return data as Response;
}
