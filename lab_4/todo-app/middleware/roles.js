exports.isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admins only" });
    }
    next();
};

exports.isOwnerOrAdmin = (load) => {
    return async (req, res, next) => {
        const resource = await load(req);
        if (!resource) return res.status(404).json({ message: "Not found" });

        if (req.user.role === "admin" || resource.user_id === req.user.userId) {
            return next();
        }
        return res.status(403).json({ message: "Forbidden" });
    };
};
