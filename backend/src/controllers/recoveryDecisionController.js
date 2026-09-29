const {
  decideRecoveryAction,
} = require("../services/recoveryDecisionService");

const getRecoveryDecision = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const decision = await decideRecoveryAction(transactionId);

    return res.status(200).json({
      success: true,
      data: decision,
    });
  } catch (error) {
    console.error("Recovery decision error:", error);

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getRecoveryDecision,
};