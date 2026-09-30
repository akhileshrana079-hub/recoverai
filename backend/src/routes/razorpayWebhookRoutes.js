const express = require("express");

const router = express.Router();

const {
  handleRazorpayWebhook,
} = require("../controllers/razorpayWebhookController");

router.post("/", handleRazorpayWebhook);

module.exports = router;