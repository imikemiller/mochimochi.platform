import { Redis } from "ioredis";
import Bottleneck from "bottleneck";
import { Queue, Worker } from "bullmq";

// Redis connection
const redis = new Redis(process.env.REDIS_URL!);

// Rate limiters with Redis
export const globalLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000 / Number(process.env.RATE_LIMIT_GLOBAL),
  datastore: "redis",
  clearDatastore: false,
  clientOptions: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

export const dmLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 60000 / Number(process.env.RATE_LIMIT_DM),
  datastore: "redis",
  clearDatastore: false,
  clientOptions: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

// Question delivery queue
export const questionQueue = new Queue("question-delivery", {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

// Response processing queue
export const responseQueue = new Queue("response-processing", {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

// Question delivery worker
export const questionWorker = new Worker(
  "question-delivery",
  async (job) => {
    // TODO: Implement question delivery logic
    console.log("Processing question delivery job:", job.data);
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
  }
);

// Response processing worker
export const responseWorker = new Worker(
  "response-processing",
  async (job) => {
    // TODO: Implement response processing logic
    console.log("Processing response job:", job.data);
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
  }
);

// Error handling
questionWorker.on("error", (err) => {
  console.error("Question worker error:", err);
});

responseWorker.on("error", (err) => {
  console.error("Response worker error:", err);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await questionWorker.close();
  await responseWorker.close();
  await redis.quit();
});
