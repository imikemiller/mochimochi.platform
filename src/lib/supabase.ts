import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  QuestionBank,
  Question,
  ResearchSession,
  Response,
  Guild,
  UserId,
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
export async function getQuestionBanks({
  guildId,
}: {
  guildId: string;
}): Promise<QuestionBank[]> {
  const { data, error } = await getSupabase()
    .from("question_banks")
    .select("*")
    .eq("guild_id", guildId)
    .eq("status", "active");

  if (error) throw error;
  return data as QuestionBank[];
}

// Question operations
export async function getQuestions({
  bankId,
  guildId,
}: {
  bankId: string;
  guildId: string;
}): Promise<Question[]> {
  const { data, error } = await getSupabase()
    .from("questions")
    .select("*")
    .eq("bank_id", bankId)
    .eq("guild_id", guildId);

  if (error) throw error;
  return data as Question[];
}

export async function createQuestionBank(
  bank: Omit<QuestionBank, "id" | "createdAt">
) {
  const { data, error } = await getSupabase()
    .from("question_banks")
    .insert(bank)
    .select()
    .single();

  if (error) throw error;
  return data as QuestionBank;
}

export async function createQuestion(
  question: Omit<Question, "id" | "createdAt">
) {
  const { data, error } = await getSupabase()
    .from("questions")
    .insert(question)
    .select()
    .single();

  if (error) throw error;
  return data as Question;
}

export async function updateQuestion(question: Omit<Question, "createdAt">) {
  const { data, error } = await getSupabase()
    .from("questions")
    .update(question)
    .eq("id", question.id)
    .eq("guild_id", question.guild_id)
    .select()
    .single();

  if (error) throw error;
  return data as Question;
}

export async function deleteQuestion({
  questionId,
  guildId,
}: {
  questionId: string;
  guildId: string;
}) {
  const { data, error } = await getSupabase()
    .from("questions")
    .delete()
    .eq("id", questionId)
    .eq("guild_id", guildId);

  if (error) throw error;
  return data;
}

export async function deleteQuestionBank({
  questionBankId,
  guildId,
}: {
  questionBankId: string;
  guildId: string;
}) {
  const { data, error } = await getSupabase()
    .from("question_banks")
    .delete()
    .eq("id", questionBankId)
    .eq("guild_id", guildId);

  if (error) throw error;
  return data;
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

export async function getguild({ userId }: { userId: UserId }) {
  const { data, error } = await getSupabase()
    .from("guild")
    .select("*")
    .eq("owner_id", userId);

  if (error) throw error;
  return data as Guild[];
}

export async function getActiveGuild({ userId }: { userId: UserId }) {
  const { data, error } = await getSupabase()
    .from("guild")
    .select("*")
    .eq("owner_id", userId)
    .eq("active", true)
    .single();

  if (error) throw error;
  return data as Guild;
}

export async function getGuild({ guildId }: { guildId: string }) {
  const { data, error } = await getSupabase()
    .from("guild")
    .select("*")
    .eq("id", guildId)
    .single();

  if (error) throw error;
  return data as Guild;
}

export async function setActiveGuild({
  guildId,
  userId,
}: {
  guildId: string;
  userId: UserId;
}) {
  const supabase = getSupabase();
  await supabase.from("guild").update({ active: false }).eq("owner_id", userId);
  const { data, error } = await supabase
    .from("guild")
    .upsert({ id: guildId, owner_id: userId, active: true })
    .select()
    .single();

  if (error) throw error;
  return data as Guild;
}
