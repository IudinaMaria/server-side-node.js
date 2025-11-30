const express = require("express");
const router = express.Router();
const { Category } = require("../models");

// GET all categories
router.get("/", async (req, res) => {
  const categories = await Category.findAll();
  res.json(categories);
});

// GET category by ID
router.get("/:id", async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json(category);
});

// CREATE category
router.post("/", async (req, res) => {
  console.log("REQ BODY:", req.body);   // <<< ВАЖНО

  if (!req.body.name) {
    return res.status(400).json({ error: "name is required" });
  }

  const category = await Category.create({ name: req.body.name });
  res.status(201).json(category);
});


// UPDATE category
router.put("/:id", async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ error: "Category not found" });

  await category.update({ name: req.body.name });
  res.json(category);
});

// DELETE category
router.delete("/:id", async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ error: "Category not found" });

  await category.destroy();
  res.status(204).send();
});

module.exports = router;
