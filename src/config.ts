import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  temporal: {
    address: process.env.TEMPORAL_ADDRESS || "localhost:7233",
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || "hotel-offer-queue",
  },
  suppliers: {
    baseUrl: process.env.SUPPLIER_BASE_URL || "http://localhost:3000",
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || "300", 10),
  },
};
