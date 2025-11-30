const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;

    const token = authHeader?.split(" ")[1] || cookieToken;

    if (!token) {
        return res.status(401).json({ message: "No token" });
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
