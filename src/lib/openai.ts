import OpenAI from "openai";
import type { Question } from "../types";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  // Generate questions based on game developer goals
  async generateQuestions(
    goals: string,
    count: number = 5
  ): Promise<Omit<Question, "id" | "bankId" | "createdAt">[]> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a game research expert. Generate clear, focused questions that will help game developers gather valuable feedback.",
        },
        {
          role: "user",
          content: `Generate ${count} research questions based on these goals: ${goals}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    // Parse the response into questions
    const questions = completion.choices[0].message.content
      ?.split("\n")
      .filter((line) => line.trim().length > 0)
      .map((content) => ({
        content: content.replace(/^\d+\.\s*/, "").trim(),
        category: "general",
      }));

    return questions || [];
  }

  // Analyze user response for sentiment and key points
  async analyzeResponse(response: string): Promise<{
    sentiment: "positive" | "neutral" | "negative";
    keyPoints: string[];
  }> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Analyze the user's response for sentiment and extract key points.",
        },
        {
          role: "user",
          content: response,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    // Parse the analysis
    const analysis = completion.choices[0].message.content;
    console.log("analysis", analysis);
    // TODO: Implement proper parsing of the analysis
    return {
      sentiment: "neutral",
      keyPoints: [],
    };
  }
}
