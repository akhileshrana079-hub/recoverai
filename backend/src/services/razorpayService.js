const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async ({ amount, currency = "INR", receipt }) => {
  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt,
  });

  return order;
};

module.exports = {
  razorpay,
  createOrder,
};