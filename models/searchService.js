const Book = require('./book');
const Subcategory = require('./subcategory');
const Category = require('./category');

class SearchService {
    static async searchBooks(input) {
        return await Book.find({ title: { $regex: input, $options: 'i' } });
    }

    static async getCategories() {
        return await Category.find();
    }

    static async getSearchSuggestions(input) {
        return await Book.find({ title: { $regex: input, $options: 'i' } }).limit(8);
    }

    static async getSubcategories(category) {
        return await Subcategory.find({ category });
    }

   static async getResults(search, searchBy, sortBy, sortOrderAsc, category, subcategory, minPrice, maxPrice, rating) {
      let query = {};

      if (searchBy === 'title') query.title = { $regex: search, $options: 'i' };
      if (searchBy === 'author') query.author = { $regex: search, $options: 'i' };
      if (searchBy === 'description') query.description = { $regex: search, $options: 'i' };
      if (category) query.category = category;
      if (subcategory) query.subcategory = subcategory;
      if (minPrice || maxPrice) query.price = { $gte: minPrice, $lte: maxPrice };
      if (rating) query.averageRating = { $gte: rating };

      let books = await Book.find(query);

      if (sortBy) {
          switch (sortBy) {
              case 'title':
                  books = books.sort((a, b) => a.title.localeCompare(b.title));
                  break;
              case 'author':
                  books = books.sort((a, b) => a.author.localeCompare(b.author));
                  break;
              case 'price':
                  books = books.sort((a, b) => a.price - b.price);
                  break;
              case 'rating':
                  books = books.sort((a, b) => a.averageRating - b.averageRating);
                  break;
          }
      }

      if (!sortOrderAsc) {
          books = books.reverse();
      }

      return books;
   }
}

module.exports = SearchService;