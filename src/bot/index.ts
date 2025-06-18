import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  Message,
  TextChannel,
} from "discord.js";
import { DiscordService } from "../lib/discord";
import { AssistantService, MessageHistory } from "../lib/assistant";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Channel, // Required for DM channels
    Partials.Message, // For message content
    Partials.Reaction, // For reaction events
    Partials.User, // For user data
    Partials.GuildMember, // For guild member data
  ],
});

export const discordService = new DiscordService(client);
export const assistantService = new AssistantService(discordService);

client.on(Events.Debug, (info) => {
  console.log("Debug:", info);
});

client.on(Events.Error, (error) => {
  console.error("Discord client error:", error);
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  console.log(`Bot is in ${readyClient.guilds.cache.size} guilds`);
  console.log(
    "Available in guilds:",
    readyClient.guilds.cache.map((g) => g.name).join(", ")
  );
  console.log(
    "Enabled intents:",
    Object.keys(client.options.intents).join(", ")
  );
  console.log("Enabled partials:", client.options.partials);
});

client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  console.log(
    `Message received: "${message.content}" from ${message.author.tag} in ${
      message.channel.type === ChannelType.DM
        ? "DM"
        : `#${(message.channel as any).name}`
    }`
  );

  // Handle DMs
  if (message.channel.type === ChannelType.DM) {
    console.log("DM received:", message.content);
    try {
      // Fetch recent message history
      const messages = await message.channel.messages.fetch({ limit: 20 });

      // Convert to MessageHistory format
      const history: MessageHistory[] = messages.map((msg) => ({
        role: msg.author.id === client.user?.id ? "assistant" : "user",
        content: msg.content,
      }));

      const response = await assistantService.handleMessage({
        channelId: message.channel.id,
        history: history.reverse(),
        serverId: message.guild?.id ?? "",
      });

      await message.reply(response);
    } catch (error) {
      console.error("Error handling message:", error);
      await message.reply(
        "Sorry, I encountered an error while processing your message."
      );
    }
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
    console.log(
      "Starting bot with intents:",
      Object.keys(client.options.intents)
    );
    console.log("Starting bot with partials:", client.options.partials);
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}
