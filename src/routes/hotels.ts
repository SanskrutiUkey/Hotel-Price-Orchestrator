import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { getTemporalClient } from "../temporal/client";
import { getHotelsFromCache, isCachePresent } from "../redis/hotelCache";
import { config } from "../config";
import { logger } from "../logger";

const router = Router();

router.get("/api/hotels", async (req: Request, res: Response) => {
  try {
    const city = req.query.city as string;
    if (!city) {
      return res.status(400).json({ error: "city query parameter is required" });
    }

    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return res.status(400).json({ error: "minPrice must be less than or equal to maxPrice" });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const hasCache = await isCachePresent(city);
      if (hasCache) {
        const cached = await getHotelsFromCache(city, minPrice, maxPrice);
        return res.json(cached);
      }
    }

    const client = await getTemporalClient();
    const workflowId = `hotel-agg-${city}-${uuidv4()}`;

    const result = await client.workflow.execute("hotelAggregationWorkflow", {
      args: [city],
      taskQueue: config.temporal.taskQueue,
      workflowId,
    });

    if (minPrice !== undefined || maxPrice !== undefined) {
      const filtered = await getHotelsFromCache(city, minPrice, maxPrice);
      return res.json(filtered);
    }

    res.json(result);
  } catch (err: any) {
    logger.error({ err: err.message }, "Error in /api/hotels");
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
