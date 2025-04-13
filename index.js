const express = require('express');
const app  = express();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo'); // Already required
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 8080;

mongoose.connect(process.env.MONGO_URI,{
   useNewUrlParser: true,
   useUnifiedTopology: true,
}).then(() => {
   console.log('Database connected');
}).catch((err) => {
   console.log('Database connection error', err);
})


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Session Configuration - Use MongoStore
app.use(session({
   secret: process.env.SESSION_SECRET || 'fallback_secret_key',
   resave: false,
   saveUninitialized: false,
   // Configure MongoStore
   store: MongoStore.create({
       mongoUrl: process.env.MONGO_URI, // Use your MongoDB connection string
       collectionName: 'sessions' // Optional: specify collection name for sessions
   }),
   cookie: { 
      secure: process.env.NODE_ENV === 'production', // Should be true in production
      httpOnly: true,
      maxAge: 60 * 60 * 1000 // 1 hour
   }
}));

// Flash Messages Middleware - Initialize AFTER session
app.use(flash());

// Custom Middleware
const setAuthStatusMiddleware = require('./middleware/setAuthStatusMiddleware');
const attachUser = require('./middleware/attachUser'); // Make sure attachUser is used if needed elsewhere
app.use(setAuthStatusMiddleware);
app.use(attachUser); // Ensure user is attached for views if needed

// Import Routers
const pageRoutes = require('./routers/pageRoutes');
const userRoutes = require('./routers/userRoutes');
const cartRoutes = require('./routers/cartRoutes');
const wishlistRoutes = require('./routers/wishlistRoutes');
const searchRoutes = require('./routers/searchRoutes');
const orderRoutes = require('./routers/orderRoutes');
const paymentRoutes = require('./routers/paymentRoutes'); // Import payment routes

// --- Instantiate Services ---
const OrderService = require('./models/orderService');
const UserService = require('./models/userService');
const InvoiceService = require('./services/invoiceService');
const invoiceService = new InvoiceService(OrderService, UserService);

// Pass services to controllers/routes as needed (example - adjust based on actual usage)
// This might involve modifying route definitions or using app.locals
app.locals.invoiceService = invoiceService; // Make service available globally via app.locals

// --- Mount Routers ---
app.use('/', pageRoutes);
app.use('/user', userRoutes);
app.use('/cart', cartRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/search', searchRoutes);
app.use('/orders', orderRoutes);
app.use('/payment', paymentRoutes); // Mount payment routes

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
   console.log(`http://localhost:${PORT}`);
});