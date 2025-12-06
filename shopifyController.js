import axios from "axios";
import prisma from "../utils/prisma.js";
import dotenv from "dotenv";

dotenv.config();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SCOPES = "read_customers,read_orders,read_products";
const REDIRECT_URL = process.env.SHOPIFY_REDIRECT_URL;

// STEP 1: Redirect merchant to Shopify OAuth
export const connectShopify = async (req, res) => {
  const shop = req.query.shop;

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${REDIRECT_URL}`;

  return res.redirect(installUrl);
};

// STEP 2: Get Access Token after installation
export const storeToken = async (req, res) => {
  return res.send("Shopify callback working — we will complete in next step.");
};

// STEP 3: Fetch Shopify Data
export const fetchShopifyData = async (req, res) => {
  return res.send("Fetch data working — will implement soon.");
};
