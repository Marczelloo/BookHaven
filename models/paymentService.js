const Payment = require('./payment');
const Order = require('./order'); // Assuming order model exists
const OrderService = require('./orderService'); // Assuming order service exists

class PaymentService {
  // Simulates processing payment with a gateway
  static async processPayment(paymentDetails) {
    // In a real app:
    // 1. Send paymentDetails (card info, amount) to payment gateway (e.g., Stripe)
    // 2. Handle the response (success/failure)
    // 3. If success, get transactionId, card details (last 4, expiry) from gateway response

    // Simulate gateway interaction
    const isSuccess = Math.random() > 0.1; // 90% success rate simulation

    if (isSuccess) {
      const transactionId = `sim_txn_${Date.now()}`; // Simulated transaction ID
      const cardLastFour = paymentDetails.cardNumber.slice(-4);
      const cardExpiry = paymentDetails.expiryDate; // Assuming MM/YY format

      // Create payment record in DB
      const payment = new Payment({
        orderId: paymentDetails.orderId,
        userId: paymentDetails.userId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency || 'USD',
        paymentMethod: 'credit_card',
        status: 'succeeded',
        transactionId: transactionId,
        cardLastFour: cardLastFour,
        cardExpiry: cardExpiry,
      });
      await payment.save();

      // Update order status
      await OrderService.updateOrderStatus(paymentDetails.orderId, 'processing'); // Or 'completed'

      return { success: true, payment };
    } else {
      // Optionally create a failed payment record
       const payment = new Payment({
        orderId: paymentDetails.orderId,
        userId: paymentDetails.userId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency || 'USD',
        paymentMethod: 'credit_card',
        status: 'failed',
        cardLastFour: paymentDetails.cardNumber.slice(-4),
        cardExpiry: paymentDetails.expiryDate,
      });
      await payment.save();

      // Keep order status as 'pending_payment' or set to 'payment_failed'
      await OrderService.updateOrderStatus(paymentDetails.orderId, 'payment_failed');

      return { success: false, message: 'Payment processing failed.' };
    }
  }

  static async getPaymentById(paymentId) {
    return await Payment.findById(paymentId);
  }

  static async getPaymentsByOrderId(orderId) {
    return await Payment.find({ orderId });
  }
}

module.exports = PaymentService;
