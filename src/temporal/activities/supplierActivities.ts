import { Context } from "@temporalio/activity";
import { SupplierHotel, Hotel } from "../../types/hotel";
import { getSupplierAByCity } from "../../suppliers/supplierA.data";
import { getSupplierBByCity } from "../../suppliers/supplierB.data";
import { cacheHotels } from "../../redis/hotelCache";
import { logger } from "../../logger";

export async function fetchSupplierA(city: string): Promise<SupplierHotel[]> {
  const ctx = Context.current();
  logger.info({ city, attempt: ctx.info.attempt }, "Fetching Supplier A");
  const startTime = Date.now();
  try {
    const hotels = await getSupplierAByCity(city);
    logger.info(
      { city, count: hotels.length, durationMs: Date.now() - startTime },
      "Supplier A response"
    );
    return hotels.map((h) => ({ ...h, supplier: "Supplier A" }));
  } catch (err: any) {
    logger.error({ city, err: err.message, durationMs: Date.now() - startTime }, "Supplier A failed");
    throw err;
  }
}

export async function fetchSupplierB(city: string): Promise<SupplierHotel[]> {
  const ctx = Context.current();
  logger.info({ city, attempt: ctx.info.attempt }, "Fetching Supplier B");
  const startTime = Date.now();
  try {
    const hotels = await getSupplierBByCity(city);
    logger.info(
      { city, count: hotels.length, durationMs: Date.now() - startTime },
      "Supplier B response"
    );
    return hotels.map((h) => ({ ...h, supplier: "Supplier B" }));
  } catch (err: any) {
    logger.error({ city, err: err.message, durationMs: Date.now() - startTime }, "Supplier B failed");
    throw err;
  }
}

export async function dedupeAndSelectBest(
  listA: SupplierHotel[],
  listB: SupplierHotel[]
): Promise<Hotel[]> {
  const hotelMap = new Map<string, Hotel>();
  const normalize = (name: string) => name.trim().toLowerCase();

  for (const hotel of listA) {
    const key = normalize(hotel.name);
    hotelMap.set(key, {
      name: hotel.name,
      price: hotel.price,
      supplier: hotel.supplier || "Supplier A",
      commissionPct: hotel.commissionPct,
    });
  }

  for (const hotel of listB) {
    const key = normalize(hotel.name);
    const existing = hotelMap.get(key);
    if (!existing) {
      hotelMap.set(key, {
        name: hotel.name,
        price: hotel.price,
        supplier: hotel.supplier || "Supplier B",
        commissionPct: hotel.commissionPct,
      });
    } else if (hotel.price < existing.price) {
      hotelMap.set(key, {
        name: hotel.name,
        price: hotel.price,
        supplier: hotel.supplier || "Supplier B",
        commissionPct: hotel.commissionPct,
      });
    }
  }

  const result = Array.from(hotelMap.values());
  logger.info(
    { inputCountA: listA.length, inputCountB: listB.length, outputCount: result.length },
    "Deduplication complete"
  );
  return result;
}

export async function cacheHotelResults(city: string, hotels: Hotel[]): Promise<void> {
  await cacheHotels(city, hotels);
}
