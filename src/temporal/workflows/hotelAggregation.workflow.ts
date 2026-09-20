import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities";

const {
  fetchSupplierA,
  fetchSupplierB,
  dedupeAndSelectBest,
  cacheHotelResults,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "30 seconds",
  retry: {
    maximumAttempts: 3,
    initialInterval: "1s",
    backoffCoefficient: 2,
    maximumInterval: "10s",
  },
});

export type Hotel = activities.Hotel;
export type SupplierHotel = activities.SupplierHotel;

export async function hotelAggregationWorkflow(city: string): Promise<Hotel[]> {
  let listA: SupplierHotel[] = [];
  let listB: SupplierHotel[] = [];

  const results = await Promise.allSettled([
    fetchSupplierA(city),
    fetchSupplierB(city),
  ]);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      if (i === 0) listA = result.value;
      else listB = result.value;
    } else {
      console.error(`Supplier ${i === 0 ? "A" : "B"} failed: ${result.reason}`);
    }
  }

  const deduped = await dedupeAndSelectBest(listA, listB);
  await cacheHotelResults(city, deduped);
  return deduped;
}
