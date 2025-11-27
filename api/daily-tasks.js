const mongoose = require("mongoose");

// Database connection for serverless
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const dbUri = process.env.MONGODB_URI;
  if (!dbUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  await mongoose.connect(dbUri);
  isConnected = true;
  console.log("Connected to MongoDB for daily tasks cron job");
}

// Import services after setting up the connection helper
const PromotionService = require("../models/promotionService");
const OrderService = require("../models/orderService");

module.exports = async function handler(req, res) {
  // Verify the request is from Vercel Cron (or has valid auth)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // Allow if CRON_SECRET is not set (development) or matches
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const results = {
    promotions: null,
    orderStatuses: null,
    errors: [],
  };

  try {
    await connectDB();

    // Task 1: Generate daily promotions
    try {
      const promotions = await PromotionService.generateDailyPromotions();
      results.promotions = {
        success: true,
        message: "Daily promotions generated successfully",
        count: promotions.length,
      };
      console.log(`Generated ${promotions.length} daily promotions`);
    } catch (error) {
      console.error("Error generating promotions:", error);
      results.promotions = { success: false, error: error.message };
      results.errors.push(`Promotions: ${error.message}`);
    }

    // Task 2: Update order statuses
    try {
      const orderResult = await OrderService.updateOrderStatusesOverTime();
      results.orderStatuses = {
        success: true,
        message: "Order statuses updated successfully",
        ...orderResult,
      };
      console.log("Order statuses updated:", orderResult);
    } catch (error) {
      console.error("Error updating order statuses:", error);
      results.orderStatuses = { success: false, error: error.message };
      results.errors.push(`Order statuses: ${error.message}`);
    }

    const overallSuccess = results.errors.length === 0;

    return res.status(overallSuccess ? 200 : 207).json({
      success: overallSuccess,
      message: overallSuccess ? "All daily tasks completed successfully" : "Some daily tasks failed",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("Daily tasks cron job error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      results,
    });
  }
};
