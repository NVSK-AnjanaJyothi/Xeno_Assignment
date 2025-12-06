import express from "express";
import { startSync } from "../shopify/sync.js";

const router = express.Router();

// Start sync manually
router.get("/sync/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const result = await startSync(tenantId);

    res.json({
      success: true,
      message: "Shopify data synced successfully",
      result,
    });
  } catch (err) {
    console.error("Sync Error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
