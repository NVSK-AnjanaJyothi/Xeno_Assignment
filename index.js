import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import shopifyRoutes from "./routes/shopifyRoutes.js";
import shopifyOAuth from "./routes/shopifyOAuth.js";
import debugRoutes from "./routes/debugRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/shopify", shopifyRoutes);
app.use("/api/shopify", shopifyOAuth);
app.use("/api/debug", debugRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/dashboard", dashboardRoutes);




app.get("/", (req, res) => {
  res.send("Server running...");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
