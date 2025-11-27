const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
require("dotenv").config();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const PORT = process.env.PORT || 8080;
const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is required for MongoDB session storage.");
}

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log("Database connection error", err);
  });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
      ttl: 60 * 60, // 1 hour in seconds
      autoRemove: "native",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // Should be true in production
      httpOnly: true,
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  })
);

app.use(flash());

const setAuthStatusMiddleware = require("./middleware/setAuthStatusMiddleware");
const attachUser = require("./middleware/attachUser");
app.use(setAuthStatusMiddleware);
app.use(attachUser);

const pageRoutes = require("./routers/pageRoutes");
const userRoutes = require("./routers/userRoutes");
const cartRoutes = require("./routers/cartRoutes");
const wishlistRoutes = require("./routers/wishlistRoutes");
const searchRoutes = require("./routers/searchRoutes");
const orderRoutes = require("./routers/orderRoutes");
const paymentRoutes = require("./routers/paymentRoutes");
const reviewRoutes = require("./routers/reviewRoutes");

const OrderService = require("./models/orderService");
const UserService = require("./models/userService");
const InvoiceService = require("./services/invoiceService");
const invoiceService = new InvoiceService(OrderService, UserService);

app.locals.invoiceService = invoiceService;
app.use("/", pageRoutes);
app.use("/user", userRoutes);
app.use("/cart", cartRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/search", searchRoutes);
app.use("/orders", orderRoutes);
app.use("/payment", paymentRoutes);
app.use("/reviews", reviewRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
