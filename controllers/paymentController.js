const OrderService = require("../models/orderService");
const PaymentService = require("../models/paymentService");
const UserService = require("../models/userService"); // Import UserService
const { body, validationResult } = require("express-validator");

// Luhn algorithm check function (basic implementation)
const isValidLuhn = (numStr) => {
  let sum = 0;
  let alternate = false;
  for (let i = numStr.length - 1; i >= 0; i--) {
    let n = parseInt(numStr.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n = (n % 10) + 1;
      }
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
};

exports.renderPaymentPage = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.userId; // Get userId from authMiddleware

    // Fetch order and user details in parallel - Use findUserById
    const [order, userDetails] = await Promise.all([
      OrderService.getOrderById(orderId),
      UserService.findUserById(userId), // Corrected method name
    ]);

    if (!userDetails) {
      req.flash("error", "User not found.");
      return res.redirect("/signin");
    }

    // Check if order exists and belongs to the logged-in user
    if (!order || !order.user || order.user._id.toString() !== userId.toString()) {
      req.flash("error", "Order not found or access denied.");
      return res.redirect("/orders"); // Or wherever user orders are listed
    }

    // Ensure order is in a state requiring payment
    if (order.status !== "pending_payment" && order.status !== "payment_failed") {
      req.flash("info", `Order status is ${order.status}. Payment is not required or already completed.`);
      return res.redirect(`/orders/${orderId}`); // Redirect to order details page
    }

    res.render("paymentPage", {
      title: "Complete Payment",
      order: order,
      csrfToken: req.csrfToken ? req.csrfToken() : null, // Pass CSRF token if using csurf
      messages: req.flash(), // Pass flash messages
      user: userDetails, // Pass fetched user details
      currentPage: "payment", // For navigation highlighting
    });
  } catch (error) {
    console.error("Error rendering payment page:", error);
    req.flash("error", "Could not load payment page.");
    res.redirect("/"); // Redirect to home or cart
  }
};

