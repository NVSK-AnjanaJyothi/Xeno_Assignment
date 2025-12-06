import prisma from "../utils/prisma.js";

export const createTenant = async (req, res) => {
  try {
    const { name, shop } = req.body;

    if (!name || !shop) {
      return res.status(400).json({
        success: false,
        message: "Name and shop are required",
      });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        shopifyShop: shop,
      },
    });

    res.json({
      success: true,
      tenant,
    });
  } catch (err) {
    console.error("Tenant Create Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
