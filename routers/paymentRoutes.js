const express = require("express");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware"); // Assuming you have this
// const csrfProtection = require('csurf')({ cookie: true }); // If using csurf

const router = express.Router();

// Apply auth middleware to all payment routes
router.use(authMiddleware);
// Apply CSRF protection if used
// router.use(csrfProtection);

// Route for order confirmation page (must be before /:orderId to avoid conflicts)
router.get("/orders/:orderId/confirmation", paymentController.renderOrderConfirmation);

// Route to process the payment submission
router.post("/process", paymentController.processPayment);

// Route to display the payment page for a specific order
router.get("/:orderId", paymentController.renderPaymentPage);

module.exports = router;
