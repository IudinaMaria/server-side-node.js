require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const Sentry = require("@sentry/node");

const authHtml = require("./middleware/authHtml");
const authRoutes = require("./routes/authRoutes");
const todoRoutes = require("./routes/todoRoutes");
const aboutController = require("./controllers/aboutController");
const authController = require("./controllers/authController");
const todoModel = require("./models/todo");

const errorHandler = require("./middleware/errorHandler");
const NotFoundError = require("./errors/NotFoundError");
const errorController = require("./controllers/errorController");

const logger = require("./logger");

const app = express();

// ----------------- SENTRY -----------------
Sentry.init({
    dsn: process.env.SENTRY_DSN || "",
    tracesSampleRate: 1.0,
});

// Sentry должен быть первым
app.use(Sentry.Handlers.requestHandler());

// ----------------- LOGGING -----------------
app.use(
    morgan("combined", {
        stream: {
            write: (msg) => logger.info(msg.trim()),
        },
    })
);

// ----------------- BUILT-IN MIDDLEWARE -----------------
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(authHtml);

// ----------------- VIEW ENGINE -----------------
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// ----------------- HTML AUTH -----------------
app.get("/login", (req, res) => res.render("login"));
app.post("/login", authController.loginHtml);

app.get("/register", (req, res) => res.render("register"));
app.post("/register", authController.registerHtml);

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

// ----------------- HTML TASKS -----------------
app.get("/", async (req, res, next) => {
    try {
        let todos = [];

        if (req.user) {
            todos = await todoModel.getByUser(
                req.user.id,
                req.query.status || "all"
            );
        }

        res.render("index", {
            user: req.user,
            todos,
            status: req.query.status || "all"
        });
    } catch (err) {
        next(err);
    }
});

app.get("/new", (req, res) => {
    if (!req.user) return res.redirect("/login");
    res.render("new", { user: req.user });
});

app.post("/new", async (req, res, next) => {
    try {
        await todoModel.create({
            title: req.body.title,
            user_id: req.user.id
        });
        res.redirect("/");
    } catch (err) {
        next(err);
    }
});

// toggle
app.post("/:id/toggle", async (req, res, next) => {
    try {
        const task = await todoModel.findById(req.params.id);
        if (!task || task.user_id !== req.user.id) return res.redirect("/");

        await todoModel.update(task.id, {
            title: task.title,
            completed: !task.completed
        });

        res.redirect("/");
    } catch (err) {
        next(err);
    }
});

// delete
app.post("/:id/delete", async (req, res, next) => {
    try {
        const task = await todoModel.findById(req.params.id);
        if (!task || task.user_id !== req.user.id) return res.redirect("/");

        await todoModel.delete(task.id);
        res.redirect("/");
    } catch (err) {
        next(err);
    }
});

// ----------------- ABOUT -----------------
app.get("/about", aboutController.about);

// ----------------- API ROUTES -----------------
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

// -----------------------
// 404 ДЛЯ API (JSON)
// -----------------------
app.use("/api", (req, res, next) => {
    next(new NotFoundError("API route not found"));
});

// -----------------------
// 404 ДЛЯ HTML (рендер Pug/HTML)
// -----------------------
app.use(errorController.notFound);

// ----------------- GLOBAL ERROR HANDLER (JSON) -----------------
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

// ----------------- SERVER -----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
