import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { DiscordService } from "./discord";
import z from "zod";
import {
  createQuestion,
  createQuestionBank,
  getQuestionBanks,
  getQuestions,
  updateQuestion,
} from "./supabase";

export type MessageHistory = {
  role: "user" | "assistant" | "system";
  content: string;
};

const systemPrompt = `You are mochimochi, an AI agent who is great at assisting users with setting up their mochimochi bot in discord.

The mochimochi bot automates user research by sending short survey questions to discord users to help game developers get better feedback on their games.

Game developers want to answer questions about their game like how their users felt about new features or game mechanics or about what they would like to see in the next version of the game.

The main tasks that mochimochi users want assistance with are:

- Create their survey questions. You can use the \`create_survey_question\` tool to save a survey question. Survey questions are grouped into question banks.
- View their question banks. You can use the \`view_question_banks\` tool to view the question banks.
- Create new question banks. You can use the \`create_question_bank\` tool to create a new question bank. Question banks are logically similar to a survey and are made up of multiple questions.
- View the questions in the question banks. You can use the \`view_questions\` tool to view the questions in the question banks by passing in the question bank id.
- Edit an existing question in a bank. You can use the \`edit_question\` tool to edit an existing question in a bank by passing in the question bank id and the question id.

Your communication style should be professional but informal. You can use emojis make occasional references to Japanese culture and gaming industry but not too much. Be human too.

You should also be able to handle errors and provide helpful feedback to the user.

You should also be able to handle user requests for help and provide helpful feedback to the user.

Don't refer directly to question banks but explain them conceptually as groups of questions or similar to surveys.

When you introduce yourself explain what mochimochi is and what it does - although its aimed at game developers, it can be used by anyone so don't assume it's only for game developers.

You can ask the user for the kind of feedback they are looking for and what the subject of the feedback is to get more context.

Only propose edits of questions if the user has existing question banks stored in the database.

If the user does not specify which question bank to use, ask them for a name to create a new question bank.

Make sure to walk the user through the process rather than helping them create the questions.
`;

export class AssistantService {
  private discordService: DiscordService;

  constructor(discordService: DiscordService) {
    this.discordService = discordService;
  }

  async handleMessage({
    channelId,
    history,
    serverId,
    userId,
  }: {
    channelId: string;
    history: MessageHistory[];
    serverId: string;
    userId: string;
  }) {
    await this.discordService.startTyping(channelId);

    console.log("history", history);

    const result = streamText({
      model: openai("gpt-4.1"),
      messages: history,
      system: systemPrompt,
      maxSteps: 5, // Enable multi-step tool calling
      tools: {
        create_survey_question: tool({
          description: "Create a new survey question",
          parameters: z.object({
            question: z.string(),
            question_bank_id: z.string(),
          }),
          execute: async (input) => {
            const question = await createQuestion({
              content: input.question,
              bankId: input.question_bank_id,
            });
            return question;
          },
        }),
        view_question_banks: tool({
          description: "View the user's question banks",
          parameters: z.object({}),
          execute: async (input) => {
            const questionBanks = await getQuestionBanks(serverId);
            return questionBanks;
          },
        }),
        create_question_bank: tool({
          description: "Create a new question bank",
          parameters: z.object({
            name: z.string(),
          }),
          execute: async (input) => {
            const questionBank = await createQuestionBank({
              name: input.name,
              serverId,
              status: "active",
              ownerId: userId,
              updatedAt: new Date(),
            });
            return questionBank;
          },
        }),
        view_questions: tool({
          description: "View the questions in a question bank",
          parameters: z.object({
            question_bank_id: z.string(),
          }),
          execute: async (input) => {
            const questions = await getQuestions(input.question_bank_id);
            return questions;
          },
        }),
        edit_question: tool({
          description: "Edit an existing question in a question bank",
          parameters: z.object({
            question_bank_id: z.string(),
            question_id: z.string(),
            question: z.string(),
          }),
          execute: async (input) => {
            const question = await updateQuestion({
              id: input.question_id,
              content: input.question,
              bankId: input.question_bank_id,
            });
            return question;
          },
        }),
      },
    });

    let response = "";
    try {
      for await (const chunk of result.textStream) {
        response += chunk;
        await this.discordService.startTyping(channelId);
      }
      return response;
    } catch (error) {
      console.error("Error in handleMessage:", error);
      throw error;
    }
  }
}
