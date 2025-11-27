const Promotion = require("./promotion");
const Book = require("./book");

class PromotionService {
  /**
   * Generate daily promotions for random books
   * This method is designed to be called by a cron job
   */
  static async generateDailyPromotions() {
    try {
      // Deactivate expired promotions first
      await this.deactivateExpiredPromotions();

      // Check if we already have enough active promotions for today
      const activePromotions = await Promotion.getAllActivePromotions();

      // If we have at least 8 active promotions, don't generate new ones
      if (activePromotions.length >= 8) {
        console.log("Sufficient active promotions exist. Skipping generation.");
        return {
          success: true,
          message: "Sufficient promotions exist",
          activeCount: activePromotions.length,
        };
      }

      // Get all book IDs that already have active promotions
      const booksWithActivePromotions = activePromotions.map((p) => p.book._id.toString());

      // Determine how many new promotions to create
      const promotionsToCreate = 10 - activePromotions.length;

      // Get random books that don't already have active promotions
      const randomBooks = await Book.aggregate([
        {
          $match: {
            _id: {
              $nin: booksWithActivePromotions.map((id) => require("mongoose").Types.ObjectId.createFromHexString(id)),
            },
          },
        },
        { $sample: { size: promotionsToCreate } },
      ]);

      // Generate promotions for each book
      const promotionEndDate = this.getEndOfDay();
      const newPromotions = [];

      for (const book of randomBooks) {
        // Random discount between 10% and 50%
        const discountPercent = Math.floor(Math.random() * 41) + 10;
        const promotionalPrice = +(book.price * (1 - discountPercent / 100)).toFixed(2);

        const promotion = new Promotion({
          book: book._id,
          discountPercent,
          originalPrice: book.price,
          promotionalPrice,
          startDate: new Date(),
          endDate: promotionEndDate,
          isActive: true,
        });

        await promotion.save();
        newPromotions.push(promotion);
      }

      console.log(`Generated ${newPromotions.length} new promotions.`);
      return {
        success: true,
        created: newPromotions.length,
        totalActive: activePromotions.length + newPromotions.length,
      };
    } catch (error) {
      console.error("Error generating promotions:", error);
      throw error;
    }
  }

  /**
   * Deactivate all expired promotions
   */
  static async deactivateExpiredPromotions() {
    const now = new Date();
    const result = await Promotion.updateMany(
      {
        isActive: true,
        endDate: { $lt: now },
      },
      {
        isActive: false,
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Deactivated ${result.modifiedCount} expired promotions.`);
    }

    return result.modifiedCount;
  }

  /**
   * Get all books with active promotions
   */
  static async getBooksOnPromotion(limit = 10) {
    // First ensure we have promotions
    await this.ensurePromotionsExist();

    const activePromotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    })
      .populate("book")
      .limit(limit);

    // Map to include promotion data directly on book object
    return activePromotions.map((promo) => ({
      ...promo.book.toObject(),
      promotion: {
        discountPercent: promo.discountPercent,
        originalPrice: promo.originalPrice,
        promotionalPrice: promo.promotionalPrice,
        endDate: promo.endDate,
      },
    }));
  }

  /**
   * Get promotion for a specific book
   */
  static async getBookPromotion(bookId) {
    const promotion = await Promotion.getActivePromotion(bookId);

    if (!promotion) return null;

    return {
      discountPercent: promotion.discountPercent,
      originalPrice: promotion.originalPrice,
      promotionalPrice: promotion.promotionalPrice,
      endDate: promotion.endDate,
    };
  }

  /**
   * Enhance books array with promotion data
   * Used to add promotion info to any list of books
   */
  static async enhanceBooksWithPromotions(books) {
    if (!books || books.length === 0) return books;

    const bookIds = books.map((book) => book._id || book);

    const promotions = await Promotion.find({
      book: { $in: bookIds },
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    // Create a map for quick lookup
    const promoMap = {};
    promotions.forEach((promo) => {
      promoMap[promo.book.toString()] = {
        discountPercent: promo.discountPercent,
        originalPrice: promo.originalPrice,
        promotionalPrice: promo.promotionalPrice,
        endDate: promo.endDate,
      };
    });

    // Add promotion data to each book
    return books.map((book) => {
      const bookId = (book._id || book).toString();
      const promotion = promoMap[bookId];

      if (promotion) {
        return {
          ...(book.toObject ? book.toObject() : book),
          promotion,
        };
      }
      return book.toObject ? book.toObject() : book;
    });
  }

  /**
   * Ensure promotions exist, generate if needed
   * This is called when fetching promotions to handle cold starts
   */
  static async ensurePromotionsExist() {
    const activeCount = await Promotion.countDocuments({
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (activeCount < 5) {
      console.log("Low promotion count, generating new promotions...");
      await this.generateDailyPromotions();
    }
  }

  /**
   * Get end of current day (midnight)
   */
  static getEndOfDay() {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Get a deterministic seed based on date
   * Used for consistent promotions throughout the day
   */
  static getDailySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  }
}

module.exports = PromotionService;
