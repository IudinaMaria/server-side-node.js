const Todo = require("../models/todo");

exports.index = (req, res) => {
    const status = req.query.status || "all";
    const todos = Todo.getAll(status);
    res.render("index", { todos, status });
};

exports.newForm = (req, res) => {
    res.render("new");
};

exports.create = (req, res) => {
    const { title } = req.body;
    if (title.trim().length > 0) {
        Todo.create(title);
    }
    res.redirect("/");
};

exports.toggle = (req, res) => {
    Todo.toggle(Number(req.params.id));
    res.redirect("/");
};

exports.delete = (req, res) => {
    Todo.delete(Number(req.params.id));
    res.redirect("/");
};
