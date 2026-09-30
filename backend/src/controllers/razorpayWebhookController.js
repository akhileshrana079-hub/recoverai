const crypto = require("crypto");

const Transaction = require("../models/Transaction");

const {
  getAIRecoveryDecision,
} = require("../services/aiRecoveryService");

const {
  evaluateRecoveryPolicy,
} = require("../services/recoveryPolicyService");

const {
  executeApprovedRecoveryAction,
} = require("../services/recoveryActionService");

const {
  createRecoveryLog,
} = require("../services/auditLogService");

const handleRazorpayWebhook = async (req, res) => {
  try {
    // --------------------------------------------------
    // 1. Get Razorpay webhook signature
    // --------------------------------------------------

    const signature =
      req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay signature",
      });
    }

    // --------------------------------------------------
    // 2. Get webhook secret
    // --------------------------------------------------

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is not configured"
      );

      return res.status(500).json({
        success: false,
        message:
          "Webhook secret is not configured",
      });
    }

    // --------------------------------------------------
    // 3. Verify HMAC signature
    // --------------------------------------------------

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(req.body)
        .digest("hex");

    const signatureBuffer =
      Buffer.from(signature, "utf8");

    const expectedBuffer =
      Buffer.from(expectedSignature, "utf8");

    const isValid =
      signatureBuffer.length ===
        expectedBuffer.length &&
      crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      );

    if (!isValid) {
      console.error(
        "Invalid Razorpay webhook signature"
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid Razorpay webhook signature",
      });
    }

    // --------------------------------------------------
    // 4. Parse webhook
    // --------------------------------------------------

    const event = JSON.parse(
      req.body.toString()
    );

    console.log(
      "Razorpay webhook received:",
      event.event
    );

    // ==================================================
    // 5. HANDLE PAYMENT.CAPTURED
    // ==================================================

    if (event.event === "payment.captured") {
      const payment =
        event.payload?.payment?.entity;

      if (!payment) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment.captured payload",
        });
      }

      console.log(
        "Payment captured:",
        {
          paymentId: payment.id,
          orderId: payment.order_id,
          amount: payment.amount,
          currency: payment.currency,
        }
      );

      // ------------------------------------------------
      // 6. Create webhook ID
      // ------------------------------------------------

      const webhookId =
        event.id ||
        req.headers[
          "x-razorpay-event-id"
        ] ||
        payment.id;

      console.log(
        "Webhook ID:",
        webhookId
      );

      // ------------------------------------------------
      // 7. Find RecoverAI transaction
      // ------------------------------------------------

      const transaction =
        await Transaction.findOne({
          razorpayOrderId:
            payment.order_id,
        });

      if (!transaction) {
        console.log(
          "No RecoverAI transaction found for Razorpay order:",
          payment.order_id
        );

        return res.status(200).json({
          success: true,
          received: true,
          message:
            "Webhook received but transaction not found",
        });
      }

      // ------------------------------------------------
      // 8. Idempotency check
      // ------------------------------------------------

      if (
        transaction.processedWebhookIds.includes(
          webhookId
        )
      ) {
        console.log(
          "Duplicate webhook ignored:",
          webhookId
        );

        return res.status(200).json({
          success: true,
          received: true,
          duplicate: true,
          message:
            "Webhook already processed",
          transactionId:
            transaction.transactionId,
        });
      }

      // ------------------------------------------------
      // 9. Verify payment amount
      // ------------------------------------------------

      const expectedAmount =
        Math.round(
          Number(transaction.amount) * 100
        );

      if (
        Number(payment.amount) !==
        expectedAmount
      ) {
        console.error(
          "Payment amount mismatch:",
          {
            transactionAmount:
              expectedAmount,
            razorpayAmount:
              payment.amount,
            transactionId:
              transaction.transactionId,
          }
        );

        return res.status(400).json({
          success: false,
          message:
            "Payment amount does not match transaction",
        });
      }

      // ------------------------------------------------
      // 10. Mark webhook as processed
      // ------------------------------------------------

      transaction.processedWebhookIds.push(
        webhookId
      );

      // ------------------------------------------------
      // 11. Mark transaction as recovered
      // ------------------------------------------------

      transaction.status = "captured";

      transaction.lastRazorpayPaymentId =
        payment.id;

      transaction.lastPaymentErrorCode =
        null;

      transaction.lastPaymentErrorDescription =
        null;

      transaction.recoveryStatus =
        "recovered";

      transaction.lastRecoveryAction =
        "PAYMENT_CAPTURED";

      transaction.lastRecoveryActionAt =
        new Date();

      await transaction.save();

      console.log(
        "RecoverAI transaction recovered:",
        transaction.transactionId
      );

      // ------------------------------------------------
      // 12. Create recovery audit log
      // ------------------------------------------------

      await createRecoveryLog({
        transactionId:
          transaction.transactionId,

        action: "PAYMENT_CAPTURED",

        attemptNumber:
          transaction.retryCount,

        recoveryProbability:
          transaction.recoveryProbability,

        result: "PAYMENT_RECOVERED",

        reason:
          "Razorpay payment was successfully captured after recovery.",
      });

      console.log(
        "Recovery audit log created:",
        transaction.transactionId
      );

      // ------------------------------------------------
      // 13. Return recovery result
      // ------------------------------------------------

      return res.status(200).json({
        success: true,
        received: true,

        transactionId:
          transaction.transactionId,

        webhookId,

        razorpayPaymentId:
          payment.id,

        razorpayOrderId:
          payment.order_id,

        status: "captured",

        recoveryStatus:
          "recovered",

        recoveredAmount:
          transaction.amount,

        currency:
          transaction.currency,
      });
    }

    // ==================================================
    // 14. HANDLE PAYMENT.FAILED
    // ==================================================

    if (event.event === "payment.failed") {
      const payment =
        event.payload?.payment?.entity;

      if (!payment) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment.failed payload",
        });
      }

      console.log(
        "Payment failed:",
        {
          paymentId: payment.id,
          orderId: payment.order_id,
          amount: payment.amount,
          errorCode:
            payment.error_code,
          errorDescription:
            payment.error_description,
        }
      );

      // ------------------------------------------------
      // 15. Create webhook ID
      // ------------------------------------------------

      const webhookId =
        event.id ||
        req.headers[
          "x-razorpay-event-id"
        ] ||
        payment.id;

      console.log(
        "Webhook ID:",
        webhookId
      );

      // ------------------------------------------------
      // 16. Find RecoverAI transaction
      // ------------------------------------------------

      const transaction =
        await Transaction.findOne({
          razorpayOrderId:
            payment.order_id,
        });

      if (!transaction) {
        console.log(
          "No RecoverAI transaction found for Razorpay order:",
          payment.order_id
        );

        return res.status(200).json({
          success: true,
          received: true,
          message:
            "Webhook received but transaction not found",
        });
      }

      // ------------------------------------------------
      // 17. Idempotency check
      // ------------------------------------------------

      if (
        transaction.processedWebhookIds.includes(
          webhookId
        )
      ) {
        console.log(
          "Duplicate webhook ignored:",
          webhookId
        );

        return res.status(200).json({
          success: true,
          received: true,
          duplicate: true,
          message:
            "Webhook already processed",
          transactionId:
            transaction.transactionId,
        });
      }

      // ------------------------------------------------
      // 18. Mark webhook as processed
      // ------------------------------------------------

      transaction.processedWebhookIds.push(
        webhookId
      );

      await transaction.save();

      console.log(
        "Webhook marked as processed:",
        webhookId
      );

      // ------------------------------------------------
      // 19. Update transaction failure information
      // ------------------------------------------------

      transaction.status = "failed";

      transaction.lastRazorpayPaymentId =
        payment.id;

      transaction.lastPaymentErrorCode =
        payment.error_code || null;

      transaction.lastPaymentErrorDescription =
        payment.error_description ||
        null;

      transaction.failureReason =
        payment.error_description ||
        payment.error_code ||
        "PAYMENT_FAILED";

      transaction.recoveryStatus =
        "eligible";

      await transaction.save();

      console.log(
        "RecoverAI transaction updated:",
        transaction.transactionId
      );

      // ------------------------------------------------
      // 20. Ask AI for recovery decision
      // ------------------------------------------------

      const aiDecision =
        await getAIRecoveryDecision(
          transaction
        );

      console.log(
        "AI recovery decision:",
        aiDecision
      );

      // ------------------------------------------------
      // 21. Store AI confidence
      // ------------------------------------------------

      if (
        typeof aiDecision.confidence ===
        "number"
      ) {
        transaction.recoveryProbability =
          aiDecision.confidence;
      }

      // ------------------------------------------------
      // 22. Apply policy/safety rules
      // ------------------------------------------------

      const policyDecision =
        evaluateRecoveryPolicy({
          transaction,
          aiDecision,
        });

      console.log(
        "Recovery policy decision:",
        policyDecision
      );

      // ------------------------------------------------
      // 23. Store policy decision
      // ------------------------------------------------

      transaction.lastRecoveryAction =
        policyDecision.action;

      transaction.lastRecoveryActionAt =
        new Date();

      if (
        policyDecision.action ===
        "ESCALATE"
      ) {
        transaction.recoveryStatus =
          "escalated";
      } else if (
        policyDecision.action ===
        "STOP"
      ) {
        transaction.recoveryStatus =
          "stopped";
      } else if (
        policyDecision.action ===
          "RETRY_PAYMENT" ||
        policyDecision.action ===
          "SEND_REMINDER"
      ) {
        transaction.recoveryStatus =
          "in_progress";
      }

      await transaction.save();

      // ------------------------------------------------
      // 24. Execute approved recovery action
      // ------------------------------------------------

      const recoveryResult =
        await executeApprovedRecoveryAction({
          transactionId:
            transaction.transactionId,

          policyDecision,

          aiDecision,
        });

      console.log(
        "Recovery action executed:",
        recoveryResult
      );

      // ------------------------------------------------
      // 25. Return complete result
      // ------------------------------------------------

      return res.status(200).json({
        success: true,
        received: true,

        transactionId:
          transaction.transactionId,

        webhookId,

        razorpayPaymentId:
          payment.id,

        razorpayOrderId:
          payment.order_id,

        aiDecision,

        policyDecision,

        recoveryResult,
      });
    }

    // ==================================================
    // 26. OTHER RAZORPAY EVENTS
    // ==================================================

    return res.status(200).json({
      success: true,
      received: true,
      message:
        `Event ${event.event} received`,
    });
  } catch (error) {
    console.error(
      "Razorpay webhook error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Webhook processing failed",
    });
  }
};

module.exports = {
  handleRazorpayWebhook,
};