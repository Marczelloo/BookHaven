const SearchService = require("../models/searchService");
const PromotionService = require("../models/promotionService");

exports.getSearchPage = async (req, res) => {
  const input = req.query.search;

  if (!input) return res.status(400).json({ message: "No search input" });

  try {
    let books = await SearchService.searchBooks(input);
    books = await PromotionService.enhanceBooksWithPromotions(books);
    const categories = await SearchService.getCategories();

    res.render("searchPage", { title: "Search", books: books, categories: categories });
  } catch (err) {
    console.error("Error searching books:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  const input = req.body.input;

  if (!input) return res.status(400).json({ message: "No search input" });

  try {
    const books = await SearchService.getSearchSuggestions(input);

    res.status(200).json({
      books: books.map((book) => ({
        id: book._id,
        title: book.title,
        author: book.author,
        cover: book.cover,
      })),
    });
  } catch (err) {
    console.error("Error searching books:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getSubcategories = async (req, res) => {
  const category = req.body.category;

  if (!category) return res.status(400).json({ message: "No category input" });

  try {
    const subcategories = await SearchService.getSubcategories(category);

    res.status(200).json({ subcategories });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ message: "Internal Server Error" });
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

  console.log(maxPrice);

  if (!search) return res.status(400).json({ message: "No search input" });
  if (!searchBy) return res.status(400).json({ message: "No searchBy input" });

  try {
    let books = await SearchService.getResults(
      search,
      searchBy,
      sortBy,
      sortOrderAsc,
      category,
      subcategory,
      minPrice,
      maxPrice,
      rating
    );
    books = await PromotionService.enhanceBooksWithPromotions(books);

    res.status(200).json({ books });
  } catch (error) {
    console.error("Error fetching search results:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
