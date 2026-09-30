const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },

    lastRazorpayPaymentId: {
      type: String,
      default: null,
    },

    lastPaymentErrorCode: {
      type: String,
      default: null,
    },

    lastPaymentErrorDescription: {
      type: String,
      default: null,
    },

    // Razorpay webhook IDs already processed
    processedWebhookIds: {
      type: [String],
      default: [],
    },

    customerId: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    paymentMethod: {
      type: String,
      enum: [
        "UPI",
        "CARD",
        "NETBANKING",
        "WALLET",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "captured",
        "failed",
        "refunded",
        "pending",
      ],
      required: true,
    },

    failureReason: {
      type: String,
      default: null,
    },

    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    recoveryProbability: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },

    recoveryStatus: {
      type: String,
      enum: [
        "not_required",
        "eligible",
        "in_progress",
        "recovered",
        "stopped",
        "escalated",
      ],
      default: "not_required",
    },

    lastRecoveryAction: {
      type: String,
      default: null,
    },

    lastRecoveryActionAt: {
      type: Date,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "Transaction",
    transactionSchema
  );