const Book = require('../models/book');

exports.getSearchPage = async (req, res) => {
   const input = req.query.search;

   if (!input) return res.status(400).json({ message: 'No search input' });

   try 
   {
      const books = await Book.find({ title: { $regex: input, $options: 'i' } });
      res.render('searchPage', { title: 'Search', books });
   } 
   catch (err) 
   {
      console.error('Error searching books:', err);
      res.status(500).json({ message: 'Internal Server Error' });
   }
};

exports.getSearchSuggestions = async (req, res) => {
   const input = req.body.input;

   if (!input) return res.status(400).json({ message: 'No search input' });

   try 
   {
      const books = await Book.find({ title: { $regex: input, $options: 'i' } }).limit(8);

      res.status(200).json({ books: books.map(book => ({
         id: book._id,
         title: book.title,
         author: book.author,
         cover: book.cover
      }))});
   } 
   catch (err) 
   {
      console.error('Error searching books:', err);
      res.status(500).json({ message: 'Internal Server Error' });
   }
}