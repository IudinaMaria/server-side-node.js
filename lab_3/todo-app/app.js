require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const authHtml = require("./middleware/authHtml");
const authRoutes = require("./routes/authRoutes");
const todoRoutes = require("./routes/todoRoutes");
const aboutController = require("./controllers/aboutController");
const authController = require("./controllers/authController");
const todoModel = require("./models/todo");

const errorController = require("./controllers/errorController");

const app = express();

// ---------- Middleware ----------
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(authHtml); // добавляет req.user

// ---------- View Engine ----------
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// ---------- HTML AUTH ----------
app.get("/login", (req, res) => res.render("login"));
app.post("/login", authController.loginHtml);

app.get("/register", (req, res) => res.render("register"));
app.post("/register", authController.registerHtml);

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

// ---------- HTML TASKS ----------
app.get("/", async (req, res) => {
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
});

app.get("/new", (req, res) => {
    if (!req.user) return res.redirect("/login");
    res.render("new", { user: req.user });
});

app.post("/new", async (req, res) => {
    await todoModel.create({
        title: req.body.title,
        user_id: req.user.id
    });
    res.redirect("/");
});

// toggle
app.post("/:id/toggle", async (req, res) => {
    const task = await todoModel.findById(req.params.id);
    if (!task || task.user_id !== req.user.id) return res.redirect("/");

    await todoModel.update(task.id, {
        title: task.title,
        completed: !task.completed
    });

    res.redirect("/");
});

// delete
app.post("/:id/delete", async (req, res) => {
    const task = await todoModel.findById(req.params.id);
    if (!task || task.user_id !== req.user.id) return res.redirect("/");

    await todoModel.delete(task.id);
    res.redirect("/");
});

// ---------- ABOUT ----------
app.get("/about", aboutController.about);

// ---------- API ----------
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

// ---------- 404 ----------
app.use(errorController.notFound);

// ---------- Server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
