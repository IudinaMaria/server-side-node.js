const express = require("express");
const router = express.Router();

const todoController = require("../controllers/todoController");
const aboutController = require("../controllers/aboutController");

// список задач + фильтр
router.get("/", todoController.index);

// форма создания
router.get("/new", todoController.newForm);

// создание
router.post("/new", todoController.create);

// переключить статус
router.post("/:id/toggle", todoController.toggle);

// удалить
router.post("/:id/delete", todoController.delete);

// статическая страница
router.get("/about", aboutController.about);

module.exports = router;
