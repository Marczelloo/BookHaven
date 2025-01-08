const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
   book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
   },
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      require: true,
   },
   rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
   },
   comment: {
      type: String,
   },
   date: {
      type: Date,
      default: Date.now,
   }
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;