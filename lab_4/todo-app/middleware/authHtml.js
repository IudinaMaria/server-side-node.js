const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        req.user = jwt.verify(token, SECRET);
    } catch (e) {
        req.user = null;
    }

    next();
};
