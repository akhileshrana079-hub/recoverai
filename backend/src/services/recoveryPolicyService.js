const evaluateRecoveryPolicy = ({
  transaction,
  aiDecision,
}) => {
  const failureReason = (
    transaction.failureReason ||
    transaction.lastPaymentErrorDescription ||
    ""
  ).toUpperCase();

  const action = aiDecision?.action;

  // ---------------------------------------------
  // Rule 1: Already captured
  // ---------------------------------------------

  if (transaction.status === "captured") {
    return {
      allowed: false,
      action: "NO_ACTION",
      requiresHumanApproval: false,
      reason:
        "Transaction is already captured.",
    };
  }

  // ---------------------------------------------
  // Rule 2: Maximum retry limit
  // ---------------------------------------------

  if (transaction.retryCount >= 3) {
    return {
      allowed: false,
      action: "STOP",
      requiresHumanApproval: false,
      reason:
        "Maximum retry limit of 3 has been reached.",
    };
  }

  // ---------------------------------------------
  // Rule 3: Risk / fraud protection
  // ---------------------------------------------

  const riskyFailureReasons = [
    "FRAUD",
    "FRAUD_SUSPECTED",
    "SUSPICIOUS",
    "RISK",
    "RISKY",
    "DO_NOT_HONOR",
    "ACCOUNT_BLOCKED",
  ];

  const isRiskyFailure =
    riskyFailureReasons.some(
      (keyword) =>
        failureReason.includes(keyword)
    );

  if (isRiskyFailure) {
    return {
      allowed: false,
      action: "ESCALATE",
      requiresHumanApproval: true,
      reason:
        "Risk-related payment failure detected. Automatic recovery is blocked.",
    };
  }

  // ---------------------------------------------
  // Rule 4: Validate AI action
  // ---------------------------------------------

  const allowedActions = [
    "RETRY_PAYMENT",
    "SEND_REMINDER",
    "ESCALATE",
    "STOP",
  ];

  if (!allowedActions.includes(action)) {
    return {
      allowed: false,
      action: "ESCALATE",
      requiresHumanApproval: true,
      reason:
        "AI returned an unsupported recovery action.",
    };
  }

  // ---------------------------------------------
  // Rule 5: AI says STOP
  // ---------------------------------------------

  if (action === "STOP") {
    return {
      allowed: true,
      action: "STOP",
      requiresHumanApproval: false,
      reason:
        aiDecision.reason ||
        "AI determined that recovery should stop.",
    };
  }

  // ---------------------------------------------
  // Rule 6: AI says ESCALATE
  // ---------------------------------------------

  if (action === "ESCALATE") {
    return {
      allowed: true,
      action: "ESCALATE",
      requiresHumanApproval: true,
      reason:
        aiDecision.reason ||
        "Human review required.",
    };
  }

  // ---------------------------------------------
  // Rule 7: AI says SEND_REMINDER
  // ---------------------------------------------

  if (action === "SEND_REMINDER") {
    return {
      allowed: true,
      action: "SEND_REMINDER",
      requiresHumanApproval: false,
      reason:
        aiDecision.reason ||
        "Customer reminder recommended.",
    };
  }

  // ---------------------------------------------
  // Rule 8: AI says RETRY_PAYMENT
  // ---------------------------------------------

  if (action === "RETRY_PAYMENT") {
    if (transaction.retryCount >= 3) {
      return {
        allowed: false,
        action: "STOP",
        requiresHumanApproval: false,
        reason:
          "Retry limit prevents another payment attempt.",
      };
    }

    return {
      allowed: true,
      action: "RETRY_PAYMENT",
      requiresHumanApproval: false,
      reason:
        aiDecision.reason ||
        "Payment retry is allowed.",
    };
  }

  // ---------------------------------------------
  // Fallback: fail closed
  // ---------------------------------------------

  return {
    allowed: false,
    action: "ESCALATE",
    requiresHumanApproval: true,
    reason:
      "Policy engine failed closed.",
  };
};

module.exports = {
  evaluateRecoveryPolicy,
};