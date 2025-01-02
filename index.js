const express = require('express');
const app  = express();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { route } = require('./routers/landingPage.js');
require('dotenv').config();

const PORT = 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')))
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

const pageRoutes = [
   { path: '/', route: require('./routers/landingPage.js')},
   { path: '/explore', route : require('./routers/explorePage.js')},
   { path: '/book', route: require('./routers/bookPage.js')},
   { path: '/search', route: require('./routers/searchPage.js')},
   // { path: '/cart', route: require('./routers/cartPage.js')},
   // { path: '/wishlist', route: require('./routers/wishlistPage.js')},
   // { path: '/login', route: require('./routers/login.js')},
   // { path: '/register', route: require('./routers/register.js')},
   // { path: '/logout', route: require('./routers/logout.js')},
]

pageRoutes.forEach(route => {
   app.use(route.path, route.route);
})

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
   console.log(`http://localhost:${PORT}`);
});