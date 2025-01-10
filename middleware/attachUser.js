module.exports = (req, res, next) => {
   if (req.session.user)
   {
      res.locals.user = {
         avatar: req.session.user.avatar,
         username: req.session.user.username,
      };
   }
   else
   {
      res.locals.user = null;
   }
   next();
}