import express from "express";
import { config } from "./config";
import { logger } from "./logger";
import hotelRoutes from "./routes/hotels";
import supplierRoutes from "./routes/suppliers";
import healthRoutes from "./routes/health";

const app = express();

app.use(express.json());

app.use(healthRoutes);
app.use(supplierRoutes);
app.use(hotelRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({ err: err.message }, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(config.port, () => {
  logger.info({ port: config.port }, "Server started");
});

export default app;
