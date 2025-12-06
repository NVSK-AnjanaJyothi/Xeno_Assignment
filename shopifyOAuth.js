// src/routes/shopifyOAuth.js
import express from "express";
import crypto from "crypto";
import axios from "axios";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const router = express.Router();

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, APP_BASE_URL, OAUTH_SCOPES, SHOPIFY_API_VERSION } = process.env;
const SCOPES = OAUTH_SCOPES || "read_products,read_customers,read_orders";
const API_VERSION = SHOPIFY_API_VERSION || "2025-01";

/**
 * Step A: Build install URL and redirect merchant to Shopify
 * Client provides ?shop=STORE.myshopify.com and optionally ?tenantId=<your-tenant-id>
 * We send a redirect to Shopify's install URL with state (tenantId) to preserve mapping.
 */
router.get("/install", (req, res) => {
  const { shop, tenantId } = req.query;
  if (!shop) return res.status(400).json({ success: false, error: "Missing shop query param" });

  // generate state to mitigate CSRF and preserve tenantId
  const state = crypto.randomBytes(12).toString("hex");
  // you should store state -> tenantId mapping in DB or in-memory store; for demo we'll include tenantId in state payload.
  // Simpler: attach tenantId as part of state string.
  const statePayload = `${state}|${tenantId || ""}`;

  const redirectUri = `${APP_BASE_URL.replace(/\/$/, "")}/api/shopify/callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${encodeURIComponent(SCOPES)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(statePayload)}&grant_options[]=per-user`;

  // NOTE: For production persist statePayload somewhere (redis/db) and verify on callback. For demo, we verify HMAC and parse state.
  res.redirect(installUrl);
});

/**
 * Step B: OAuth callback - Shopify redirects here with code, hmac, shop, state
 */
router.get("/callback", async (req, res) => {
  try {
    const { shop, hmac, code, state } = req.query;
    if (!shop || !hmac || !code) return res.status(400).send("Missing required params");

    // verify hmac (recommended)
    const map = { ...req.query };
    // remove signature/hmac params before generating our digest
    delete map["hmac"];
    delete map["signature"];
    const message = Object.keys(map).sort().map(k => `${k}=${map[k]}`).join("&");
    const digest = crypto.createHmac("sha256", SHOPIFY_API_SECRET).update(message).digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(hmac, "hex"))) {
      return res.status(400).send("HMAC validation failed");
    }

    // parse state payload
    // our state format: <random>|<tenantId>
    let tenantId = null;
    if (state) {
      const parts = String(state).split("|");
      if (parts.length >= 2) tenantId = parts.slice(1).join("|") || null;
    }

    // Exchange code for access token
    const tokenResp = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code
    });

    const { access_token: accessToken } = tokenResp.data;
    if (!accessToken) return res.status(500).send("Failed to obtain access token");

    // Persist tenant mapping:
    // If tenantId provided -> update that tenant row.
    // Otherwise find/create tenant by shop domain.
    let tenant = null;
    if (tenantId) {
      tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: { shopifyShop: shop, shopifyToken: accessToken }
      }).catch(async (e) => {
        // if tenant not found, create new
        tenant = await prisma.tenant.create({ data: { name: shop, shopifyShop: shop, shopifyToken: accessToken }});
        return tenant;
      });
    } else {
      // find by shop domain
      tenant = await prisma.tenant.findFirst({ where: { shopifyShop: shop }});
      if (tenant) {
        tenant = await prisma.tenant.update({ where: { id: tenant.id }, data: { shopifyToken: accessToken }});
      } else {
        tenant = await prisma.tenant.create({ data: { name: shop, shopifyShop: shop, shopifyToken: accessToken }});
      }
    }

    // (Optional) register webhooks now for this tenant
    await registerWebhooks(shop, accessToken);

    // Redirect to a frontend success page or send JSON
    // If you have a frontend dashboard at /dashboard, you can redirect there
    return res.send(`App installed for ${shop}. Tenant ID: ${tenant.id}`);
  } catch (err) {
    console.error("OAuth callback error:", err.response?.data || err.message || err);
    return res.status(500).send("OAuth callback failed: " + (err.message || ""));
  }
});

/**
 * helper: register a few webhooks for the shop
 */
async function registerWebhooks(shop, token) {
  const url = `https://${shop}/admin/api/${API_VERSION}/webhooks.json`;
  const hooks = [
    { topic: "orders/create", address: `${APP_BASE_URL.replace(/\/$/, "")}/webhooks/shopify`, format: "json" },
    { topic: "customers/create", address: `${APP_BASE_URL.replace(/\/$/, "")}/webhooks/shopify`, format: "json" },
  ];

  for (const hook of hooks) {
    try {
      // check existing hooks (you can skip and just create)
      await axios.post(url, { webhook: hook }, {
        headers: { "X-Shopify-Access-Token": token }
      });
    } catch (e) {
      // ignore already exists or errors
      console.warn("register webhook error", e.response?.data || e.message);
    }
  }
}

export default router;
