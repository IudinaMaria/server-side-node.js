const db = require("../db");

module.exports = {
    async getByUser(userId, status = "all") {
        let query = "SELECT * FROM todos WHERE user_id = $1";
        let params = [userId];

        if (status === "active") query += " AND completed = false";
        if (status === "completed") query += " AND completed = true";

        query += " ORDER BY id ASC";

        const result = await db.query(query, params);
        return result.rows;
    },

    async findById(id) {
        const result = await db.query(
            "SELECT * FROM todos WHERE id = $1",
            [id]
        );
        return result.rows[0];
    },

    async create({ title, user_id }) {
        const result = await db.query(
            `INSERT INTO todos (title, user_id)
             VALUES ($1, $2)
             RETURNING *`,
            [title, user_id]
        );
        return result.rows[0];
    },

    async update(id, data) {
        const result = await db.query(
            `UPDATE todos
             SET title = $1,
                 completed = $2
             WHERE id = $3
             RETURNING *`,
            [data.title, data.completed, id]
        );
        return result.rows[0];
    },

    async delete(id) {
        await db.query("DELETE FROM todos WHERE id = $1", [id]);
    }
};
