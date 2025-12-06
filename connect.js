import prisma from "../utils/prisma.js";
import axios from "axios";

export const connectShopify = async (tenantId, shop, token) => {
  if (!tenantId || !shop || !token) {
    throw new Error("Missing shop, token or tenantId");
  }

  // Save Shopify credentials to the tenant
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      shopifyShop: shop,
      shopifyToken: token,
    },
  });

  return tenant;
};
