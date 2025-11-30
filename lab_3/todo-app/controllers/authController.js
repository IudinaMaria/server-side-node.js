const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../db");
const SECRET = process.env.JWT_SECRET;

// =========================
// HTML REGISTER
// =========================
exports.registerHtml = async (req, res) => {
    const { username, email, password } = req.body;

    const exists = await db.query("SELECT 1 FROM users WHERE email=$1", [email]);
    if (exists.rows.length) return res.redirect("/register");

    const hash = await bcrypt.hash(password, 10);

    const newUser = await db.query(
        `INSERT INTO users(username, email, password)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [username, email, hash]
    );

    // Назначаем роль user
    await db.query(
        "INSERT INTO user_roles(user_id, role_id) VALUES($1, 2)",
        [newUser.rows[0].id]
    );

    res.redirect("/login");
};

// =========================
// HTML LOGIN
// =========================
exports.loginHtml = async (req, res) => {
    const { email, password } = req.body;

    const userRes = await db.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = userRes.rows[0];

    if (!user) return res.redirect("/login");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.redirect("/login");

    const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET,
        { expiresIn: "1h" }
    );

    res.cookie("token", token, { httpOnly: true });
    res.redirect("/");
};

// =========================
// API REGISTER
// =========================
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    const exists = await db.query("SELECT 1 FROM users WHERE email=$1", [email]);
    if (exists.rows.length) return res.status(400).json({ message: "Email exists" });

    const hash = await bcrypt.hash(password, 10);

    const newUser = await db.query(
        `INSERT INTO users(username, email, password)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [username, email, hash]
    );

    await db.query(
        "INSERT INTO user_roles(user_id, role_id) VALUES($1, 2)",
        [newUser.rows[0].id]
    );

    res.status(201).json({ id: newUser.rows[0].id });
};

// =========================
// API LOGIN
// =========================
exports.login = async (req, res) => {
    const { email, password } = req.body;

    const resUser = await db.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = resUser.rows[0];

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET,
        { expiresIn: "1h" }
    );

    res.json({ token });
};

// =========================
// PROFILE
// =========================
exports.profile = async (req, res) => {
    const userRes = await db.query("SELECT * FROM users WHERE id=$1", [req.user.id]);

    res.json(userRes.rows[0]);
};
