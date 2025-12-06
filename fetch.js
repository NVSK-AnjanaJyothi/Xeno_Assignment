import axios from "axios";
import prisma from "../utils/prisma.js";

// Helper to call Shopify API
async function shopifyRequest(shop, token, endpoint) {
  const url = `https://${shop}/admin/api/2024-04/${endpoint}`;

  const res = await axios.get(url, {
    headers: { "X-Shopify-Access-Token": token },
  });

  return res.data;
}

export async function startSync(tenantId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant || !tenant.shopifyToken || !tenant.shopifyShop) {
    throw new Error("Tenant missing Shopify credentials");
  }

  const shop = tenant.shopifyShop;
  const token = tenant.shopifyToken;

  // Fetch customers
  const customers = await shopifyRequest(shop, token, "customers.json");

  // Fetch products
  const products = await shopifyRequest(shop, token, "products.json");

  // Fetch orders
  const orders = await shopifyRequest(shop, token, "orders.json");

  // -------- Save into DB -------- //
  // 🔵 Customers
  for (const c of customers.customers) {
    await prisma.customer.upsert({
      where: { shopifyId: String(c.id) },
      update: {
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        totalSpend: parseFloat(c.total_spent),
      },
      create: {
        tenantId,
        shopifyId: String(c.id),
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        totalSpend: parseFloat(c.total_spent),
      },
    });
  }

  // 🔵 Products
  for (const p of products.products) {
    await prisma.product.upsert({
      where: { shopifyId: String(p.id) },
      update: {
        title: p.title,
        price: parseFloat(p.variants[0].price),
      },
      create: {
        tenantId,
        shopifyId: String(p.id),
        title: p.title,
        price: parseFloat(p.variants[0].price),
      },
    });
  }

  // 🔵 Orders
  for (const o of orders.orders) {
    await prisma.order.upsert({
      where: { shopifyId: String(o.id) },
      update: {
        totalPrice: parseFloat(o.total_price),
        currency: o.currency,
        createdAtShop: new Date(o.created_at),
        lineItems: o.line_items,
      },
      create: {
        tenantId,
        shopifyId: String(o.id),
        customerId: o.customer ? String(o.customer.id) : null,
        totalPrice: parseFloat(o.total_price),
        currency: o.currency,
        createdAtShop: new Date(o.created_at),
        lineItems: o.line_items,
      },
    });
  }

  return {
    customers: customers.customers.length,
    products: products.products.length,
    orders: orders.orders.length,
  };
}
