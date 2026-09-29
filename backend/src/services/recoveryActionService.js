const Transaction = require("../models/Transaction");
const { createRecoveryLog } = require("./auditLogService");
const { decideRecoveryAction } = require("./recoveryDecisionService");

const executeRecoveryAction = async (transactionId) => {
  const transaction = await Transaction.findOne({ transactionId });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  // Get AI recovery decision
  const decision = await decideRecoveryAction(transactionId);

  // --------------------------------------------------
  // 1. TRANSACTION ALREADY SUCCESSFUL
  // --------------------------------------------------
  if (decision.action === "NO_ACTION") {
    await createRecoveryLog({
      transactionId,
      action: "RECOVERED",
      attemptNumber: transaction.retryCount,
      recoveryProbability: transaction.recoveryProbability,
      result: "NO_ACTION_REQUIRED",
      reason: decision.reason,
    });

    return {
      transactionId,
      action: "NO_ACTION",
      message: decision.reason,
      retryCount: transaction.retryCount,
    };
  }

  // --------------------------------------------------
  // 2. STOP RECOVERY
  // --------------------------------------------------
  if (decision.action === "STOP") {
    transaction.recoveryStatus = "stopped";
    transaction.lastRecoveryAction = "STOP";
    transaction.lastRecoveryActionAt = new Date();

    await transaction.save();

    await createRecoveryLog({
      transactionId,
      action: "STOP",
      attemptNumber: transaction.retryCount,
      recoveryProbability: transaction.recoveryProbability,
      result: "STOPPED",
      reason: decision.reason,
    });

    return {
      transactionId,
      action: "STOP",
      message: decision.reason,
      retryCount: transaction.retryCount,
    };
  }

  // --------------------------------------------------
  // 3. ESCALATE TO HUMAN
  // --------------------------------------------------
  if (decision.action === "ESCALATE") {
    transaction.recoveryStatus = "escalated";
    transaction.lastRecoveryAction = "ESCALATE";
    transaction.lastRecoveryActionAt = new Date();

    await transaction.save();

    await createRecoveryLog({
      transactionId,
      action: "ESCALATE",
      attemptNumber: transaction.retryCount,
      recoveryProbability: transaction.recoveryProbability,
      result: "HUMAN_REVIEW_REQUIRED",
      reason: decision.reason,
    });

    return {
      transactionId,
      action: "ESCALATE",
      message: "Transaction escalated for human review",
      retryCount: transaction.retryCount,
      requiresHumanApproval: true,
    };
  }

  // --------------------------------------------------
  // 4. SEND CUSTOMER REMINDER
  // --------------------------------------------------
  if (decision.action === "SEND_REMINDER") {
    transaction.recoveryStatus = "in_progress";
    transaction.lastRecoveryAction = "SEND_REMINDER";
    transaction.lastRecoveryActionAt = new Date();

    await transaction.save();

    await createRecoveryLog({
      transactionId,
      action: "SEND_REMINDER",
      attemptNumber: transaction.retryCount,
      recoveryProbability: transaction.recoveryProbability,
      result: "REMINDER_INITIATED",
      reason: decision.reason,
    });

    return {
      transactionId,
      action: "SEND_REMINDER",
      message: "Customer payment reminder initiated",
      retryCount: transaction.retryCount,
      requiresHumanApproval: false,
    };
  }

  // --------------------------------------------------
  // 5. RETRY PAYMENT
  // --------------------------------------------------
  if (decision.action === "RETRY_PAYMENT") {
    // Safety check
    if (transaction.retryCount >= 3) {
      transaction.recoveryStatus = "stopped";
      transaction.lastRecoveryAction = "STOP";
      transaction.lastRecoveryActionAt = new Date();

      await transaction.save();

      await createRecoveryLog({
        transactionId,
        action: "STOP",
        attemptNumber: transaction.retryCount,
        recoveryProbability: transaction.recoveryProbability,
        result: "STOPPED",
        reason: "Maximum retry limit reached",
      });

      return {
        transactionId,
        action: "STOP",
        message: "Maximum retry limit reached",
        retryCount: transaction.retryCount,
      };
    }

    transaction.retryCount += 1;
    transaction.recoveryStatus = "in_progress";
    transaction.lastRecoveryAction = "RETRY_PAYMENT";
    transaction.lastRecoveryActionAt = new Date();

    await transaction.save();

    await createRecoveryLog({
      transactionId,
      action: "RETRY_PAYMENT",
      attemptNumber: transaction.retryCount,
      recoveryProbability: transaction.recoveryProbability,
      result: "RETRY_INITIATED",
      reason: decision.reason,
    });

    return {
      transactionId,
      action: "RETRY_PAYMENT",
      message: "Payment retry initiated",
      retryCount: transaction.retryCount,
      confidence: decision.confidence,
      reason: decision.reason,
    };
  }

  throw new Error(`Unsupported recovery action: ${decision.action}`);
};

module.exports = {
  executeRecoveryAction,
};