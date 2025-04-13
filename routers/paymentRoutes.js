const express = require('express');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you have this
// const csrfProtection = require('csurf')({ cookie: true }); // If using csurf

const router = express.Router();

// Apply auth middleware to all payment routes
router.use(authMiddleware);
// Apply CSRF protection if used
// router.use(csrfProtection);

// Route to display the payment page for a specific order
router.get('/:orderId', paymentController.renderPaymentPage);

// Route to process the payment submission
router.post('/process', paymentController.processPayment);

// Route for order confirmation page (optional but good practice)
router.get('/orders/:orderId/confirmation', paymentController.renderOrderConfirmation);


module.exports = router;
