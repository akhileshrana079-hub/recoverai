const express = require("express");

const router = express.Router();

const {
  getRecoveryDecision,
} = require("../controllers/recoveryDecisionController");

const {
  executeAction,
} = require("../controllers/recoveryActionController");

// AI recovery decision
router.post(
  "/decision/:transactionId",
  getRecoveryDecision
);

// Execute recovery action
router.post(
  "/execute/:transactionId",
  executeAction
);

module.exports = router;