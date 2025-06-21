import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  QuestionBank,
  Question,
  ResearchSession,
  Response,
  Guild,
  UserId,
  DiscordUser,
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

  if (error) return [];
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

  if (error) return [];
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

  if (error) return null;
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

  if (error) return null;
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

  if (error) return null;
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

  if (error) return null;
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

  if (error) return null;
  return data;
}

// Research Session operations
export async function createResearchSession(
  session: Omit<ResearchSession, "id" | "started_at" | "ended_at">
) {
  const { data, error } = await getSupabase()
    .from("research_sessions")
    .insert(session)
    .select()
    .single();

  if (error) return null;
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

  if (error) return null;
  return data as Response;
}

export async function getGuilds({ userId }: { userId: UserId }) {
  const { data, error } = await getSupabase()
    .from("guild")
    .select("*")
    .eq("owner_id", userId);

  if (error) return null;
  return data as Guild[];
}

export async function getActiveGuild({ userId }: { userId: UserId }) {
  const { data, error } = await getSupabase()
    .from("guild")
    .select("*")
    .eq("owner_id", userId)
    .eq("active", true)
    .single();

  if (error) return null;
  return data as Guild;
}

export async function getGuild({ guildId }: { guildId: string }) {
  const { data, error } = await getSupabase()
    .from("guild")
    .select("*")
    .eq("id", guildId)
    .single();

  if (error) return null;
  return data as Guild;
}

export async function setActiveGuild({
  guildId,
  ownerId,
}: {
  guildId: string;
  ownerId: UserId;
}) {
  const supabase = getSupabase();
  await supabase
    .from("guild")
    .update({ active: false })
    .eq("owner_id", ownerId);
  const { data, error } = await supabase
    .from("guild")
    .upsert({ id: guildId, owner_id: ownerId, active: true })
    .select()
    .single();

  if (error) return null;
  return data as Guild;
}

export async function getDiscordUser({
  discordUserId,
}: {
  discordUserId: string;
}) {
  const { data, error } = await getSupabase()
    .from("discord_users")
    .select("*")
    .eq("discord_user_id", discordUserId)
    .single();

  if (error) return null;
  return data as DiscordUser;
}

export async function upsertDiscordUser({
  discordUserId,
  name,
}: {
  discordUserId: string;
  name: string;
}) {
  const { data, error } = await getSupabase()
    .from("discord_users")
    .upsert({ discord_user_id: discordUserId, name, updated_at: new Date() })
    .select()
    .single();

  if (error) return null;
  return data as DiscordUser;
}

export async function upsertResearchSession(session: Partial<ResearchSession>) {
  const { data, error } = await getSupabase()
    .from("research_sessions")
    .upsert({ ...session, updated_at: new Date() })
    .select()
    .single();

  if (error) return null;
  return data as ResearchSession;
}

export async function getResearchSession({ sessionId }: { sessionId: string }) {
  const { data, error } = await getSupabase()
    .from("research_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) return null;
  return data as ResearchSession;
}

export async function getActiveResearchSession({ userId }: { userId: string }) {
  const { data, error } = await getSupabase()
    .from("research_sessions")
    .select("*")
    .eq("responder_id", userId)
    .eq("status", "active")
    .single();

  if (error) return null;
  return data as ResearchSession;
}

export async function createResponse(
  response: Omit<Response, "id" | "createdAt">
) {
  const { data, error } = await getSupabase()
    .from("responses")
    .insert({ ...response })
    .select()
    .single();

  if (error) return null;
  return data as Response;
}

export async function getAvailableQuestionBanks({
  discordUserId,
  ownerId,
}: {
  discordUserId: string;
  ownerId: string;
}) {
  const { data, error } = await getSupabase()
    .from("question_banks")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", "active")
    .not(
      "id",
      "in",
      getSupabase()
        .from("research_sessions")
        .select("bank_id")
        .eq("responder_id", discordUserId)
    );

  if (error) return null;
  return data as QuestionBank[];
}

export async function getNextQuestion({ sessionId }: { sessionId: string }) {
  // Get the session to find the bank_id
  const session = await getResearchSession({ sessionId });
  if (!session) {
    throw new Error("Session not found");
  }

  // Get all questions in the bank
  const questions = await getQuestions({
    bankId: session.bank_id,
    guildId: session.guild_id,
  });

  // Get all responses for this session
  const { data: responses, error: responsesError } = await getSupabase()
    .from("responses")
    .select("question_id")
    .eq("session_id", sessionId);

  if (responsesError) throw responsesError;

  // Find answered question IDs
  const answeredQuestionIds = new Set(responses.map((r) => r.question_id));

  // Find the next unanswered question
  const nextQuestion = questions.find(
    (question) => !answeredQuestionIds.has(question.id)
  );

  // If no next question found, all questions are answered - complete the session
  if (!nextQuestion && session.status === "active") {
    const { data, error } = await getSupabase()
      .from("research_sessions")
      .update({
        status: "completed",
        ended_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) return null;
    return { session: data as ResearchSession, nextQuestion: null };
  }

  const { error: questionError } = await getSupabase()
    .from("research_sessions")
    .update({
      current_question_id: nextQuestion?.id,
      updated_at: new Date(),
    })
    .eq("id", sessionId);

  if (questionError) throw questionError;

  return { session, nextQuestion: nextQuestion as Question };
}

export async function getCurrentQuestion({ sessionId }: { sessionId: string }) {
  const { data, error } = await getSupabase()
    .from("research_sessions")
    .select("current_question_id")
    .eq("id", sessionId)
    .single();

  if (error) return null;

  const { data: question, error: questionError } = await getSupabase()
    .from("questions")
    .select("*")
    .eq("id", data.current_question_id)
    .single();

  if (questionError) throw questionError;
  return question as Question;
}
