const express = require('express');
const app  = express();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
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

app.use(session({
   secret: process.env.SESSION_SECRET,
   resave: false,
   saveUninitialized: false,
   cookie: { 
      secure: false,
      maxAge: 60 * 60 * 1000
   }
}))

const setAuthStatusMiddleware = require('./middleware/setAuthStatusMiddleware');
app.use(setAuthStatusMiddleware);

const pageRoutes = require('./routers/pageRoutes');
const userRoutes = require('./routers/userRoutes');
const cartRoutes = require('./routers/cartRoutes');
const wishlistRoutes = require('./routers/wishlistRoutes');
const orderRoutes = require('./routers/orderRoutes');
const searchRoutes = require('./routers/searchRoutes');

app.use('/', pageRoutes);
app.use('/user', userRoutes);
app.use('/cart', cartRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/order', orderRoutes);
app.use('/search', searchRoutes);

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
   console.log(`http://localhost:${PORT}`);
});