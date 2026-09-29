const Transaction = require("../models/Transaction");
const { getAIRecoveryDecision } = require("./aiRecoveryService");

const decideRecoveryAction = async (transactionId) => {
  const transaction = await Transaction.findOne({ transactionId });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  // Safety rule 1:
  // Never recover an already successful payment
  if (transaction.status === "captured") {
    return {
      transactionId,
      action: "NO_ACTION",
      confidence: 1,
      reason: "Transaction is already successful",
      requiresHumanApproval: false,
      source: "SAFETY_RULE",
    };
  }

  // Safety rule 2:
  // Never exceed maximum retry limit
  if (transaction.retryCount >= 3) {
    return {
      transactionId,
      action: "STOP",
      confidence: 1,
      reason: "Maximum retry limit has been reached",
      requiresHumanApproval: false,
      source: "SAFETY_RULE",
    };
  }

  // Ask AI for a recovery recommendation
  const aiDecision = await getAIRecoveryDecision(transaction);

  const allowedActions = [
    "RETRY_PAYMENT",
    "SEND_REMINDER",
    "ESCALATE",
    "STOP",
  ];

  // Safety rule 3:
  // Reject invalid AI output
  if (!allowedActions.includes(aiDecision.action)) {
    return {
      transactionId,
      action: "ESCALATE",
      confidence: 0,
      reason: "AI returned an invalid recovery action",
      requiresHumanApproval: true,
      source: "SAFETY_FALLBACK",
    };
  }

  // Safety rule 4:
  // AI cannot retry after maximum attempts
  if (
    aiDecision.action === "RETRY_PAYMENT" &&
    transaction.retryCount >= 3
  ) {
    return {
      transactionId,
      action: "STOP",
      confidence: 1,
      reason: "Retry blocked by maximum retry safety policy",
      requiresHumanApproval: false,
      source: "SAFETY_RULE",
    };
  }

  // Safety rule 5:
  // Low-confidence AI decisions require human review
  const requiresHumanApproval =
    aiDecision.action === "ESCALATE" ||
    aiDecision.confidence < 0.60;

  return {
    transactionId,
    action: aiDecision.action,
    confidence: aiDecision.confidence,
    reason: aiDecision.reason,
    requiresHumanApproval,
    source: "AI",
  };
};

module.exports = {
  decideRecoveryAction,
};