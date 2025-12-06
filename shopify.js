import express from "express";
import shopify from "../shopify/fetch.js";

const router = express.Router();

// Get Products
router.get("/products", async (req, res) => {
  try {
    const response = await shopify.get("products.json");
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get Customers
router.get("/customers", async (req, res) => {
  try {
    const response = await shopify.get("customers.json");
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Get Orders
router.get("/orders", async (req, res) => {
  try {
    const response = await shopify.get("orders.json?status=any");
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;
