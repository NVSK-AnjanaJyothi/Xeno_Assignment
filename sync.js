// src/shopify/sync.js
import axios from "axios";
import prisma from "../utils/prisma.js";

// -------------------------------
// FETCH CUSTOMERS
// -------------------------------
async function syncCustomers(shop, token, tenantId) {
  const url = `https://${shop}/admin/api/2024-01/customers.json`;

  const res = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });

  const customers = res.data.customers;

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { shopifyId: String(c.id) },
      update: {
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        totalSpend: parseFloat(c.total_spent || 0),
        tenantId,
      },
      create: {
        shopifyId: String(c.id),
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        totalSpend: parseFloat(c.total_spent || 0),
        tenantId,
      },
    });
  }

  return customers.length;
}

// -------------------------------
// FETCH PRODUCTS
// -------------------------------
async function syncProducts(shop, token, tenantId) {
  const url = `https://${shop}/admin/api/2024-01/products.json`;

  const res = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });

  const products = res.data.products;

  for (const p of products) {
    await prisma.product.upsert({
      where: { shopifyId: String(p.id) },
      update: {
        title: p.title,
        price: parseFloat(p.variants?.[0]?.price || 0),
        tenantId,
      },
      create: {
        shopifyId: String(p.id),
        title: p.title,
        price: parseFloat(p.variants?.[0]?.price || 0),
        tenantId,
      },
    });
  }

  return products.length;
}

// -------------------------------
// FETCH ORDERS
// -------------------------------
async function syncOrders(shop, token, tenantId) {
  const url = `https://${shop}/admin/api/2024-01/orders.json?status=any`;

  const res = await axios.get(url, {
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });

  const orders = res.data.orders;

  for (const o of orders) {
    await prisma.order.upsert({
      where: { shopifyId: String(o.id) },
      update: {
        totalPrice: parseFloat(o.total_price || 0),
        currency: o.currency,
        createdAtShop: new Date(o.created_at),
        lineItems: o.line_items,
        tenantId,
        customerId: o.customer ? String(o.customer.id) : null,
      },
      create: {
        shopifyId: String(o.id),
        totalPrice: parseFloat(o.total_price || 0),
        currency: o.currency,
        createdAtShop: new Date(o.created_at),
        lineItems: o.line_items,
        tenantId,
        customerId: o.customer ? String(o.customer.id) : null,
      },
    });
  }

  return orders.length;
}

// -------------------------------
// MAIN SYNC FUNCTION
// -------------------------------
export async function startSync(tenantId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant || !tenant.shopifyShop || !tenant.shopifyToken) {
    throw new Error("Tenant missing Shopify credentials");
  }

  const shop = tenant.shopifyShop;
  const token = tenant.shopifyToken;

  console.log("🔄 Starting Shopify sync for tenant:", tenantId);

  const customers = await syncCustomers(shop, token, tenantId);
  const products = await syncProducts(shop, token, tenantId);
  const orders = await syncOrders(shop, token, tenantId);

  return {
    customersSynced: customers,
    productsSynced: products,
    ordersSynced: orders,
  };
}
