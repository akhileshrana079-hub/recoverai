const express = require("express");

const router = express.Router();

const {
  getRecoveryEvaluation,
} = require("../controllers/recoveryEvaluationController");

const {
  getRecoveryLogs,
} = require("../controllers/recoveryLogController");

// Recovery evaluation
router.get(
  "/evaluation",
  getRecoveryEvaluation
);

// Recovery audit logs
router.get(
  "/audit-logs",
  getRecoveryLogs
);

module.exports = router;