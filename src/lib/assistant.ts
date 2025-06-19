import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import z from "zod";
import { DiscordService } from "./discord";
import {
  createQuestion,
  createQuestionBank,
  deleteQuestion,
  deleteQuestionBank,
  getActiveGuild,
  getGuild,
  getQuestionBanks,
  getQuestions,
  setActiveGuild,
  updateQuestion,
} from "./supabase";

export type MessageHistory = {
  role: "user" | "assistant" | "system";
  content: string;
};

const systemPrompt = `
You are mochimochi, an AI agent who is great at assisting users with setting up their mochimochi bot in discord.

The mochimochi bot automates user research by sending short survey questions to discord users to help game developers get better feedback on their games.

Game developers want to answer questions about their game like how their users felt about new features or game mechanics or about what they would like to see in the next version of the game.

The main tasks that mochimochi users want assistance with are:

- Creating their survey questions. You can use the \`create_question\` tool to save a survey question. Questions are grouped into question banks.
- Viewing their question banks. You can use the \`view_question_banks\` tool to view a list of the users existing question banks.
- Creating new question banks. You can use the \`create_question_bank\` tool to create a new question bank. Question banks are logically similar to a survey and are made up of multiple questions.
- Viewing the questions in the question banks. You can use the \`view_questions\` tool to view the questions in the question banks by passing in the question bank id.
- Editing an existing question in a bank. You can use the \`edit_question\` tool to edit an existing question in a bank by passing in the question bank id and the question id.

# Tools
- \`create_question\`: Create a new survey question.
- \`view_question_banks\`: View the user's question banks.
- \`create_question_bank\`: Create a new question bank.
- \`view_questions\`: View the questions in a question bank.
- \`edit_question\`: Edit an existing question in a question bank.
- \`delete_question\`: Delete an existing question in a question bank.
- \`delete_question_bank\`: Delete an existing question bank.
- \`view_guilds\`: View the servers that the user has access to.
- \`get_active_guild\`: Get the server that the user is currently setting up mochimochi on.
- \`set_active_guild\`: Set the active server that the user wants to set up mochimochi on.

All the tools that you use must be passed the active guild id. You can get the active guild id using the \`get_active_guild\` tool. If there is no active guild, you need to ask the user which guild they want to use. You can find the available options for the user with the \`view_guilds\` tool.

# Important
- Always check if the user has an active guild set. If they don't, you should ask them to select which guild they want to use.
- The information returned from get_active_guild contains information about the user's plan and limits. Use this information to help the user understand what they can do.
- System IDs for questions, question banks, research sessions, and responses are in format of UUIDs.
- Discord IDs for guilds and users are in format of numbers with 18 digits - make sure to keep an eye on these and use them correctly.
- NEVER invent any UUIDs. Always use the UUIDs returned from the view tools. THIS IS VERY IMPORTANT - NEITHER YOU OR THE USER CAN CREATE THEIR OWN UUIDS. THEY ARE SYSTEM GENERATED.
- NEVER expose the internal system IDs to the user.
- NEVER duplicate questions or question banks. Always check using the view tools to see if the question or question bank already exists.
- To create questions in a new question bank, you must first create a new question bank using the \`create_question_bank\` tool, then use the \`create_question\` tool to create the questions.
- If you aren't sure what the UUID is then you can use the \`view_question_banks\` tool to view the question banks and see the UUIDs.
- If you aren't sure what the guild id is then you can use the \`get_active_guild\` tool to find the right guild id to use.

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
    userId,
    guildId,
  }: {
    channelId: string;
    history: MessageHistory[];
    userId: string;
    guildId?: string;
  }) {
    try {
      await this.discordService.startTyping(channelId);

      const result = await generateText({
        model: openai("gpt-4.1"),
        messages: [...history],
        system: systemPrompt,
        maxSteps: 10,
        tools: {
          get_active_guild: tool({
            description: "Get the active guild",
            parameters: z.object({}),
            execute: async () => {
              if (guildId) {
                const guild = await getGuild({ guildId });
                return guild;
              }
              const activeGuild = await getActiveGuild({ userId });

              if (!activeGuild) {
                return {
                  error:
                    "No active guild found. Please set an active guild using the set_active_guild tool.",
                };
              }

              return activeGuild;
            },
          }),
          set_active_guild: tool({
            description: "Set the active guild",
            parameters: z.object({
              guild_id: z.string(),
            }),
            execute: async (input) => {
              const guild = await setActiveGuild({
                guildId: input.guild_id,
                userId,
              });
              return { guild_id: guild.id };
            },
          }),
          view_guilds: tool({
            description: "View the guilds that the user has access to",
            parameters: z.object({}),
            execute: async () => {
              const guilds = await this.discordService.getGuilds({
                userId,
              });

              console.log("DISCORD GUILDS", guilds);
              return guilds;
            },
          }),
          create_question: tool({
            description: "Create a new survey question",
            parameters: z.object({
              question: z.string(),
              question_bank_id: z.string(),
              guild_id: z.string(),
            }),
            execute: async (input) => {
              const existingQuestions = await getQuestions({
                bankId: input.question_bank_id,
                guildId: input.guild_id,
              });
              const guild = await getGuild({ guildId: input.guild_id });
              if (existingQuestions.length >= guild.question_limit) {
                return {
                  error: `Your plan can only have up to ${guild.question_limit} questions per question bank`,
                };
              }

              const question = await createQuestion({
                content: input.question,
                bank_id: input.question_bank_id,
                guild_id: input.guild_id,
                created_at: new Date(),
              });
              return question;
            },
          }),
          view_question_banks: tool({
            description: "View the user's question banks",
            parameters: z.object({
              guild_id: z.string(),
            }),
            execute: async (input) => {
              const questionBanks = await getQuestionBanks({
                guildId: input.guild_id,
              });
              return questionBanks;
            },
          }),
          create_question_bank: tool({
            description:
              "Create a new question bank. If a question bank with this name already exists, you can use the force parameter to create it anyway.",
            parameters: z.object({
              name: z.string(),
              force: z.boolean().default(false),
              guild_id: z.string(),
            }),
            execute: async (input) => {
              const guild = await getGuild({ guildId: input.guild_id });

              const existingQuestionBanks = await getQuestionBanks({
                guildId: input.guild_id,
              });
              if (
                existingQuestionBanks.some(
                  (bank) => bank.name === input.name && !input.force
                )
              ) {
                return {
                  warning: "A question bank with this name already exists",
                };
              }

              if (existingQuestionBanks.length >= guild.question_bank_limit) {
                return {
                  error: `You have reached the limit of ${guild.question_bank_limit} question banks. You can upgrade your plan to increase the limit.`,
                };
              }

              const questionBank = await createQuestionBank({
                name: input.name,
                guild_id: input.guild_id,
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
              guild_id: z.string(),
            }),
            execute: async (input) => {
              const questions = await getQuestions({
                bankId: input.question_bank_id,
                guildId: input.guild_id,
              });
              return questions;
            },
          }),
          edit_question: tool({
            description: "Edit an existing question in a question bank",
            parameters: z.object({
              question_bank_id: z.string(),
              question_id: z.string(),
              question: z.string(),
              guild_id: z.string(),
            }),
            execute: async (input) => {
              const question = await updateQuestion({
                id: input.question_id,
                content: input.question,
                bank_id: input.question_bank_id,
                guild_id: input.guild_id,
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
              guild_id: z.string(),
            }),
            execute: async (input) => {
              const question = await deleteQuestion({
                questionId: input.question_id,
                guildId: input.guild_id,
              });
              return question;
            },
          }),
          delete_question_bank: tool({
            description: "Delete an existing question bank",
            parameters: z.object({
              question_bank_id: z.string(),
              guild_id: z.string(),
            }),
            execute: async (input) => {
              const questionBank = await deleteQuestionBank({
                questionBankId: input.question_bank_id,
                guildId: input.guild_id,
              });
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
