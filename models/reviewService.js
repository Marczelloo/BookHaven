const Review = require("./review");
const Book = require("./book");
const mongoose = require("mongoose");

class ReviewService {
  /**
   * Add a new review for a book
   */
  static async addReview(userId, bookId, rating, comment) {
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      throw new Error("Invalid book ID");
    }

    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error("Book not found");
    }

    // Check if user already reviewed this book
    const existingReview = await Review.findOne({ book: bookId, user: userId });
    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.date = new Date();
      await existingReview.save();

      // Recalculate average
      const { averageRating, reviewsCount } = await this.calculateBookRating(bookId);

      return {
        review: await existingReview.populate("user", "username email avatar"),
        averageRating,
        reviewsCount,
      };
    }

    // Create new review
    const review = new Review({
      book: bookId,
      user: userId,
      rating,
      comment: comment || "",
    });

    await review.save();

    // Recalculate book's average rating
    const { averageRating, reviewsCount } = await this.calculateBookRating(bookId);

    // Populate user info before returning
    await review.populate("user", "username email avatar");

    return { review, averageRating, reviewsCount };
  }

  /**
   * Get all reviews for a book
   */
  static async getBookReviews(bookId) {
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      throw new Error("Invalid book ID");
    }

    const reviews = await Review.find({ book: bookId }).populate("user", "username email avatar").sort({ date: -1 });

    return reviews;
  }

  /**
   * Calculate average rating for a book
   */
  static async calculateBookRating(bookId) {
    const reviews = await Review.find({ book: bookId });
    const reviewsCount = reviews.length;

    if (reviewsCount === 0) {
      return { averageRating: 0, reviewsCount: 0 };
    }

    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = totalRating / reviewsCount;

    // Update the book's average rating
    await Book.findByIdAndUpdate(bookId, {
      averageRating: Math.round(averageRating * 10) / 10,
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewsCount,
    };
  }

  /**
   * Delete a review (by user or admin)
   */
  static async deleteReview(reviewId, userId) {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new Error("Invalid review ID");
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // Check if user owns the review
    if (review.user.toString() !== userId.toString()) {
      throw new Error("Unauthorized to delete this review");
    }

    const bookId = review.book;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate book's average rating
    const { averageRating, reviewsCount } = await this.calculateBookRating(bookId);

    return { averageRating, reviewsCount };
  }

  /**
   * Get user's review for a specific book
   */
  static async getUserReviewForBook(userId, bookId) {
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      throw new Error("Invalid book ID");
    }

    const review = await Review.findOne({ book: bookId, user: userId });
    return review;
  }
}

module.exports = ReviewService;
