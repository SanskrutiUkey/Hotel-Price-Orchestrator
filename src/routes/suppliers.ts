import { Router, Request, Response } from "express";
import { getSupplierAByCity } from "../suppliers/supplierA.data";
import { getSupplierBByCity } from "../suppliers/supplierB.data";

const router = Router();

router.get("/supplierA/hotels", async (req: Request, res: Response) => {
  try {
    const city = (req.query.city as string) || "";
    const simulateDown = req.query.simulateDown === "true";
    const hotels = await getSupplierAByCity(city, simulateDown);
    res.json(hotels);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Supplier A unavailable" });
  }
});

router.get("/supplierB/hotels", async (req: Request, res: Response) => {
  try {
    const city = (req.query.city as string) || "";
    const simulateDown = req.query.simulateDown === "true";
    const hotels = await getSupplierBByCity(city, simulateDown);
    res.json(hotels);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Supplier B unavailable" });
  }
});

export default router;
