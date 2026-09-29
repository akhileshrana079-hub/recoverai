const Transaction = require("../models/Transaction");

const analyzeTransaction = async (transactionId) => {
  const transaction = await Transaction.findOne({ transactionId });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (transaction.status !== "failed") {
    return {
      transactionId: transaction.transactionId,
      recoveryProbability: 0,
      recommendedAction: "NO_ACTION",
      reason: "Transaction is not failed",
      requiresHumanApproval: false,
    };
  }

  let score = 0.5;
  const reasons = [];

  // Failure reason
  if (transaction.failureReason === "BANK_DECLINED") {
    score += 0.2;
    reasons.push("Bank decline may be temporary");
  }

  if (transaction.failureReason === "INSUFFICIENT_FUNDS") {
    score -= 0.1;
    reasons.push("Insufficient funds reduce recovery likelihood");
  }

  if (transaction.failureReason === "CARD_EXPIRED") {
    score -= 0.25;
    reasons.push("Expired card requires customer action");
  }

  // Retry count
  if (transaction.retryCount === 0) {
    score += 0.1;
    reasons.push("No previous retry attempt");
  }

  if (transaction.retryCount >= 3) {
    score -= 0.3;
    reasons.push("Multiple previous retry attempts");
  }

  // Amount-based human approval
  const requiresHumanApproval = transaction.amount >= 50000;

  if (requiresHumanApproval) {
    reasons.push("High-value transaction requires human approval");
  }

  // Keep probability between 0 and 1
  score = Math.max(0, Math.min(score, 1));

  let recommendedAction;

  if (score >= 0.7 && transaction.retryCount < 3) {
    recommendedAction = "RETRY_PAYMENT";
  } else if (score >= 0.45) {
    recommendedAction = "SEND_REMINDER";
  } else if (requiresHumanApproval) {
    recommendedAction = "ESCALATE";
  } else {
    recommendedAction = "STOP";
  }

  return {
    transactionId: transaction.transactionId,
    amount: transaction.amount,
    recoveryProbability: Number(score.toFixed(2)),
    recommendedAction,
    reason: reasons.join(". "),
    requiresHumanApproval,
  };
};

module.exports = {
  analyzeTransaction,
};