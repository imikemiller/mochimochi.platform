import { ChannelType, Client, GatewayIntentBits } from "discord.js";
import { DiscordService } from "../lib/discord";
import { OpenAIService } from "../lib/openai";
import { supabase } from "../lib/supabase";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

export const discordService = new DiscordService(client);
export const openAIService = new OpenAIService();

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on("messageCreate", async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Handle DMs
  if (message.channel.type === ChannelType.DM) {
    // TODO: Implement DM handling
    const user = await supabase
      .from("users")
      .select("*")
      .eq("discord_id", message.author.id);
    console.log("user", user);
  }
});

export async function startBot() {
  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}
