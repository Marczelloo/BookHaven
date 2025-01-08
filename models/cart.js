const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
   book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
   },
   quantity: {
      type: Number,
      required: true,
   },
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   },
   createdAt: {
      type: Date,
      default: Date.now,
   },
});