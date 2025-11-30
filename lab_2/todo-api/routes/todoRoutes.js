const express = require("express");
const router = express.Router();
const { Todo, Category } = require("../models");
const { Op } = require("sequelize");

// GET /todos with filters and pagination
router.get("/", async (req, res) => {
  const {
    category,
    search,
    sort = "created_at:desc",
    page = 1,
    limit = 10,
  } = req.query;

  const [sortField, sortDir] = sort.split(":");

  const where = {};
  if (category) where.category_id = category;
  if (search) where.title = { [Op.iLike]: `%${search}%` };

  const offset = (page - 1) * limit;

  const { rows, count } = await Todo.findAndCountAll({
    where,
    include: [{ model: Category, as: "category" }],
    limit: Number(limit),
    offset,
    order: [[sortField, sortDir.toUpperCase()]],
  });

  res.json({
    data: rows,
    meta: {
      total: count,
      count: rows.length,
      limit: Number(limit),
      pages: Math.ceil(count / limit),
      currentPage: Number(page),
    },
  });
});

// GET /todos/:id
router.get("/:id", async (req, res) => {
  const todo = await Todo.findByPk(req.params.id, { include: { model: Category, as: "category" } });
  if (!todo) return res.status(404).json({ error: "Todo not found" });
  res.json(todo);
});

// CREATE todo
router.post("/", async (req, res) => {
  const todo = await Todo.create(req.body);
  res.status(201).json(todo);
});

// UPDATE todo
router.put("/:id", async (req, res) => {
  const todo = await Todo.findByPk(req.params.id);
  if (!todo) return res.status(404).json({ error: "Todo not found" });

  await todo.update(req.body);
  res.json(todo);
});

// TOGGLE completed
router.patch("/:id/toggle", async (req, res) => {
  const todo = await Todo.findByPk(req.params.id);
  if (!todo) return res.status(404).json({ error: "Todo not found" });

  todo.completed = !todo.completed;
  await todo.save();
  res.json(todo);
});

// DELETE todo
router.delete("/:id", async (req, res) => {
  const todo = await Todo.findByPk(req.params.id);
  if (!todo) return res.status(404).json({ error: "Todo not found" });

  await todo.destroy();
  res.status(204).send();
});

module.exports = router;
