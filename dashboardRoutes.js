import express from "express";
import prisma from "../utils/prisma.js";

const router = express.Router();

router.get("/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const totalCustomers = await prisma.customer.count({
      where: { tenantId },
    });

    const totalOrders = await prisma.order.count({
      where: { tenantId },
    });

    const revenue = await prisma.order.aggregate({
      where: { tenantId },
      _sum: { totalPrice: true },
    });

    const recentOrders = await prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        customer: true,
      },
    });

    res.json({
      success: true,
      totalCustomers,
      totalOrders,
      totalRevenue: revenue._sum.totalPrice || 0,

      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        totalPrice: order.totalPrice,
        customerName: order.customer?.firstName || "Unknown",
      })),
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
