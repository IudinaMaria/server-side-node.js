const rbac = require("../models/rbac");

module.exports = function (requiredPermission) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const permissions = await rbac.getPermissionsByUser(req.user.id);

        if (!permissions.includes(requiredPermission)) {
            return res.status(403).json({ message: "Forbidden: no permission" });
        }

        next();
    };
};
