const ReviewService = require("../models/reviewService");
const mongoose = require("mongoose");

exports.addReview = async (req, res) => {
  const { bookId, rating, comment } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Please sign in to submit a review" });
  }

  if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  try {
    const result = await ReviewService.addReview(userId, bookId, rating, comment);

    res.status(200).json({
      message: "Review submitted successfully",
      review: result.review,
      averageRating: result.averageRating,
      reviewsCount: result.reviewsCount,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: error.message || "Failed to submit review" });
  }
};

exports.getBookReviews = async (req, res) => {
  const { bookId } = req.params;

  if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  try {
    const reviews = await ReviewService.getBookReviews(bookId);
    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

exports.deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Please sign in to delete a review" });
  }

  if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(400).json({ message: "Invalid review ID" });
  }

  try {
    const result = await ReviewService.deleteReview(reviewId, userId);
    res.status(200).json({
      message: "Review deleted successfully",
      averageRating: result.averageRating,
      reviewsCount: result.reviewsCount,
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: error.message || "Failed to delete review" });
  }
};
