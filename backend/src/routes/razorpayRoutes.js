const express = require("express");

const router = express.Router();

const {
  createRazorpayOrder,
} = require("../controllers/razorpayController");

router.post("/orders", createRazorpayOrder);

module.exports = router;