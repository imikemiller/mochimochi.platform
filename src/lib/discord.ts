import Bottleneck from "bottleneck";
import {
  Client,
  Collection,
  Guild,
  Message,
  ThreadChannel,
  User,
} from "discord.js";
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

// Rate limiter for message replies (5 messages per 2 seconds per channel)
const replyLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 2000 / 5, // 5 replies per 2 seconds
});

// Rate limiter for thread creation (5 threads per 10 minutes per channel)
const threadLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 600000 / 5, // 5 threads per 10 minutes
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

  // Reply to a message with rate limiting
  async replyMessage(message: Message, content: string): Promise<Message> {
    return await replyLimiter.schedule(async () => {
      return await message.reply(content);
    });
  }

  // Check if user has DMs enabled
  async canSendDM(userId: UserId): Promise<boolean> {
    try {
      const user = await this.client.users.fetch(userId);
      await user.createDM();
      return true;
    } catch {
      return false;
    }
  }

  // Start typing indicator
  async startTyping(channelId: string): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      // @ts-ignore
      await channel?.sendTyping();
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  }

  // Create a thread with rate limiting
  async createThread(
    message: Message,
    threadName: string
  ): Promise<ThreadChannel> {
    return await threadLimiter.schedule(async () => {
      return await message.startThread({
        name: threadName,
        autoArchiveDuration: 1440,
      });
    });
  }

  async getGuilds({
    userId,
  }: {
    userId: UserId;
  }): Promise<Collection<string, Guild>> {
    return this.client.guilds.cache.filter((guild) =>
      guild.members.cache
        .get(userId)
        ?.permissions.has(["ManageGuild", "Administrator"])
    );
  }
}
