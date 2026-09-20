import Redis from "ioredis";
import { config } from "../config";
import { logger } from "../logger";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });
    redisClient.on("connect", () => logger.info("Redis connected"));
    redisClient.on("error", (err) => logger.error({ err }, "Redis error"));
  }
  return redisClient;
}
