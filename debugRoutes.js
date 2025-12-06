import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Get tenant by shop name (debug route)
router.get("/tenant-by-shop/:shop", async (req, res) => {
  try {
    const { shop } = req.params;

    const tenant = await prisma.tenant.findFirst({
      where: { shopifyShop: shop },
    });

    if (!tenant) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }

    res.json({ success: true, tenant });
  } catch (err) {
    console.error("Debug route error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
