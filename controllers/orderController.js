const OrderService = require("../models/orderService");
const CartService = require('../models/cartService'); // Import CartService
const flash = require('connect-flash'); // Import connect-flash if not already globally available via middleware
const fs = require('fs'); // Import fs for file system access
const path = require('path'); // Import path for handling file paths

exports.placeOrder = async (req, res) => {
   console.log('--- placeOrder controller START ---'); // Log start
   const { name, surname, phoneNumber, address, city, country, zipCode } = req.body;
   const userId = req.userId;

   if (!userId) {
       console.log('User ID not found, redirecting to signin.'); // Log missing userId
       req.flash('error', 'Authentication error. Please sign in again.');
       return res.redirect('/signin');
   }
   console.log('User ID:', userId);

   try {
      console.log('Fetching cart items...');
      const cartItemsDetails = await CartService.getCartItems(req.session);
      console.log('Cart items fetched:', cartItemsDetails ? cartItemsDetails.length : 0);

      if (!cartItemsDetails || cartItemsDetails.length === 0) {
         console.log('Cart is empty, redirecting back to cart.'); // Log empty cart
         req.flash('error', 'Your cart is empty.');
         return res.redirect('/cart');
      }

      const orderData = { name, surname, phoneNumber, address, city, country, zipCode };
      const cartItemsForOrder = cartItemsDetails.map(item => ({
          bookId: item.book._id,
          quantity: item.quantity
      }));
      console.log('Order data prepared:', orderData);
      console.log('Cart items for order:', cartItemsForOrder);

      console.log('Placing order via OrderService...');
      const newOrder = await OrderService.placeOrder(userId, orderData, cartItemsForOrder);
      console.log('Order placed successfully. Order ID:', newOrder._id);

      console.log('Clearing session cart...');
      req.session.cart = [];

      console.log('Redirecting to payment page:', `/payment/${newOrder._id}`); // Log redirect
      req.flash('success', 'Order created successfully. Please complete payment.');
      res.redirect(`/payment/${newOrder._id}`);

   } catch (error) {
      console.error("Error placing order: ", error); // Log error
      console.log('Error occurred, redirecting back to cart.'); // Log redirect on error
      req.flash('error', 'Failed to place order. ' + error.message);
      res.redirect('/cart');
   }
   console.log('--- placeOrder controller END ---'); // Log end
};

exports.downloadInvoice = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.userId;

    try {
        const order = await OrderService.getOrderById(orderId);

        // Verify order exists, belongs to user, and has an invoice path
        if (!order || order.user._id.toString() !== userId.toString()) {
            req.flash('error', 'Order not found or access denied.');
            return res.redirect('/profile#orders');
        }

        if (!order.invoicePath) {
            req.flash('error', 'Invoice not available for this order.');
            return res.redirect('/profile#orders');
        }

        // Check if the file exists before attempting to download
        if (!fs.existsSync(order.invoicePath)) {
            console.error(`Invoice file not found at path: ${order.invoicePath} for order ${orderId}`);
            req.flash('error', 'Invoice file could not be found. Please contact support.');
            // Optionally: Regenerate invoice here if possible, or mark the order
            return res.redirect('/profile#orders');
        }

        // Use res.download to send the file
        // The third argument sets the filename the user will see when downloading
        const filename = path.basename(order.invoicePath);
        res.download(order.invoicePath, filename, (err) => {
            if (err) {
                // Handle errors that occur during file transfer
                console.error(`Error downloading invoice ${filename} for order ${orderId}:`, err);
                // Avoid sending flash messages after headers might have been sent
                if (!res.headersSent) {
                    req.flash('error', 'Could not download the invoice file.');
                    res.redirect('/profile#orders');
                }
            }
        });

    } catch (error) {
        console.error("Error fetching order for invoice download:", error);
        req.flash('error', 'Failed to retrieve invoice details.');
        res.redirect('/profile#orders');
    }
};