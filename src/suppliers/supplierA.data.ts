import { SupplierHotel } from "../types/hotel";

export const supplierAHotels: SupplierHotel[] = [
  { hotelId: "a1", name: "Holtin", price: 6000, city: "delhi", commissionPct: 10 },
  { hotelId: "a2", name: "Radison", price: 5900, city: "delhi", commissionPct: 13 },
  { hotelId: "a3", name: "Taj Palace", price: 12000, city: "delhi", commissionPct: 15 },
  { hotelId: "a4", name: "Oberoi", price: 9500, city: "delhi", commissionPct: 12 },
  { hotelId: "a5", name: "Leela", price: 8700, city: "delhi", commissionPct: 11 },
  { hotelId: "a6", name: "ITC Maurya", price: 11000, city: "delhi", commissionPct: 14 },
  { hotelId: "a7", name: "Surya", price: 4200, city: "mumbai", commissionPct: 9 },
  { hotelId: "a8", name: "Grand Hyatt", price: 7800, city: "delhi", commissionPct: 10 },
  { hotelId: "a9", name: "Lalit", price: 6500, city: "delhi", commissionPct: 8 },
  { hotelId: "a10", name: "Jaypee", price: 7200, city: "mumbai", commissionPct: 11 },
];

export function getSupplierAByCity(city: string, simulateDown = false): Promise<SupplierHotel[]> {
  if (simulateDown) {
    return Promise.reject(new Error("Supplier A is currently unavailable"));
  }
  const delay = 100 + Math.random() * 200;
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = supplierAHotels.filter(
        (h) => h.city.toLowerCase() === city.toLowerCase()
      );
      resolve(filtered);
    }, delay);
  });
}
