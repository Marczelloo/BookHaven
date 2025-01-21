const Book = require('./book');
const mongoose = require('mongoose');

class WishlistService {
    static async addToWishlist(session, bookId, quantity) {
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            throw new Error('Invalid book ID');
        }

        const book = await Book.findById(bookId);
        if (!book) {
            throw new Error('Book not found');
        }

        let wishlist = session.wishlist || [];
        const existingItemIndex = wishlist.findIndex(item => item.bookId.toString() === bookId);
        if (existingItemIndex > -1) {
            wishlist[existingItemIndex].quantity += quantity;
        } else {
            wishlist.push({ bookId, quantity });
        }

        session.wishlist = wishlist;
        return wishlist;
    }

    static async removeFromWishlist(session, bookId) {
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            throw new Error('Invalid book ID');
        }

        let wishlist = session.wishlist || [];
        const newWishlist = wishlist.filter(item => item.bookId.toString() !== bookId);
        session.wishlist = newWishlist;

        const bookIds = newWishlist.map(item => item.bookId);
        const books = await Book.find({ _id: { $in: bookIds } });

        const wishlistItems = books.map(book => {
            const item = wishlist.find(item => item.bookId.toString() === book._id.toString());
            return {
                book,
                quantity: item.quantity
            };
        });

        return wishlistItems;
    }

    static async updateWishlist(session, bookId, action) {
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            throw new Error('Invalid book ID');
        }

        if (action !== 'increase' && action !== 'decrease') {
            throw new Error('Invalid action');
        }

        let wishlist = session.wishlist || [];
        const existingItemIndex = wishlist.findIndex(item => item.bookId.toString() === bookId);

        if (existingItemIndex === -1) {
            throw new Error('Book not found in wishlist');
        }

        if (action === 'increase' && wishlist[existingItemIndex].quantity < 10) {
            wishlist[existingItemIndex].quantity++;
        } else if (action === 'decrease' && wishlist[existingItemIndex].quantity > 1) {
            wishlist[existingItemIndex].quantity--;
        }

        session.wishlist = wishlist;

        const bookIds = wishlist.map(item => item.bookId);
        const books = await Book.find({ _id: { $in: bookIds } });

        const wishlistItems = books.map(book => {
            const item = wishlist.find(item => item.bookId.toString() === book._id.toString());
            return {
                book,
                quantity: item.quantity
            };
        });

        return wishlistItems;
    }

    static async getWishlist(session) {
        let wishlist = session.wishlist || [];
        if (wishlist.length === 0) {
            return { wishlistItems: [], subtotal: 0, discount: 0, total: 0 };
        }

        const bookIds = wishlist.map(item => item.bookId);
        const books = await Book.find({ _id: { $in: bookIds } });

        const wishlistItems = books.map(book => {
            const item = wishlist.find(item => item.bookId.toString() === book._id.toString());
            return {
                book,
                quantity: item.quantity
            };
        });

        const subtotal = wishlistItems.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
        const discountPercent = subtotal > 100 ? 10 : subtotal > 200 ? 20 : 0;
        const discount = (discountPercent / 100) * subtotal;
        const total = (5 + subtotal) - discount;

        return { wishlistItems, subtotal, discount, total };
    }

    static async addToCart(session) {
        session.cart = session.wishlist || [];
        session.wishlist = [];
        return 'Wishlist added to cart';
    }

    static async clearWishlist(session) {
        session.wishlist = [];
        return 'Wishlist cleared';
    }
}

module.exports = WishlistService;