const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/todoController");

router.get("/", auth, ctrl.getTodos);
router.post("/", auth, ctrl.createTodo);
router.put("/:id", auth, ctrl.updateTodo);

module.exports = router;
