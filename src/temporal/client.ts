import { Client, Connection } from "@temporalio/client";
import { config } from "../config";
import { logger } from "../logger";

let client: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (!client) {
    const connection = await Connection.connect({
      address: config.temporal.address,
    });
    client = new Client({
      connection,
      namespace: "default",
    });
    logger.info({ address: config.temporal.address }, "Temporal client connected");
  }
  return client;
}
