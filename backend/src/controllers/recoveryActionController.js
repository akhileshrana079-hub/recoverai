const {
  executeRecoveryAction,
} = require("../services/recoveryActionService");

const executeAction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const result = await executeRecoveryAction(transactionId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Recovery action error:", error.message);

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  executeAction,
};