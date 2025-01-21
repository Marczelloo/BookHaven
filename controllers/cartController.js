const CartService = require('../models/cartService');
const mongoose = require('mongoose');
const shippingPrice = 5;

exports.addToCart = async (req, res) => {
   const { bookId, quantity } = req.body;

   if(!mongoose.Types.ObjectId.isValid(bookId)) return res.status(400).json('Invalid book ID');

   try
   {
      const cart = await CartService.addToCart(req.session, bookId, quantity);

      res.status(200).json(cart);
   }
   catch(error)
   {
      console.error("Error adding to cart: ", error);
      res.status(500).json({ error: 'Internal Server Error' });
   }
}

exports.removeFromCart = async (req, res) => {
   const { bookId } = req.body;

   if (!mongoose.Types.ObjectId.isValid(bookId)) 
   {
      console.error('Invalid book ID:', bookId);
      return res.status(400).json({ error: 'Invalid book ID' });
   }

   try
   {
      const newCart = await CartService.removeFromCart(req.session, bookId);

      const subtotal = CartService.calculateSubtotal(newCart);
      const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
      const discount = (discountPercent / 100) * subtotal;
      const total = CartService.calculateTotal(subtotal, shippingPrice, discount);

      console.log(newCart);

      res.status(200).json({newCart, subtotal, discount, total});
   }
   catch(error)
   {
      console.error("Error removing from cart: ", error);
      res.status(500).json({ error: 'Internal Server Error' });
   }
}

exports.updateCart = async (req, res) => {
   const { bookId, action } = req.body;

   if(!mongoose.Types.ObjectId.isValid(bookId)) return res.status(400).send('Invalid book ID');

   if(action !== 'increase' && action !== 'decrease') return res.status(400).send('Invalid action');

   try
   {
      const cartItems = await CartService.updateCart(req.session, bookId, action);
      const existingItemIndex = cartItems.findIndex(item => item.book._id.toString() === bookId);
      
      const subtotal = CartService.calculateSubtotal(cartItems);
      const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
      const discount = (discountPercent / 100) * subtotal;
      const total = CartService.calculateTotal(subtotal, shippingPrice, discount);

      res.status(200).json({ newQuantity: cartItems[existingItemIndex] ? cartItems[existingItemIndex].quantity : 0, subtotal, discount, total });
   }
   catch(error)
   {
      console.error("Error updating cart: ", error);
      res.status(500).json({ error: 'Internal Server Error' });
   }
}

exports.getCart = async (req, res) => {
   try
   {
      const cartItems = await CartService.getCartItems(req.session);

      const subtotal = CartService.calculateSubtotal(cartItems);
      const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
      const discount = (discountPercent / 100) * subtotal;
      const total = CartService.calculateTotal(subtotal, shippingPrice, discount);

      res.render('cartPage', { title: 'Cart', cartItems, subtotal, discount, total });
   }
   catch(error)
   {
      console.error("Error fetching cart: ", error);
      res.status(500).send('Internal Server Error');
   }
}