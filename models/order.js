const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [{
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        }
    }],
    orderAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderAddress',
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ['pending_payment', 'payment_failed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending_payment', // Start here before payment
    },
    currency: { // Good to store currency with the order
        type: String,
        required: true,
        default: 'USD',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    // --- Added for Invoicing ---
    invoicePath: {
        type: String,
        default: null, // Path to the generated PDF invoice
    },
    invoiceGeneratedAt: {
        type: Date,
        default: null,
    }
    // --- End Invoicing Fields ---
});

orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;