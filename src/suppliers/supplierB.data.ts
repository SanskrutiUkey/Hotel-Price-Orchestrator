import { SupplierHotel } from "../types/hotel";

export const supplierBHotels: SupplierHotel[] = [
  { hotelId: "b1", name: "Holtin", price: 5340, city: "delhi", commissionPct: 20 },
  { hotelId: "b2", name: "Radison", price: 6200, city: "delhi", commissionPct: 18 },
  { hotelId: "b3", name: "Taj Palace", price: 11500, city: "delhi", commissionPct: 16 },
  { hotelId: "b4", name: "Sofitel", price: 8900, city: "delhi", commissionPct: 14 },
  { hotelId: "b5", name: "Novotel", price: 5600, city: "delhi", commissionPct: 12 },
  { hotelId: "b6", name: "Oberoi", price: 10200, city: "delhi", commissionPct: 13 },
  { hotelId: "b7", name: "Leela", price: 7800, city: "delhi", commissionPct: 15 },
  { hotelId: "b8", name: "Park Hyatt", price: 9800, city: "mumbai", commissionPct: 11 },
  { hotelId: "b9", name: "JW Marriott", price: 8400, city: "delhi", commissionPct: 17 },
  { hotelId: "b10", name: "Vivanta", price: 5100, city: "mumbai", commissionPct: 10 },
];

export function getSupplierBByCity(city: string, simulateDown = false): Promise<SupplierHotel[]> {
  if (simulateDown) {
    return Promise.reject(new Error("Supplier B is currently unavailable"));
  }
  const delay = 100 + Math.random() * 200;
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = supplierBHotels.filter(
        (h) => h.city.toLowerCase() === city.toLowerCase()
      );
      resolve(filtered);
    }, delay);
  });
}
