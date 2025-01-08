module.exports = (req, res, next) => {
   res.locals.isAuthenticated = req.session && req.session.user ? true : false;
   res.locals.user = req.session && req.session.user ? req.session.user : null;
   next();
};