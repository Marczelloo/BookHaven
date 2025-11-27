const Book = require("./book");
const Review = require("./review");
const PromotionService = require("./promotionService");
const mongoose = require("mongoose");

class BookService {
  static async findBookById(bookId) {
    return await Book.findById(bookId).populate("category").populate("subcategory");
  }

  static async findReviewsByBookId(bookId) {
    return await Review.find({ book: bookId }).populate("user", "username email avatar");
  }

  static async findRelatedBooks(genre, bookId) {
    return await Book.find({
      genre: genre,
      _id: { $ne: bookId },
    }).limit(3);
  }

  static async getFeaturedBooks() {
    const books = await Book.aggregate([{ $sample: { size: 10 } }]);
    return await PromotionService.enhanceBooksWithPromotions(books);
  }

  static async getNewReleases() {
    const books = await Book.find().sort({ releaseDate: -1 }).limit(10);
    return await PromotionService.enhanceBooksWithPromotions(books);
  }

  static async getTopRatedBooks() {
    const books = await Book.find().sort({ averageRating: -1 }).limit(10);
    return await PromotionService.enhanceBooksWithPromotions(books);
  }

  static async getPromotions() {
    return await PromotionService.getBooksOnPromotion(10);
  }

  static async getPopularBooks() {
    const books = await Book.aggregate([
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "book",
          as: "reviews",
        },
      },
      {
        $addFields: {
          reviewsCount: { $size: "$reviews" },
          averageRating: { $avg: "$reviews.rating" },
        },
      },
      {
        $sort: { reviewsCount: -1, averageRating: -1 },
      },
      {
        $limit: 10,
      },
    ]);
    return await PromotionService.enhanceBooksWithPromotions(books);
  }

  static async getBookWithPromotion(bookId) {
    const book = await this.findBookById(bookId);
    if (!book) return null;

    const promotion = await PromotionService.getBookPromotion(bookId);
    const bookObj = book.toObject();

    if (promotion) {
      bookObj.promotion = promotion;
    }

    return bookObj;
  }
}

module.exports = BookService;
