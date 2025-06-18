import Fastify from "fastify";
import { startBot } from "./bot";
import { assistantRoutes } from "./api/assistant";
import { analyticsRoutes } from "./api/analytics";

const app = Fastify({
  logger: true,
});

// Register routes
app.register(assistantRoutes, { prefix: "/api/assistant" });
app.register(analyticsRoutes, { prefix: "/api/analytics" });

// Health check
app.get("/health", async () => {
  return { status: "ok" };
});

export async function startServer() {
  try {
    // Start the Discord bot
    await startBot();

    // Start the Fastify server
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: "0.0.0.0",
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
