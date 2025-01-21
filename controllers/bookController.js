const BookService = require('../models/bookService');
const mongoose = require('mongoose');

exports.getBookPage = async (req, res) => {
   const bookId = req.params.id;

   if (!mongoose.Types.ObjectId.isValid(bookId)) return res.status(404).send('Invalid book ID');

   try
   {
      const book = await BookService.findBookById(bookId);

      if (!book) return res.status(404).send('Book not found');

      const reviews = await BookService.findReviewsByBookId(bookId);
      const reviewsCount = reviews.length || 0;
      const averageRating = reviews.length ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviewsCount : 0;

      book.averageRating = averageRating;
      book.reviewsCount = reviewsCount;
      book.reviews = reviews || [];
      
      const relatedBooks = await BookService.findRelatedBooks(book.genre, book._id);

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
      const featuredBooks = await BookService.getFeaturedBooks();
      const newReleases = await BookService.getNewReleases();
      const topRatedBooks = await BookService.getTopRatedBooks();
      const promotions = await BookService.getPromotions();
      const popularBooks = await BookService.getPopularBooks();

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