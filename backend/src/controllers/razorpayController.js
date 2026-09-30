const Transaction = require("../models/Transaction");

const {
  createOrder,
} = require("../services/razorpayService");

const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency, transactionId } = req.body;

    if (!amount || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "amount and transactionId are required",
      });
    }

    const transaction = await Transaction.findOne({
      transactionId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    const order = await createOrder({
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: transactionId,
    });

    // Store Razorpay order ID so future webhooks
    // can be mapped to the correct transaction.
    transaction.razorpayOrderId = order.id;

    await transaction.save();

    res.status(201).json({
      success: true,
      data: {
        transactionId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.error?.description || error.message,
    });
  }
};

module.exports = {
  createRazorpayOrder,
};