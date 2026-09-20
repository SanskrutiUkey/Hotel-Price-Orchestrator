import { NativeConnection, Worker } from "@temporalio/worker";
import { config } from "../config";
import { logger } from "../logger";
import * as activities from "./activities";

async function run() {
  const connection = await NativeConnection.connect({
    address: config.temporal.address,
  });

  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve("./workflows/hotelAggregation.workflow"),
    activities,
    taskQueue: config.temporal.taskQueue,
  });

  logger.info(
    { taskQueue: config.temporal.taskQueue, address: config.temporal.address },
    "Temporal worker starting"
  );

  await worker.run();
}

run().catch((err) => {
  logger.error({ err }, "Temporal worker failed");
  process.exit(1);
});
