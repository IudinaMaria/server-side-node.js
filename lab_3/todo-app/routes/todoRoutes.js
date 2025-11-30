const router = require("express").Router();
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");
const todo = require("../controllers/todoController");

// GET all todos (user can see only свои)
router.get("/", auth, todo.getAll);

// CREATE
router.post("/", 
    auth, 
    checkPermission("CREATE_TODO"), 
    todo.create
);

// UPDATE
router.put("/:id", 
    auth, 
    checkPermission("UPDATE_TODO"),
    todo.update
);

// DELETE
router.delete("/:id", 
    auth,
    checkPermission("DELETE_TODO"),
    todo.delete
);

module.exports = router;
