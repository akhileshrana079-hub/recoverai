const RecoveryLog = require("../models/RecoveryLog");

const createRecoveryLog = async ({
  transactionId,
  action,
  attemptNumber = 0,
  recoveryProbability = null,
  reason = null,
  result = null,
  metadata = {},
}) => {
  const log = await RecoveryLog.create({
    transactionId,
    action,
    attemptNumber,
    recoveryProbability,
    reason,
    result,
    metadata,
  });

  return log;
};

module.exports = {
  createRecoveryLog,
};