const Book = require('./book');
const Review = require('./review');
const mongoose = require('mongoose');

class BookService {
    static async findBookById(bookId) {
        return await Book.findById(bookId)
            .populate('category')
            .populate('subcategory');
    }

    static async findReviewsByBookId(bookId) {
        return await Review.find({ book: bookId });
    }

    static async findRelatedBooks(genre, bookId) {
        return await Book.find({
            genre: genre,
            _id: { $ne: bookId }
        }).limit(3);
    }

    static async getFeaturedBooks() {
        return await Book.aggregate([{ $sample: { size: 10 } }]);
    }

    static async getNewReleases() {
        return await Book.find().sort({ releaseDate: -1 }).limit(10);
    }

    static async getTopRatedBooks() {
        return await Book.find().sort({ averageRating: -1 }).limit(10);
    }

    static async getPromotions() {
        return await Book.aggregate([{ $sample: { size: 10 } }]);
    }

    static async getPopularBooks() {
        return await Book.aggregate([
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'book',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    reviewsCount: { $size: '$reviews' },
                    averageRating: { $avg: '$reviews.rating' }
                }
            },
            {
                $sort: { reviewsCount: -1, averageRating: -1 }
            },
            {
                $limit: 10
            }
        ]);
    }
}

module.exports = BookService;