exports.processPayment = [
  // --- Server-side Validation Rules ---
  body("orderId").isMongoId().withMessage("Invalid Order ID."),
  body("cardholderName").trim().notEmpty().withMessage("Cardholder name is required."),
  body("cardNumber")
    .trim()
    .isCreditCard()
    .withMessage("Invalid credit card number format.")
    .custom((value) => {
      const sanitizedValue = value.replace(/\s+/g, ""); // Remove spaces
      if (!isValidLuhn(sanitizedValue)) {
        throw new Error("Credit card number failed validation check.");
      }
      return true;
    }),
  body("expiryDate")
    .trim()
    .matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/) // MM/YY format
    .withMessage("Expiry date must be in MM/YY format.")
    .custom((value) => {
      const [month, year] = value.split("/");
      const expiry = new Date(`20${year}`, month - 1); // Month is 0-indexed
      const now = new Date();
      now.setMonth(now.getMonth() - 1); // Allow current month
      if (expiry < now) {
        throw new Error("Credit card has expired.");
      }
      return true;
    }),
  body("cvv").trim().isNumeric().isLength({ min: 3, max: 4 }).withMessage("CVV must be a 3 or 4 digit number."),

  // --- Processing Logic ---
  async (req, res) => {
    const errors = validationResult(req);
    const { orderId, cardholderName, cardNumber, expiryDate, cvv } = req.body;
    const userId = req.userId; // Use req.userId

    // Fetch order again to ensure it still needs payment and belongs to user
    const order = await OrderService.getOrderById(orderId);

    // Use order.user._id and req.userId for comparison
    if (!order || !order.user || order.user._id.toString() !== userId.toString()) {
      req.flash("error", "Order not found or access denied.");
      return res.redirect("/orders");
    }
    if (order.status !== "pending_payment" && order.status !== "payment_failed") {
      req.flash("info", `Order status is ${order.status}. Payment is not required or already completed.`);
      return res.redirect(`/orders/${orderId}`);
    }

    // Fetch user details for rendering if validation fails - Use findUserById
    const userDetails = await UserService.findUserById(userId); // Corrected method name
    if (!userDetails) {
      req.flash("error", "User not found.");
      return res.redirect("/signin");
    }

    if (!errors.isEmpty()) {
      // Validation failed, re-render the form with errors
      errors.array().forEach((error) => req.flash("error", error.msg));
      return res.render("paymentPage", {
        title: "Complete Payment",
        order: order,
        csrfToken: req.csrfToken ? req.csrfToken() : null,
        messages: req.flash(),
        user: userDetails, // Pass fetched user details
        currentPage: "payment",
        formData: req.body, // Pass back form data to repopulate fields
      });
    }

    try {
      // Prepare details for the payment service
      const paymentDetails = {
        orderId: order._id,
        userId: userId, // Use userId
        amount: order.totalAmount, // Get amount from the order
        currency: order.currency || "USD", // Get currency from order or default
        cardNumber: cardNumber.replace(/\s+/g, ""), // Use sanitized card number
        expiryDate: expiryDate,
        cvv: cvv, // CVV is usually not stored or sent beyond the gateway
        cardholderName: cardholderName,
      };

      // Call the payment service to process the payment
      const result = await PaymentService.processPayment(paymentDetails);

      if (result.success) {
        // --- Generate Invoice ---
        try {
          const invoiceService = req.app.locals.invoiceService;
          if (invoiceService) {
            const invoiceResult = await invoiceService.generateInvoice(orderId);
            if (invoiceResult && invoiceResult.success) {
              // Update order with invoice path
              await OrderService.updateOrder(orderId, {
                invoicePath: invoiceResult.path,
                invoiceGeneratedAt: new Date(),
              });
              console.log(`Invoice generated successfully for order ${orderId} at ${invoiceResult.path}`);
            } else {
              // Log error but don't block user flow
              console.error(`Failed to generate invoice for order ${orderId}`);
            }
          }
        } catch (invoiceError) {
          // Log error but don't block user flow
          console.error(`Error generating invoice for order ${orderId}:`, invoiceError);
        }
        // --- End Invoice Generation ---

        req.flash("success", "Payment successful! Your order is being processed.");
        // Redirect to an order confirmation/thank you page
        return res.redirect(`/payment/orders/${orderId}/confirmation`);
      } else {
        req.flash("error", result.message || "Payment failed. Please try again or use a different card.");
        return res.redirect(`/payment/${orderId}`);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      req.flash("error", "An unexpected error occurred during payment processing.");
      return res.redirect(`/payment/${orderId}`);
    }
  },
];

// Optional: Render an order confirmation page
exports.renderOrderConfirmation = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.userId; // Use req.userId

    // Fetch order and user details - Use findUserById
    const [order, userDetails] = await Promise.all([
      OrderService.getOrderById(orderId),
      UserService.findUserById(userId), // Corrected method name
    ]);

    if (!userDetails) {
      req.flash("error", "User not found.");
      return res.redirect("/signin");
    }

    // Use order.user._id and req.userId for comparison
    if (!order || !order.user || order.user._id.toString() !== userId.toString()) {
      req.flash("error", "Order not found.");
      return res.redirect("/orders");
    }

    // Optionally fetch payment details if needed on confirmation page
    const payments = await PaymentService.getPaymentsByOrderId(orderId);
    const successfulPayment = payments.find((p) => p.status === "succeeded");

    res.render("orderConfirmationPage", {
      // Need to create this view
      title: "Order Confirmation",
      order: order,
      payment: successfulPayment, // Pass successful payment details
      user: userDetails, // Pass fetched user details
      messages: req.flash(),
      currentPage: "confirmation",
    });
  } catch (error) {
    console.error("Error rendering order confirmation:", error);
    req.flash("error", "Could not load order confirmation.");
    res.redirect("/orders");
  }
};
