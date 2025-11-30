const db = require("../db");

module.exports = {
    async findByEmail(email) {
        const r = await db.query("SELECT * FROM users WHERE email=$1", [email]);
        return r.rows[0];
    },

    async findById(id) {
        const r = await db.query("SELECT * FROM users WHERE id=$1", [id]);
        return r.rows[0];
    },

    async create({ username, email, password, role }) {
        const r = await db.query(
            `INSERT INTO users (username, email, password, role)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [username, email, password, role]
        );
        return r.rows[0];
    }
};
