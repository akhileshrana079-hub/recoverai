const RecoveryLog = require("../models/RecoveryLog");

const getRecoveryLogs = async (req, res) => {
  try {
    const { transactionId, limit = 100 } = req.query;

    const query = {};

    if (transactionId) {
      query.transactionId = transactionId;
    }

    const logs = await RecoveryLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(
      "Recovery logs fetch error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recovery logs",
      error: error.message,
    });
  }
};

module.exports = {
  getRecoveryLogs,
};