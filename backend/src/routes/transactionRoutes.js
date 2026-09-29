const express = require("express");

const {
  createTransaction,
  getTransactions,
  getAtRiskTransactions,
} = require("../controllers/transactionController");

const router = express.Router();

router.post("/", createTransaction);

router.get("/", getTransactions);

router.get("/at-risk", getAtRiskTransactions);

module.exports = router;