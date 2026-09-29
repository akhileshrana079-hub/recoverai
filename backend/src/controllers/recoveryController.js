const { analyzeTransaction } = require("../services/recoveryService");

const analyzeRecovery = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const analysis = await analyzeTransaction(transactionId);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Recovery analysis error:", error.message);

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  analyzeRecovery,
};