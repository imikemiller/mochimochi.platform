import { openai } from "@ai-sdk/openai";
import {
  generateText,
  streamText,
  tool,
  ToolCallPart,
  ToolResultPart,
} from "ai";
import { DiscordService } from "./discord";
import z from "zod";
import {
  createQuestion,
  createQuestionBank,
  deleteQuestion,
  deleteQuestionBank,
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

- Creating their survey questions. You can use the \`create_question\` tool to save a survey question. Questions are grouped into question banks. You must pass a valid question bank in in the form of a UUID returned from the \`view_question_banks\` tool.
- Viewing their question banks. You can use the \`view_question_banks\` tool to view a list of the users existing question banks.
- Creating new question banks. You can use the \`create_question_bank\` tool to create a new question bank. Question banks are logically similar to a survey and are made up of multiple questions.
- Viewing the questions in the question banks. You can use the \`view_questions\` tool to view the questions in the question banks by passing in the question bank id. You must pass a valid question bank id in the form of a UUID returned from the \`view_question_banks\` tool.
- Editing an existing question in a bank. You can use the \`edit_question\` tool to edit an existing question in a bank by passing in the question bank id and the question id. You must pass a valid question bank id and question id in the form of UUIDs returned from the \`view_questions\` tool.

# Tools
- \`create_question\`: Create a new survey question.
- \`view_question_banks\`: View the user's question banks.
- \`create_question_bank\`: Create a new question bank.
- \`view_questions\`: View the questions in a question bank.
- \`edit_question\`: Edit an existing question in a question bank.
- \`delete_question\`: Delete an existing question in a question bank.
- \`delete_question_bank\`: Delete an existing question bank.

NEVER invent any UUIDs. Always use the UUIDs returned from the tools. THIS IS VERY IMPORTANT - NEITHER YOU OR THE USER CAN CREATE THEIR OWN UUIDS. THEY ARE SYSTEM GENERATED.
NEVER expose the internal system IDs to the user.
NEVER duplicate questions or question banks. Always check using the view tools to see if the question or question bank already exists.
To create questions in a new question bank, you must first create a new question bank using the \`create_question_bank\` tool, then use the \`create_question\` tool to create the questions.
If you aren't sure what the UUID is then you can use the \`view_question_banks\` tool to view the question banks and see the UUIDs.

# Rules
- Your communication style should be professional but informal. You can use emojis make occasional references to Japanese culture and gaming industry but not too much. Be human too.
- You should also be able to handle errors and provide helpful feedback to the user.
- You should also be able to handle user requests for help and provide helpful feedback to the user.
- Don't refer directly to question banks but explain them conceptually as groups of questions or similar to surveys.
- When you introduce yourself explain what mochimochi is and what it does - although its aimed at game developers, it can be used by anyone so don't assume it's only for game developers.
- You can ask the user for the kind of feedback they are looking for and what the subject of the feedback is to get more context.
- Only propose edits of questions if the user has existing question banks stored in the database.
- If the user does not specify which question bank to use, ask them for a name to create a new question bank.
- Make sure to walk the user through the process rather than helping them create the questions.

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
    try {
      await this.discordService.startTyping(channelId);

      const result = await generateText({
        model: openai("gpt-4.1"),
        messages: [...history],
        system: systemPrompt,
        maxSteps: 10,
        tools: {
          create_question: tool({
            description: "Create a new survey question",
            parameters: z.object({
              question: z.string(),
              question_bank_id: z.string(),
            }),
            execute: async (input) => {
              const question = await createQuestion({
                content: input.question,
                bank_id: input.question_bank_id,
                created_at: new Date(),
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
                server_id: serverId,
                status: "active",
                owner_id: userId,
                created_at: new Date(),
                updated_at: new Date(),
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
                bank_id: input.question_bank_id,
                created_at: new Date(),
              });
              return question;
            },
          }),
          delete_question: tool({
            description: "Delete an existing question in a question bank",
            parameters: z.object({
              question_bank_id: z.string(),
              question_id: z.string(),
            }),
            execute: async (input) => {
              const question = await deleteQuestion(input.question_id);
              return question;
            },
          }),
          delete_question_bank: tool({
            description: "Delete an existing question bank",
            parameters: z.object({
              question_bank_id: z.string(),
            }),
            execute: async (input) => {
              const questionBank = await deleteQuestionBank(
                input.question_bank_id
              );
              return questionBank;
            },
          }),
        },
      });

      return result.text;
    } catch (error) {
      console.error("Error in handleMessage:", error);
      throw error;
    }
  }
}
