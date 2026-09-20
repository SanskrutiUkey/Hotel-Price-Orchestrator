import { Router, Request, Response } from "express";
import { getRedisClient } from "../redis/client";
import { getSupplierAByCity } from "../suppliers/supplierA.data";
import { getSupplierBByCity } from "../suppliers/supplierB.data";
import { logger } from "../logger";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
  const health: Record<string, string> = { status: "ok" };

  try {
    const redis = getRedisClient();
    const result = await redis.ping();
    health.redis = result === "PONG" ? "up" : "down";
  } catch {
    health.redis = "down";
  }

  try {
    health.temporal = "up";
  } catch {
    health.temporal = "down";
  }

  try {
    await getSupplierAByCity("test");
    health.supplierA = "up";
  } catch {
    health.supplierA = "down";
  }

  try {
    await getSupplierBByCity("test");
    health.supplierB = "up";
  } catch {
    health.supplierB = "down";
  }

  const allUp = Object.values(health).every((v) => v === "ok" || v === "up");
  if (!allUp) {
    health.status = "degraded";
  }

  res.json(health);
});

export default router;
