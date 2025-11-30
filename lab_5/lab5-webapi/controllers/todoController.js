const Todo = require("../models/todo");

exports.getTodos = (req, res) => {
    res.json(Todo.findAll());
};

exports.createTodo = (req, res) => {
    const todo = Todo.create({
        title: req.body.title,
        user: req.user.id
    });

    req.app.get("io").emit("todo_created", todo);

    res.status(201).json(todo);
};

exports.updateTodo = (req, res) => {
    const todo = Todo.update(Number(req.params.id), req.body);

    if (!todo) return res.status(404).json({ error: "Not found" });

    req.app.get("io").emit("todo_updated", todo);

    res.json(todo);
};
