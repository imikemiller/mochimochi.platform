import { z } from "zod";

export const createQuestionSchema = z.object({
  content: z.string().min(1, "Question content is required"),
  context: z.string().optional(),
});

export const listQuestionsSchema = z.object({
  serverId: z.string(),
});

export const editQuestionSchema = z.object({
  questionId: z.string(),
  content: z.string().optional(),
});

export const configureLimitsSchema = z.object({
  serverId: z.string(),
  limits: z.object({
    questionsPerDay: z.number().min(1),
    recipientsPerQuestion: z.number().min(1),
    minTimeBetweenQuestions: z.number().min(0),
  }),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type ListQuestionsInput = z.infer<typeof listQuestionsSchema>;
export type EditQuestionInput = z.infer<typeof editQuestionSchema>;
export type ConfigureLimitsInput = z.infer<typeof configureLimitsSchema>;
