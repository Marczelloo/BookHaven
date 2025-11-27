const OrderService = require("../models/orderService");
const CartService = require("../models/cartService"); // Import CartService
const flash = require("connect-flash"); // Import connect-flash if not already globally available via middleware
const { createSignedUrl } = require("../services/storageService");

const INVOICES_BUCKET = process.env.SUPABASE_INVOICES_BUCKET;

exports.placeOrder = async (req, res) => {
  console.log("--- placeOrder controller START ---"); // Log start
  const { name, surname, phoneNumber, address, city, country, zipCode } = req.body;
  const userId = req.userId;

  if (!userId) {
    console.log("User ID not found, redirecting to signin."); // Log missing userId
    req.flash("error", "Authentication error. Please sign in again.");
    return res.redirect("/signin");
  }
  console.log("User ID:", userId);

  try {
    console.log("Fetching cart items...");
    const cartItemsDetails = await CartService.getCartItems(req.session);
    console.log("Cart items fetched:", cartItemsDetails ? cartItemsDetails.length : 0);

    if (!cartItemsDetails || cartItemsDetails.length === 0) {
      console.log("Cart is empty, redirecting back to cart."); // Log empty cart
      req.flash("error", "Your cart is empty.");
      return res.redirect("/cart");
    }

    const orderData = { name, surname, phoneNumber, address, city, country, zipCode };
    const cartItemsForOrder = cartItemsDetails.map((item) => ({
      bookId: item.book._id,
      quantity: item.quantity,
    }));
    console.log("Order data prepared:", orderData);
    console.log("Cart items for order:", cartItemsForOrder);

    console.log("Placing order via OrderService...");
    const newOrder = await OrderService.placeOrder(userId, orderData, cartItemsForOrder);
    console.log("Order placed successfully. Order ID:", newOrder._id);

    console.log("Clearing session cart...");
    req.session.cart = [];

    console.log("Redirecting to payment page:", `/payment/${newOrder._id}`); // Log redirect
    req.flash("success", "Order created successfully. Please complete payment.");
    res.redirect(`/payment/${newOrder._id}`);
  } catch (error) {
    console.error("Error placing order: ", error); // Log error
    console.log("Error occurred, redirecting back to cart."); // Log redirect on error
    req.flash("error", "Failed to place order. " + error.message);
    res.redirect("/cart");
  }
  console.log("--- placeOrder controller END ---"); // Log end
};

exports.downloadInvoice = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.userId;

  try {
    const order = await OrderService.getOrderById(orderId);

    // Verify order exists, belongs to user, and has an invoice path
    if (!order || order.user._id.toString() !== userId.toString()) {
      req.flash("error", "Order not found or access denied.");
      return res.redirect("/profile#orders");
    }

    if (!order.invoicePath) {
      req.flash("error", "Invoice not available for this order.");
      return res.redirect("/profile#orders");
    }

    if (!INVOICES_BUCKET) {
      req.flash("error", "Invoice storage is not configured.");
      return res.redirect("/profile#orders");
    }

    const signedUrl = await createSignedUrl(INVOICES_BUCKET, order.invoicePath, 60 * 10); // 10 minutes
    if (!signedUrl) {
      req.flash("error", "Could not generate invoice download link. Please try again.");
      return res.redirect("/profile#orders");
    }

    return res.redirect(signedUrl);
  } catch (error) {
    console.error("Error fetching order for invoice download:", error);
    req.flash("error", "Failed to retrieve invoice details.");
    res.redirect("/profile#orders");
  }
};

exports.cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.userId;

  try {
    const order = await OrderService.getOrderById(orderId);

    // Verify order exists and belongs to user
    if (!order || order.user._id.toString() !== userId.toString()) {
      return res.status(404).json({ message: "Order not found or access denied." });
    }

    // Only allow cancellation of orders in 'processing' status
    if (order.status !== "processing") {
      return res.status(400).json({
        message: `Cannot cancel order. Order is already ${order.status}.`,
      });
    }

    // Cancel the order
    const updatedOrder = await OrderService.cancelOrder(orderId);

    return res.status(200).json({
      message: "Order cancelled successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({ message: "Failed to cancel order." });
  }
};
