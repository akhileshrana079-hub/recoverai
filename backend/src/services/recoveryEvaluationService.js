const Transaction = require("../models/Transaction");

const evaluateRecoveryBatch = async () => {
  const transactions =
    await Transaction.find({});

  const recoveryTransactions =
    transactions.filter(
      (transaction) =>
        transaction.status === "failed" ||
        transaction.recoveryStatus === "recovered"
    );

  const recoveredTransactions =
    transactions.filter(
      (transaction) =>
        transaction.recoveryStatus === "recovered"
    );

  const totalFailedAmount =
    recoveryTransactions.reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  const recoveredAmount =
    recoveredTransactions.reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  const atRiskAmount = Math.max(
    totalFailedAmount - recoveredAmount,
    0
  );

  const recoveryRate =
    totalFailedAmount > 0
      ? Number(
          (
            (recoveredAmount /
              totalFailedAmount) *
            100
          ).toFixed(2)
        )
      : 0;

  const actionCounts = {
    RETRY_PAYMENT: 0,
    SEND_REMINDER: 0,
    ESCALATE: 0,
    STOP: 0,
    NO_ACTION: 0,
  };

  recoveryTransactions.forEach(
    (transaction) => {
      const action =
        transaction.lastRecoveryAction;

      if (
        actionCounts[action] !== undefined
      ) {
        actionCounts[action] += 1;
      }
    }
  );

  const escalatedCount =
    transactions.filter(
      (transaction) =>
        transaction.recoveryStatus ===
        "escalated"
    ).length;

  const stoppedCount =
    transactions.filter(
      (transaction) =>
        transaction.recoveryStatus ===
        "stopped"
    ).length;

  const inProgressCount =
    transactions.filter(
      (transaction) =>
        transaction.recoveryStatus ===
        "in_progress"
    ).length;

  const recoveredCount =
    recoveredTransactions.length;

  return {
    summary: {
      totalTransactions:
        transactions.length,

      recoveryCohort:
        recoveryTransactions.length,

      recoveredTransactions:
        recoveredCount,

      totalFailedAmount,

      recoveredAmount,

      atRiskAmount,

      recoveryRate,
    },

    actions: actionCounts,

    workflow: {
      inProgress:
        inProgressCount,

      escalated:
        escalatedCount,

      stopped:
        stoppedCount,

      recovered:
        recoveredCount,
    },

    currency: "INR",

    note:
      "Recovered amount reflects transactions actually marked as recovered following a captured payment. AI recommendations and recovery simulations are not counted as recovered revenue.",
  };
};

module.exports = {
  evaluateRecoveryBatch,
};