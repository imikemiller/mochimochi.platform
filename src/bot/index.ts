import { ChannelType, Client, Events, GatewayIntentBits } from "discord.js";
import { DiscordService } from "../lib/discord";
import { OpenAIService } from "../lib/openai";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // For guild events
    GatewayIntentBits.GuildMessages, // For messages in guilds
    GatewayIntentBits.DirectMessages, // For DMs
    GatewayIntentBits.MessageContent, // To read message content
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildMembers, // For member info
    GatewayIntentBits.GuildPresences, // For online status
  ],
});

export const discordService = new DiscordService(client);
export const openAIService = new OpenAIService();

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  console.log("messageCreate", message.content, "from", message.author.tag);
  // Ignore bot messages
  if (message.author.bot) return;

  // Handle DMs
  if (message.channel.type === ChannelType.DM) {
    console.log("DM received:", message.content);
  }
});

// Listen for when bot joins a server
client.on(Events.GuildCreate, async (guild) => {
  console.log(
    `Bot added to ${guild.name} (ID: ${guild.id}) owned by ${guild.ownerId}`
  );
});

export async function startBot() {
  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}
