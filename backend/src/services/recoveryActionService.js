const Transaction = require("../models/Transaction");
const { createRecoveryLog } = require("./auditLogService");
const { decideRecoveryAction } = require("./recoveryDecisionService");

/**
 * Execute an already-approved recovery decision.
 *
 * IMPORTANT:
 * The AI recommends an action.
 * The policy engine decides whether that action is allowed.
 * This function only executes the approved action.
 */
const executeApprovedRecoveryAction = async ({
  transactionId,
  policyDecision,
  aiDecision = null,
}) => {
  const transaction = await Transaction.findOne({
    transactionId,
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (!policyDecision) {
    throw new Error(
      "Policy decision is required before executing recovery"
    );
  }

  const action = policyDecision.action;

  // --------------------------------------------------
  // 1. NO ACTION
  // --------------------------------------------------

  if (action === "NO_ACTION") {
    transaction.recoveryStatus = "not_required";
    transaction.lastRecoveryAction = "NO_ACTION";
    transaction.lastRecoveryActionAt = new Date();

    await transaction.save();

    await createRecoveryLog({
      transactionId,
      action: "NO_ACTION",
      attemptNumber: transaction.retryCount,
      recoveryProbability:
        transaction.recoveryProbability,
      result: "NO_ACTION_REQUIRED",
      reason: policyDecision.reason,
    });

    return {
      transactionId,
      action: "NO_ACTION",
      message: policyDecision.reason,
      retryCount: transaction.retryCount,
      requiresHumanApproval: false,
    };
  }

  // --------------------------------------------------
  // 2. POLICY BLOCKED ACTION
  // --------------------------------------------------

  if (policyDecision.allowed === false) {
    transaction.recoveryStatus =
      action === "ESCALATE"
        ? "escalated"
        : "stopped";

    transaction.lastRecoveryAction = action;
    transaction.lastRecoveryActionAt = new Date();

    await transaction.save();

    await createRecoveryLog({
      transactionId,
      action,
      attemptNumber: transaction.retryCount,
      recoveryProbability:
        transaction.recoveryProbability,
      result:
        action === "ESCALATE"
          ? "HUMAN_REVIEW_REQUIRED"
          : "BLOCKED_BY_POLICY",
      reason: policyDecision.reason,
    });

    return {
      transactionId,
      action,
      message: policyDecision.reason,
      retryCount: transaction.retryCount,
      requiresHumanApproval:
        policyDecision.requiresHumanApproval,
      blockedByPolicy: true,
    };
  }

  // --------------------------------------------------
  // 3. STOP
  // --------------------------------------------------

  if (action === "STOP") {
    transaction.recoveryStatus = "stopped";
    transaction.lastRecoveryAction = "STOP";
    transaction.lastRecoveryActionAt = new Date();

    await transaction.save();

    await createRecoveryLog({
      transactionId,
      action: "STOP",
      attemptNumber: transaction.retryCount,
      recoveryProbability:
        transaction.recoveryProbability,
      result: "STOPPED",
      reason: policyDecision.reason,
    });

    return {
      transactionId,
      action: "STOP",
      message: policyDecision.reason,
      retryCount: transaction.retryCount,
      requiresHumanApproval: false,
    };
  }

  // --------------------------------------------------
  // 4. ESCALATE
  // --------------------------------------------------

  if (action === "ESCALATE") {
    transaction.recoveryStatus = "escalated";
    transaction.lastRecoveryAction = "ESCALATE";
    transaction.lastRecoveryActionAt = new Date();

    await transaction.save();

    await createRecoveryLog({
      transactionId,
      action: "ESCALATE",
      attemptNumber: transaction.retryCount,
      recoveryProbability:
        transaction.recoveryProbability,
      result: "HUMAN_REVIEW_REQUIRED",
      reason: policyDecision.reason,
    });

    return {
      transactionId,
      action: "ESCALATE",
      message:
        "Transaction escalated for human review",
      retryCount: transaction.retryCount,
      requiresHumanApproval: true,
    };
  }

  // --------------------------------------------------
  // 5. SEND CUSTOMER REMINDER
  // --------------------------------------------------

  if (action === "SEND_REMINDER") {
    transaction.recoveryStatus = "in_progress";
    transaction.lastRecoveryAction =
      "SEND_REMINDER";
    transaction.lastRecoveryActionAt = new Date();

    await transaction.save();

    await createRecoveryLog({
      transactionId,
      action: "SEND_REMINDER",
      attemptNumber: transaction.retryCount,
      recoveryProbability:
        transaction.recoveryProbability,
      result: "REMINDER_INITIATED",
      reason: policyDecision.reason,
    });

    return {
      transactionId,
      action: "SEND_REMINDER",
      message:
        "Customer payment reminder initiated",
      retryCount: transaction.retryCount,
      requiresHumanApproval: false,
      reason: policyDecision.reason,
    };
  }

  // --------------------------------------------------
  // 6. RETRY PAYMENT
  // --------------------------------------------------

  if (action === "RETRY_PAYMENT") {
    // ----------------------------------------------
    // Final safety check
    // ----------------------------------------------

    if (transaction.retryCount >= 3) {
      transaction.recoveryStatus = "stopped";
      transaction.lastRecoveryAction = "STOP";
      transaction.lastRecoveryActionAt =
        new Date();

      await transaction.save();

      await createRecoveryLog({
        transactionId,
        action: "STOP",
        attemptNumber: transaction.retryCount,
        recoveryProbability:
          transaction.recoveryProbability,
        result: "STOPPED",
        reason:
          "Maximum retry limit reached",
      });

      return {
        transactionId,
        action: "STOP",
        message:
          "Maximum retry limit reached",
        retryCount: transaction.retryCount,
        requiresHumanApproval: false,
      };
    }

    // ----------------------------------------------
    // Increment retry counter
    // ----------------------------------------------

    transaction.retryCount += 1;

    transaction.recoveryStatus =
      "in_progress";

    transaction.lastRecoveryAction =
      "RETRY_PAYMENT";

    transaction.lastRecoveryActionAt =
      new Date();

    await transaction.save();

    // ----------------------------------------------
    // Audit log
    // ----------------------------------------------

    await createRecoveryLog({
      transactionId,
      action: "RETRY_PAYMENT",
      attemptNumber: transaction.retryCount,
      recoveryProbability:
        transaction.recoveryProbability,
      result: "RETRY_INITIATED",
      reason: policyDecision.reason,
    });

    return {
      transactionId,
      action: "RETRY_PAYMENT",
      message:
        "Payment retry initiated",
      retryCount: transaction.retryCount,
      confidence:
        aiDecision?.confidence ??
        transaction.recoveryProbability,
      reason: policyDecision.reason,
      requiresHumanApproval: false,
    };
  }

  // --------------------------------------------------
  // 7. Unsupported action
  // --------------------------------------------------

  throw new Error(
    `Unsupported recovery action: ${action}`
  );
};


/**
 * Legacy/manual recovery execution.
 *
 * This keeps your existing recovery routes working.
 * It uses the existing deterministic decision service.
 */
const executeRecoveryAction = async (
  transactionId
) => {
  const transaction = await Transaction.findOne({
    transactionId,
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const decision =
    await decideRecoveryAction(transactionId);

  const policyDecision = {
    allowed: true,
    action: decision.action,
    requiresHumanApproval:
      decision.requiresHumanApproval || false,
    reason: decision.reason,
  };

  return executeApprovedRecoveryAction({
    transactionId,
    policyDecision,
    aiDecision: decision,
  });
};


module.exports = {
  executeRecoveryAction,
  executeApprovedRecoveryAction,
};