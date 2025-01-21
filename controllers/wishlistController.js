const WishlistService = require("../models/wishlistService");
const shippingPrice = 5;
const mongoose = require('mongoose');

exports.addToWishlist = async (req, res) => { 
   const { bookId, quantity } = req.body;

   if(!mongoose.Types.ObjectId.isValid(bookId))
   {
      console.error('Invalid book ID:', bookId);
      return res.status(400).json({ error: 'Invalid book ID' });         
   } 

   try
   {
      const wishlist = await WishlistService.addToWishlist(req.session, bookId, quantity);

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
      const wishlistItems = await WishlistService.removeFromWishlist(req.session, bookId);
      
      const subtotal = wishlistItems.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
      const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
      const discount = (discountPercent / 100) * subtotal;
      const total = wishlistItems.length === 0 ? 0 : (shippingPrice + subtotal) - discount;

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
      const wishlistItems = await WishlistService.updateWishlist(req.session, bookId, action);
      
      const subtotal = wishlistItems.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
      const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
      const discount = (discountPercent / 100) * subtotal;
      const total = wishlistItems.length === 0 ? 0 : (shippingPrice + subtotal) - discount;

      const existingItemIndex = wishlistItems.findIndex(item => item.book._id.toString() === bookId);

      res.status(200).json({ newQuantity: wishlistItems[existingItemIndex] ? wishlistItems[existingItemIndex].quantity : 0, wishlistItems, subtotal, discount, total });
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
      const { wishlistItems, subtotal, discount, total } = await WishlistService.getWishlist(req.session);

      res.render('wishlistPage', { title: 'Wishlist', wishlistItems, subtotal, discount, total });
   }
   catch(error)
   {
      console.error("Error getting wishlist: ", error);
      res.status(500).send('Internal Server Error');
   }
}

exports.addToCart = async (req, res) => {
   try
   {
      const message = await WishlistService.addToCart(req.session);

      res.status(200).json('Wishlist added to cart');
   }
   catch(error)
   {
      console.error("Error adding wishlist to cart: ", error);
      res.status(500).json({ error: 'Internal Server Error' });
   }
}

exports.clearWishlist = async (req, res) => {
   try
   {
      const message = await WishlistService.clearWishlist(req.session);

      res.status(200).json('Wishlist cleared'); 
   }
   catch(error)
   {
      console.error("Error clearing wishlist: ", error);
      res.status(500).json({ error: 'Internal Server Error' });
   }
}
