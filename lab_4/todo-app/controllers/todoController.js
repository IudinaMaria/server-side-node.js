const todo = require("../models/todo");

exports.getAll = async (req, res) => {
    const all = await todo.getByUser(req.user.id);
    res.json(all);
};

exports.create = async (req, res) => {
    const created = await todo.create({
        title: req.body.title,
        user_id: req.user.id
    });
    res.status(201).json(created);
};

exports.update = async (req, res) => {
    const updated = await todo.update(req.params.id, req.body);
    res.json(updated);
};

exports.delete = async (req, res) => {
    await todo.delete(req.params.id);
    res.sendStatus(204);
};
