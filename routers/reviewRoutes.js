const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");

// Add a review (requires authentication)
router.post("/add", authMiddleware, reviewController.addReview);

// Get reviews for a book (public)
router.get("/book/:bookId", reviewController.getBookReviews);

// Delete a review (requires authentication)
router.delete("/:reviewId", authMiddleware, reviewController.deleteReview);

module.exports = router;
