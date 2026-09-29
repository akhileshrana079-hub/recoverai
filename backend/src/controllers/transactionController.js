const Transaction = require("../models/Transaction");

// Create a transaction
const createTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.create(req.body);

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error.message);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get at-risk transactions
const getAtRiskTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      status: "failed",
      recoveryStatus: {
        $in: ["eligible", "in_progress", "escalated"],
      },
    }).sort({ amount: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Get at-risk transactions error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getAtRiskTransactions,
};