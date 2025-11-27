const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/place", authMiddleware, orderController.placeOrder);

// Route to download an invoice
router.get("/:orderId/invoice", authMiddleware, orderController.downloadInvoice);

// Route to cancel an order
router.post("/:orderId/cancel", authMiddleware, orderController.cancelOrder);

module.exports = router;
