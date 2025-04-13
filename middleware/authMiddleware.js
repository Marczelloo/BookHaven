// Require jwt and use cookie extraction
const jwt = require('jsonwebtoken');

// Middleware to verify JWT in cookies
module.exports = (req, res, next) => {
   const token = req.cookies && req.cookies.accessToken;
   const refreshToken = req.cookies && req.cookies.refreshToken;

   if (!token) return res.redirect(302, `/signin?message=${encodeURIComponent('Unauthorized - no token provided')}`);
   if (!refreshToken) return res.redirect(302, `/signin?message=${encodeURIComponent('Unauthorized - no refresh token provided')}`);

   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
         if (err.name !== 'TokenExpiredError') {
             // Clear potentially invalid cookies and redirect
             res.clearCookie('accessToken');
             res.clearCookie('refreshToken');
             return res.redirect(302, `/signin?message=${encodeURIComponent('Unauthorized - invalid token')}`);
         }

         // Access token expired, try refresh token
         jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (errRefresh, decodedRefresh) => {
            if (errRefresh) {
               // Clear potentially invalid cookies and redirect
               res.clearCookie('accessToken');
               res.clearCookie('refreshToken');
               const message = errRefresh.name === 'TokenExpiredError' ? 'Session expired, please sign in' : 'Unauthorized - invalid refresh token';
               return res.redirect(302, `/signin?message=${encodeURIComponent(message)}`);
            } else {
               // Issue new access token
               const newAccessToken = jwt.sign({ userId: decodedRefresh.userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
               res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 }); // Use secure in production

               // Attach userId to the request object
               req.userId = decodedRefresh.userId;
               next();
            }
         });
      } else {
         // Access token is valid, attach userId
         req.userId = decoded.userId;
         next();
      }
   });
};