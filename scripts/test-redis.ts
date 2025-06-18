import { Redis } from "ioredis";
import "dotenv/config"; // This will load the .env file

async function testRedisConnection() {
  // Use environment variables from .env
  const redis = new Redis({
    host: process.env.REDIS_HOST || "tramway.proxy.rlwy.net",
    port: parseInt(process.env.REDIS_PORT || "35799"),
    password: process.env.REDIS_PASSWORD,
  });

  try {
    // Test basic operations
    console.log("Testing Redis connection...");

    // Set a test value
    await redis.set("test-key", "Hello from Railway Redis!");
    console.log("✅ Set test value");

    // Get the test value
    const value = await redis.get("test-key");
    console.log("✅ Got test value:", value);

    // Test pub/sub
    const subscriber = redis.duplicate();
    await subscriber.subscribe("test-channel");
    console.log("✅ Subscribed to test channel");

    // Publish a message
    await redis.publish("test-channel", "Test message");
    console.log("✅ Published test message");

    // Clean up
    await redis.del("test-key");
    await subscriber.unsubscribe("test-channel");
    await subscriber.quit();
    await redis.quit();

    console.log("✅ All tests passed! Redis connection is working.");
  } catch (error) {
    console.error("❌ Redis connection test failed:", error);
  }
}

testRedisConnection();
