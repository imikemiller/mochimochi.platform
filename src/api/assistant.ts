import { FastifyInstance } from "fastify";
import { z } from "zod";

// Schema for the assistant request
const assistantRequestSchema = z.object({
  serverId: z.string(),
  message: z.string(),
  tool: z.enum([
    "create_question_bank",
    "list_question_banks",
    "edit_questions",
    "configure_limits",
    "start_research_session",
    "aggregate_responses",
  ]),
  parameters: z.record(z.unknown()),
});

export async function assistantRoutes(fastify: FastifyInstance) {
  fastify.post("/", async (request, reply) => {
    try {
      const data = assistantRequestSchema.parse(request.body);

      // TODO: Implement tool handling logic
      // This will be implemented when we add the OpenAI integration

      return {
        status: "success",
        message: "Tool call received",
        data,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        status: "error",
        message: "Invalid request data",
      });
    }
  });
}
