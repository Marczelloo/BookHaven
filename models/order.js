const mongoose = require('mongoose');

const oderSchema = new mongoose.Schema({
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
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
   }
})

const Order = mongoose.model('Order', oderSchema);

module.exports = Order;