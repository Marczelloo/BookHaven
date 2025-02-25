// Require jwt and use cookie extraction
const jwt = require('jsonwebtoken');

// Middleware to verify JWT in cookies
module.exports = (req, res, next) => {
   const token = req.cookies && req.cookies.accessToken;
   const refreshToken = req.cookies && req.cookies.refreshToken;

   if (!token) return res.redirect(302, `/signin?message=${encodeURIComponent('Unauthorized - no token provided')}`);

   
   if(!refreshToken) return res.redirect(302, `/signin?message=${encodeURIComponent('Unauthorized - no refresh token provided')}`);
   
   
   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if(err) 
      {
         if(!err.name === 'TokenExpiredError') res.redirect(302, `/signin?message=${encodeURIComponent('Unauthorized - invalid token')}`);

         jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if(err)
            {
               if(!err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Unauthorized - invalid refresh token' }); 

               return res.status(302).json({ message: 'Unauthorized - token expired, please sign in' });
            } 
            else
            {
               const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
               res.cookie('accessToken', accessToken, { httpOnly: true, secure: false, maxAge: 15 * 60 * 1000 });
               req.session.user._id = decoded.userId;
               next();
            }
         });
      }
      else
      {
         req.session.user._id = decoded.userId;
         next();
      }
   })
};