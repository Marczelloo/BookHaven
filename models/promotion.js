const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 5,
    max: 70,
  },
  originalPrice: {
    type: Number,
    required: true,
  },
  promotionalPrice: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
promotionSchema.index({ book: 1, isActive: 1 });
promotionSchema.index({ endDate: 1 });
promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Static method to check if a book has an active promotion
promotionSchema.statics.getActivePromotion = async function (bookId) {
  const now = new Date();
  return await this.findOne({
    book: bookId,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
};

// Static method to get all active promotions
promotionSchema.statics.getAllActivePromotions = async function () {
  const now = new Date();
  return await this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).populate("book");
};

const Promotion = mongoose.model("Promotion", promotionSchema);

module.exports = Promotion;
