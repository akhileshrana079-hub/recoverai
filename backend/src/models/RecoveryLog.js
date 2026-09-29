const mongoose = require("mongoose");

const recoveryLogSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "ANALYZE",
        "RETRY_PAYMENT",
        "SEND_REMINDER",
        "ESCALATE",
        "STOP",
        "RECOVERED",
      ],
    },

    attemptNumber: {
      type: Number,
      default: 0,
    },

    recoveryProbability: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    reason: {
      type: String,
      default: null,
    },

    result: {
      type: String,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RecoveryLog", recoveryLogSchema);