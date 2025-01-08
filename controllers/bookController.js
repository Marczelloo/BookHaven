const Book = require('../models/book');
const Review = require('../models/review');
const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const mongoose = require('mongoose');

exports.getBookPage = async (req, res) => {
   const bookId = req.params.id;

   if (!mongoose.Types.ObjectId.isValid(bookId)) return res.status(404).send('Invalid book ID');

   try
   {
      const book = await Book.findById(bookId)
         .populate('category')
         .populate('subcategory');

      if (!book) return res.status(404).send('Book not found');

      const reviews = await Review.find({ book: bookId });
      const reviewsCount = reviews.length || 0;
      const averageRating = reviews.length ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviewsCount : 0;

      book.averageRating = averageRating;
      book.reviewsCount = reviewsCount;
      book.reviews = reviews || [];
      
      const relatedBooks = await Book.find({
         genre: book.genre,
         _id: { $ne: book._id }
      }).limit(3);

      res.render('bookPage', { title: book.title, book, relatedBooks });
   }
   catch(error)
   {
      console.error("Error fetching book: ", error);
      res.status(500).send('Internal Server Error');
   }
}

exports.getExplorePage = async (req, res) => {
   try
   {
      const featuredBooks = await Book.aggregate([{ $sample: { size: 10 } }]);
      const newReleases = await Book.find().sort({ releaseDate: -1 }).limit(10);
      const topRatedBooks = await Book.find().sort({ averageRating: -1 }).limit(10);
      const promotions = await Book.aggregate([{ $sample: { size: 10 } }]);

      const popularBooks = await Book.aggregate([
         {
            $lookup: {
               from: 'reviews',
               localField: '_id',
               foreignField: 'book',
               as: 'reviews'
            }
         },
         {
            $project: {
               title: 1,
               author: 1,
               cover: 1,
               price: 1,
               reviewCount: { $size: '$reviews' }
            }
         },
         {
            $sort: { reviewCount: -1 }
         },
         {
            $limit: 10
         }
      ]);

      res.render('explorePage', {
         title: 'Explore',
         featuredBooks,
         newReleases,
         topRatedBooks,
         popularBooks,
         promotions
      });
   }
   catch(error)
   {
      console.error("Error fetching books: ", error);
      res.status(500).send('Internal Server Error');
   }
}