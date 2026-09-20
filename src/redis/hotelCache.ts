import { getRedisClient } from "./client";
import { Hotel } from "../types/hotel";
import { config } from "../config";
import { logger } from "../logger";

function indexKey(city: string): string {
  return `hotels:${city.toLowerCase()}:index`;
}

function dataKey(city: string, name: string): string {
  return `hotels:${city.toLowerCase()}:data:${name}`;
}

export async function cacheHotels(city: string, hotels: Hotel[]): Promise<void> {
  const client = getRedisClient();
  const cKey = indexKey(city);
  const ttl = config.cache.ttlSeconds;

  const pipeline = client.pipeline();
  pipeline.del(cKey);

  for (const hotel of hotels) {
    pipeline.zadd(cKey, hotel.price, hotel.name);
    pipeline.set(dataKey(city, hotel.name), JSON.stringify(hotel), "EX", ttl);
  }

  pipeline.expire(cKey, ttl);
  await pipeline.exec();
  logger.info({ city, count: hotels.length }, "Cached hotel results");
}

export async function getHotelsFromCache(
  city: string,
  minPrice?: number,
  maxPrice?: number
): Promise<Hotel[] | null> {
  const client = getRedisClient();
  const cKey = indexKey(city);

  const exists = await client.exists(cKey);
  if (!exists) {
    logger.info({ city }, "Cache miss");
    return null;
  }

  logger.info({ city }, "Cache hit");

  const min = minPrice ?? "-inf";
  const max = maxPrice ?? "+inf";

  const names = await client.zrangebyscore(cKey, String(min), String(max));
  if (names.length === 0) {
    return [];
  }

  const pipeline = client.pipeline();
  for (const name of names) {
    pipeline.get(dataKey(city, name));
  }
  const results = await pipeline.exec();
  if (!results) return [];

  const hotels: Hotel[] = [];
  for (const [err, value] of results) {
    if (!err && value) {
      hotels.push(JSON.parse(value as string));
    }
  }

  return hotels;
}

export async function isCachePresent(city: string): Promise<boolean> {
  const client = getRedisClient();
  return (await client.exists(indexKey(city))) === 1;
}
