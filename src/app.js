require("dotenv").config();

const express = require("express");
const app = express();

const authRoutes = require("./routes/auth");

const kycRoutes = require("./routes/kyc");

const adminRoutes = require("./routes/admin");


const webhooksRoutes = require("./routes/webhooks");

const ordersRoutes = require("./routes/orders");
const rateLimit = require("express-rate-limit");


app.use(express.json());

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/auth", authRoutes);
app.use("/kyc", kycRoutes);
app.use("/admin", adminRoutes);
app.use("/webhooks", webhookLimiter, webhooksRoutes);
app.use("/orders", ordersRoutes);
app.get("/", (req, res) => {
  res.send("Wisdom's Order Fellow API running");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
