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
  console.log("Connected to MongoDB for cron job");
}

// Import after setting up the connection helper
const PromotionService = require("../models/promotionService");

module.exports = async function handler(req, res) {
  // Verify the request is from Vercel Cron (or has valid auth)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // Allow if CRON_SECRET is not set (development) or matches
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await connectDB();

    const result = await PromotionService.generateDailyPromotions();

    return res.status(200).json({
      success: true,
      message: "Daily promotions generated successfully",
      ...result,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
