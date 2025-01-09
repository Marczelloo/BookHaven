const mongoose = require('mongoose');
const Book = require('../models/book');
const shippingPrice = 5;

exports.addToCart = async (req, res) => {
   const { bookId, quantity } = req.body;

   if(!mongoose.Types.ObjectId.isValid(bookId)) return res.status(400).json('Invalid book ID');

   try
   {
      const book = await Book.findById(bookId);

      if(!book) return res.status(404).json('Book not found');

      let cart = req.session.cart || [];

      const existingItemIndex = cart.findIndex(item => item.bookId.toString() === bookId);
      if (existingItemIndex > -1) 
         cart[existingItemIndex].quantity += quantity;
      else 
         cart.push({ bookId, quantity });

      req.session.cart = cart;

      console.log('cart: ', req.session.cart);
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
      let cart = req.session.cart || [];

      const newCart = cart.filter(item => item.bookId.toString() !== bookId);

      req.session.cart = newCart;

      const bookIds = newCart.map(item => item.bookId);

      const books = await Book.find({ _id: { $in: bookIds } });

      const cartItems = books.map(book => {
         const item = cart.find(item => item.bookId.toString() === book._id.toString());
         return {
            book,
            quantity: item.quantity
         };
      });

      const subtotal = cartItems.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
      const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
      const discount = (discountPercent / 100) * subtotal;
      const total = newCart.length === 0 ? 0 : (shippingPrice + subtotal) - discount;

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
      let cart = req.session.cart || [];

      const existingItemIndex = cart.findIndex(item => item.bookId.toString() === bookId);

      if(existingItemIndex === -1) return res.status(404).send('Item not found in cart');

      if(action === 'increase' && cart[existingItemIndex].quantity < 10) cart[existingItemIndex].quantity++;
      else if(action === 'decrease' && cart[existingItemIndex]) cart[existingItemIndex].quantity--;

      if(cart[existingItemIndex].quantity === 0) cart = cart.filter(item => item.bookId.toString() !== bookId);

      req.session.cart = cart;

      const bookIds = cart.map(item => item.bookId);

      const books = await Book.find({ _id: { $in: bookIds } });

      const cartItems = books.map(book => {
         const item = cart.find(item => item.bookId.toString() === book._id.toString());
         return {
            book,
            quantity: item.quantity
         };
      });

      const subtotal = cartItems.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
      const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
      const discount = (discountPercent / 100) * subtotal;
      const total = cart.length === 0 ? 0 : (shippingPrice + subtotal) - discount;

      res.status(200).json({ newQuantity: cart[existingItemIndex] ? cart[existingItemIndex].quantity : 0, subtotal, discount, total });
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
      const cart = req.session.cart || [];

      if(cart.length === 0) return res.render('cartPage', { title: 'Cart', cartItems: [], subtotal: 0, discount: 0, total: 0 });

      const bookIds = cart.map(item => item.bookId);

      const books = await Book.find({ _id: { $in: bookIds } });

      const cartItems = books.map(book => {
         const item = cart.find(item => item.bookId.toString() === book._id.toString());
         return {
            book,
            quantity: item.quantity
         };
      });

      const subtotal = cartItems.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
      const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
      const discount = (discountPercent / 100) * subtotal;
      const total = (shippingPrice + subtotal) - discount;

      res.render('cartPage', { title: 'Cart', cartItems, subtotal, discount, total });
   }
   catch(error)
   {
      console.error("Error fetching cart: ", error);
      res.status(500).send('Internal Server Error');
   }
}