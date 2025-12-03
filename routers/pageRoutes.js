const express = require("express");
const router = express.Router();
const redirectIfAuthenticated = require("../middleware/redirectIfAuthenticated");
const bookController = require("../controllers/bookController");
const authMiddleware = require("../middleware/authMiddleware");
const cartController = require("../controllers/cartController");
const wishlistController = require("../controllers/wishlistController");
const attachUser = require("../middleware/attachUser");
const userController = require("../controllers/userController");

router.use(attachUser);

router.get("/", (req, res) => {
  res.render("landingPage", { title: "Book Haven" });
});

router.get("/explore", bookController.getExplorePage);

router.get("/book/:id", bookController.getBookPage);

router.get("/cart", authMiddleware, cartController.getCart);

router.get("/wishlist", authMiddleware, wishlistController.getWishlist);

router.get("/signin", redirectIfAuthenticated, (req, res) => {
  const { message } = req.query;
  res.render("signInPage", { title: "Sign In", notificationMessage: message });
});

router.get("/signup", redirectIfAuthenticated, (req, res) => {
  res.render("signUpPage", { title: "Sign Up" });
});

router.get("/profile", authMiddleware, userController.getProfile);

// Coming Soon pages for footer links
const comingSoonPages = [
  { path: "/faq", name: "FAQ" },
  { path: "/contact", name: "Contact Us" },
  { path: "/shipping", name: "Shipping Information" },
  { path: "/returns", name: "Returns & Refunds" },
  { path: "/track-order", name: "Track My Order" },
  { path: "/help", name: "Help Center" },
  { path: "/about", name: "Our Story" },
  { path: "/careers", name: "Careers" },
  { path: "/blog", name: "Blog" },
  { path: "/press", name: "Press & Media" },
  { path: "/affiliate", name: "Affiliate Program" },
  { path: "/partner", name: "Partner With Us" },
  { path: "/terms", name: "Terms of Service" },
  { path: "/privacy", name: "Privacy Policy" },
  { path: "/cookies", name: "Cookie Policy" },
  { path: "/license", name: "Licensing" },
  { path: "/accessibility", name: "Accessibility" },
];

comingSoonPages.forEach((page) => {
  router.get(page.path, (req, res) => {
    res.render("comingSoonPage", { title: page.name, pageName: page.name });
  });
});

module.exports = router;
