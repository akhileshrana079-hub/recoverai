const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const getAIRecoveryDecision = async (transaction) => {
  const prompt = `
You are an AI payment recovery decision engine.

Analyze the failed payment and recommend exactly ONE action.

Allowed actions:
- RETRY_PAYMENT
- SEND_REMINDER
- ESCALATE
- STOP

Transaction:
${JSON.stringify(
  {
    transactionId: transaction.transactionId,
    amount: transaction.amount,
    currency: transaction.currency,
    paymentMethod: transaction.paymentMethod,
    status: transaction.status,
    failureReason: transaction.failureReason,
    retryCount: transaction.retryCount,
    recoveryProbability: transaction.recoveryProbability,
  },
  null,
  2
)}

Rules:
- Never recommend retry if retryCount >= 3.
- Never recommend recovery for an already captured transaction.
- Temporary failures may justify RETRY_PAYMENT.
- Customer-action failures may justify SEND_REMINDER.
- Risky or uncertain situations should use ESCALATE.
- If retry limit is reached, use STOP.

Return ONLY valid JSON:

{
  "action": "RETRY_PAYMENT | SEND_REMINDER | ESCALATE | STOP",
  "confidence": 0.0,
  "reason": "short explanation"
}
`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a conservative payment recovery AI. Return only valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = completion.choices[0].message.content;

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error("AI returned invalid JSON");
  }
};

module.exports = {
  getAIRecoveryDecision,
};