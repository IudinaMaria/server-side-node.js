const db = require("../db");

module.exports = {
    // получить роли пользователя
    async getUserRoles(userId) {
        const res = await db.query(
            `SELECT r.name 
             FROM roles r
             JOIN user_roles ur ON ur.role_id = r.id
             WHERE ur.user_id = $1`,
            [userId]
        );
        return res.rows.map(r => r.name);
    },

    // получить permissions по ролям
    async getPermissionsByUser(userId) {
        const res = await db.query(
            `SELECT p.action
             FROM permissions p
             JOIN role_permissions rp ON rp.permission_id = p.id
             JOIN user_roles ur ON ur.role_id = rp.role_id
             WHERE ur.user_id = $1`,
            [userId]
        );
        return res.rows.map(p => p.action);
    }
};
