require("dotenv").config();

const express = require("express");
const app = express();

const authRoutes = require("./routes/auth");

const kycRoutes = require("./routes/kyc");

const adminRoutes = require("./routes/admin");


const webhooksRoutes = require("./routes/webhooks");

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/kyc", kycRoutes);
app.use("/admin", adminRoutes);
app.use("/webhooks", webhooksRoutes);
app.get("/", (req, res) => {
  res.send("My Order Fellow API running");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
