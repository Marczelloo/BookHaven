const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
   cover: {
      type: String,
      required: true,
   },
   title: {
      type: String,
      required: true,
      trimg: true,
   },
   author: {
      type: String,
      required: true,
      trim: true,
   },
   price: {
      type: Number,
      required: true,
   },
   language: {
      type: String,
      required: true,
   },
   condition: {
      type: String,
      enum: ['New', 'Almost New', 'Used'],
      default: 'New',
   },
   quantity: {
      type: Number,
      required: true,
   },
   description: {
      type: String,
      required: true,
   },
   category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
   },
   subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
      required: true,
   },
   pages: {
      type: Number,
      require: true,
   },
   realaseDate: {
      type: Date,
      required: true,
   },
   reviews: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
   },
   averageRating: {
      type: Number,
      default: 0,
   }
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;