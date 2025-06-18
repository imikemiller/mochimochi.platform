import { ChannelType, Client, Events, GatewayIntentBits } from "discord.js";
import { DiscordService } from "../lib/discord";
import { OpenAIService } from "../lib/openai";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessageReactions,
  ],
});

export const discordService = new DiscordService(client);
export const openAIService = new OpenAIService();

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
});

client.on(Events.MessageCreate, async (message) => {
  console.log(
    `Message received: "${message.content}" from ${message.author.tag} in ${
      message.channel.type === ChannelType.DM
        ? "DM"
        : `#${(message.channel as any).name}`
    }`
  );

  // Ignore bot messages
  if (message.author.bot) {
    console.log("Ignoring bot message");
    return;
  }

  // Handle DMs
  if (message.channel.type === ChannelType.DM) {
    console.log("DM received:", message.content);
    try {
      await message.reply("I received your DM!");
    } catch (error) {
      console.error("Failed to reply to DM:", error);
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
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}
