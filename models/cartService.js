const Book = require('./book');
const mongoose = require('mongoose');

class CartService {
   static async addToCart(session, bookId, quantity) {
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            throw new Error('Invalid book ID');
        }

        const book = await Book.findById(bookId);
        if (!book) {
            throw new Error('Book not found');
        }

        let cart = session.cart || [];
        const existingItemIndex = cart.findIndex(item => item.bookId.toString() === bookId);
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({ bookId, quantity });
        }

        session.cart = cart;
        return cart;
    }

   static async updateCart(session, bookId, action) {
      if (!mongoose.Types.ObjectId.isValid(bookId)) {
          throw new Error('Invalid book ID');
      }

      let cart = session.cart || [];
      const existingItemIndex = cart.findIndex(item => item.bookId.toString() === bookId);

      console.log("prev cart", cart);
      console.log(action);

      if (existingItemIndex > -1) {
          if (action === 'increase') {
              cart[existingItemIndex].quantity += 1;
          } else if (action === 'decrease') {
              cart[existingItemIndex].quantity -= 1;
              if (cart[existingItemIndex].quantity === 0) {
                  cart = cart.filter(item => item.bookId.toString() !== bookId);
              }
          }
      }

      console.log("post cart", cart);

      session.cart = cart;

      const bookIds = cart.map(item => item.bookId);
      const books = await Book.find({ _id: { $in: bookIds } });

      const cartItems = books.map(book => {
          const item = cart.find(item => item.bookId.toString() === book._id.toString());
          return {
              book,
              quantity: item.quantity
          };
      });

      return cartItems;
   }

    static async removeFromCart(session, bookId) {
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            throw new Error('Invalid book ID');
        }

        let cart = session.cart || [];
        const newCart = cart.filter(item => item.bookId.toString() !== bookId);
        session.cart = newCart;

        const bookIds = newCart.map(item => new mongoose.Types.ObjectId(item.bookId));
        const books = await Book.find({ _id: { $in: bookIds } });

        const cartItems = books.map(book => {
            const item = cart.find(item => item.bookId.toString() === book._id.toString());
            return {
                book,
                quantity: item.quantity,
            }
        })

        return cartItems;
    }

    static async getCartItems(session) {
        let cart = session.cart || [];
        const bookIds = cart.map(item => item.bookId);
        const books = await Book.find({ _id: { $in: bookIds } });

        return cart.map(item => {
            const book = books.find(book => book._id.toString() === item.bookId.toString());
            return { book, quantity: item.quantity };
        });
    }

    static calculateSubtotal(cartItems) {
        return cartItems.reduce((acc, item) => acc + (item.quantity * item.book.price), 0);
    }

    static calculateTotal(subtotal, shippingPrice, discount) {
        return subtotal ? (shippingPrice + subtotal) - discount : 0;
    }
}

module.exports = CartService;