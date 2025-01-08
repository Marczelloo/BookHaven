const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
   name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
   },
   category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
   }
});

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

module.exports = Subcategory;