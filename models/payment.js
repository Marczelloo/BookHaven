const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: 'USD', // Or your default currency
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card'], // Expandable later
    default: 'credit_card',
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending',
  },
  transactionId: { // ID from the payment gateway
    type: String,
    // required: true, // Would be required in a real scenario after successful payment
  },
  cardLastFour: { // Store only last 4 digits
    type: String,
    // required: true,
  },
  cardExpiry: { // Store expiry MM/YY
    type: String,
    // required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
