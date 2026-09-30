const {
  evaluateRecoveryBatch,
} = require("../services/recoveryEvaluationService");

const getRecoveryEvaluation = async (req, res) => {
  try {
    const evaluation =
      await evaluateRecoveryBatch();

    return res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error(
      "Recovery evaluation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to evaluate recovery batch",
      error: error.message,
    });
  }
};

module.exports = {
  getRecoveryEvaluation,
};