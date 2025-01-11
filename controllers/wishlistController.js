const mongoose = require("mongoose");
const Book = require("../models/book");
const shippingPrice = 5;

exports.addToWishlist = async (req, res) => { 
   const { bookId, quantity } = req.body;

   if(!mongoose.Types.ObjectId.isValid(bookId))
   {
      console.error('Invalid book ID:', bookId);
      return res.status(400).json({ error: 'Invalid book ID' });         
   } 

   try
   {
      const book = await Book.findById(bookId);

      if(!book) return res.status(404).json('Book not found');

      const wishlist = req.session.wishlist || [];

      const existingItemIndex = wishlist.findIndex(item => item.bookId.toString() === bookId);
      if (existingItemIndex > -1) 
         wishlist[existingItemIndex].quantity += quantity;
      else 
         wishlist.push({ bookId, quantity });

      req.session.wishlist = wishlist;

      console.log('wishlist: ', req.session.wishlist);
      res.status(200).json(wishlist);
   }
   catch(error)
   {
      console.error("Error adding to wishlist: ", error);
      res.status(500).json({ error: 'Internal Server Error' });
   }
}

exports.removeFromWishlist = async (req, res) => {
   const { bookId } = req.body;

   if(!mongoose.Types.ObjectId.isValid(bookId)) return res.status(400).json('Invalid book ID');

   try
   {
      let wishlist = req.session.wishlist || [];

      const newWishlist = wishlist.filter(item => item.bookId.toString() !== bookId);

      req.session.wishlist = newWishlist;

      const bookIds = newWishlist.map(item => item.bookId);

      const books = await Book.find({ _id: { $in: bookIds } });

      const wishlistItems = books.map(book => {
         const item = wishlist.find(item => item.bookId.toString() === book._id.toString());
         return {
            book,
            quantity: item.quantity
         }
      })

      const subtotal = wishlistItems.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
      const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
      const discount = (discountPercent / 100) * subtotal;
      const total = newWishlist.length === 0 ? 0 : (shippingPrice + subtotal) - discount;

      res.status(200).json({ wishlistItems, subtotal, discount, total });
   }
   catch(error)
   {
      console.error("Error removing from wishlist: ", error);
      res.status(500).json({ error: 'Internal Server Error' });
   }
}

exports.updateWishlist = async (req, res) => {
   const { bookId, action} = req.body;

   if(!mongoose.Types.ObjectId.isValid(bookId)) return res.status(400).json('Invalid book ID');

   if(action !== 'increase' && action !== 'decrease') return res.status(400).json('Invalid action');
   
   try
   {
      let wishlist = req.session.wishlist || [];

      const existingItemIndex = wishlist.findIndex(item => item.bookId.toString() === bookId);

      if(existingItemIndex === -1) return res.status(404).json('Book not found in wishlist');

      if(action === 'increase' && wishlist[existingItemIndex].quantity < 10) wishlist[existingItemIndex].quantity++;
      else if(action === 'decrease' && wishlist[existingItemIndex]) wishlist[existingItemIndex].quantity--;

      req.session.wishlist = wishlist;

      const bookIds = wishlist.map(item => item.bookId);

      const books = await Book.find({ _id: { $in: bookIds } });

      const wishlistItems = books.map(book => {
         const item = wishlist.find(item => item.bookId.toString() === book._id.toString());
         return {
            book,
            quantity: item.quantity
         }
      })

      const subtotal = wishlistItems.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
      const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
      const discount = (discountPercent / 100) * subtotal;
      const total = wishlistItems.length === 0 ? 0 : (shippingPrice + subtotal) - discount;

      res.status(200).json({ newQuantity: wishlist[existingItemIndex] ? wishlist[existingItemIndex].quantity : 0, wishlistItems, subtotal, discount, total });
   }
   catch(error)
   {
      console.error("Error updating wishlist: ", error);
      res.status(500).json({ error: 'Internal Server Error' });
   }
}

exports.getWishlist = async (req, res) => {
   try
   {
      const wishlist = req.session.wishlist || [];

      if(wishlist.length === 0) return res.render('wishlistPage', { title: 'Wishlist', wishlistItems: [], subtotal: 0, discount: 0, total: 0 });

      const bookIds = wishlist.map(item => item.bookId);

      const books = await Book.find({ _id: { $in: bookIds } });

      const wishlistItems = books.map(book => {
         const item = wishlist.find(item => item.bookId.toString() === book._id.toString());
         return {
            book,
            quantity: item.quantity
         }
      })

      const subtotal = wishlistItems.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
      const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
      const discount = (discountPercent / 100) * subtotal;
      const total = (shippingPrice + subtotal) - discount;

      res.render('wishlistPage', { title: 'Wishlist', wishlistItems, subtotal, discount, total });
   }
   catch(error)
   {
      console.error("Error getting wishlist: ", error);
      res.status(500).send('Internal Server Error');
   }
}

exports.addToCart = async (req, res) => {
   req.session.cart = req.session.wishlist || [];
   req.session.wishlist = [];
   res.status(200).json('Wishlist added to cart');
}

exports.clearWishlist = async (req, res) => {
   req.session.wishlist = [];
   res.status(200).json('Wishlist cleared'); 
}
