const Book = require('../models/book');
const Subcategory = require('../models/subcategory');
const Category = require('../models/category');

exports.getSearchPage = async (req, res) => {
   const input = req.query.search;

   if (!input) return res.status(400).json({ message: 'No search input' });

   try 
   {
      const books = await Book.find({ title: { $regex: input, $options: 'i' } });

      const categories = await Category.find();

      res.render('searchPage', { title: 'Search', books: books, categories: categories });
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

exports.getSubcategories = async (req, res) => {
   const category = req.body.category;

   if (!category) return res.status(400).json({ message: 'No category input' });

   try
   {
      const subcategories = await Subcategory.find({ category });

      res.status(200).json({ subcategories });
   }
   catch(error)
   {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({ message: 'Internal Server Error' });
   }
};

exports.getResults = async (req, res) => {
   const search = req.body.search;
   const searchBy = req.body.searchBy;
   const sortBy = req.body.sortBy;
   const sortOrderAsc = req.body.sortOrderAsc;
   const category = req.body.category;
   const subcategory = req.body.subcategory;
   const minPrice = req.body.minPrice;
   const maxPrice = req.body.maxPrice;
   const rating = req.body.rating;

   if (!search) return res.status(400).json({ message: 'No search input' });
   if (!searchBy) return res.status(400).json({ message: 'No searchBy input' });

   try 
   {
      let query = {};

      if (searchBy === 'title') query.title = { $regex: search, $options: 'i' };
      if (searchBy === 'author') query.author = { $regex: search, $options: 'i' };
      if (searchBy === 'description') query.description = { $regex: search, $options: 'i' };
      if (category) query.category = category;
      if (subcategory) query.subcategory = subcategory;
      if (minPrice && maxPrice) query.price = { $gte: minPrice, $lte: maxPrice };
      if (rating) query.averageRating = { $gte: rating };

      const books = await Book.find(query);

      if(sortBy)
      {
         switch(sortBy)
         {
            case 'title':
               books.sort((a, b) => a.title.localeCompare(b.title));
               break;
            case 'author':
               books.sort((a, b) => a.author.localeCompare(b.author));
               break;
            case 'price':
               books.sort((a, b) => a.price - b.price);
               break;
            case 'rating':
               books.sort((a, b) => a.averageRating - b.averageRating);
               break;
         }
      }

      if(!sortOrderAsc) books.reverse();
      
      res.status(200).json({ books });
  } 
  catch (error) 
  {
      console.error('Error fetching search results:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};