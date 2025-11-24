const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.cookies && req.cookies.accessToken;
  const refreshToken = req.cookies && req.cookies.refreshToken;

  const wantsJson = req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"));

  if (!token) {
    const message = "Unauthorized - no token provided";
    return wantsJson
      ? res.status(401).json({ message })
      : res.redirect(302, `/signin?message=${encodeURIComponent(message)}`);
  }
  if (!refreshToken) {
    const message = "Unauthorized - no refresh token provided";
    return wantsJson
      ? res.status(401).json({ message })
      : res.redirect(302, `/signin?message=${encodeURIComponent(message)}`);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name !== "TokenExpiredError") {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        const message = "Unauthorized - invalid token";
        return wantsJson
          ? res.status(401).json({ message })
          : res.redirect(302, `/signin?message=${encodeURIComponent(message)}`);
      }

      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (errRefresh, decodedRefresh) => {
        if (errRefresh) {
          res.clearCookie("accessToken");
          res.clearCookie("refreshToken");
          const message =
            errRefresh.name === "TokenExpiredError"
              ? "Session expired, please sign in"
              : "Unauthorized - invalid refresh token";
          return wantsJson
            ? res.status(401).json({ message })
            : res.redirect(302, `/signin?message=${encodeURIComponent(message)}`);
        } else {
          const newAccessToken = jwt.sign({ userId: decodedRefresh.userId }, process.env.JWT_SECRET, {
            expiresIn: "15m",
          });
          res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000,
          });

          req.userId = decodedRefresh.userId;
          next();
        }
      });
    } else {
      req.userId = decoded.userId;
      next();
    }
  });
};
