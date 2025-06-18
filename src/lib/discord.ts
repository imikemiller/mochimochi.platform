import {
  Client,
  Events,
  GatewayIntentBits,
  Guild,
  User,
  TextChannel,
} from "discord.js";
import Bottleneck from "bottleneck";
import type { UserId } from "../types";

// Rate limiters
const globalLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000 / 50, // 50 requests per second
});

const dmLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 60000 / 5, // 5 DMs per minute
});

export class DiscordService {
  constructor(private client: Client) {}

  // Get random online users from a server
  async getRandomOnlineUsers(guild: Guild, count: number = 1): Promise<User[]> {
    const members = await guild.members.fetch();
    const onlineMembers = members.filter(
      (member) => member.presence?.status === "online" && !member.user.bot
    );

    const randomMembers = onlineMembers
      .random(count)
      .map((member) => member.user);

    console.log("globalLimiter", globalLimiter);

    console.log("randomMembers", randomMembers);
    console.log("onlineMembers", onlineMembers);
    console.log("members", members);
    console.log("guild", guild);

    return randomMembers;
  }

  // Send DM with rate limiting
  async sendDM(userId: UserId, content: string): Promise<void> {
    await dmLimiter.schedule(async () => {
      const user = await this.client.users.fetch(userId);
      await user.send(content);
    });
  }

  // Check if user has DMs enabled
  async canSendDM(userId: UserId): Promise<boolean> {
    try {
      const user = await this.client.users.fetch(userId);
      const dmChannel = await user.createDM();
      return true;
    } catch {
      return false;
    }
  }

  // Start typing indicator
  async startTyping(channelId: string): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel instanceof TextChannel) {
        await channel.sendTyping();
      }
    } catch (error) {
      console.error("Error starting typing indicator:", error);
    }
  }

  // Stop typing indicator (no-op as Discord handles this automatically)
  async stopTyping(channelId: string): Promise<void> {
    // Discord automatically stops the typing indicator after a few seconds
    // or when a message is sent
  }
}
