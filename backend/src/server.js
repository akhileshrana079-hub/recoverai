require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/database");
const transactionRoutes = require("./routes/transactionRoutes");
const recoveryRoutes = require("./routes/recoveryRoutes");
const razorpayRoutes = require("./routes/razorpayRoutes");
const razorpayWebhookRoutes = require("./routes/razorpayWebhookRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(
  "/api/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhookRoutes
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api/transactions", transactionRoutes);
app.use("/api/recovery", recoveryRoutes);
app.use("/api/razorpay", razorpayRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "RecoverAI backend is running",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`RecoverAI server running on http://localhost:${PORT}`);
});