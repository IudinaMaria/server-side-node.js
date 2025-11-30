const router = require("express").Router();

const auth = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");
const todo = require("../controllers/todoController");

// NEW for Lab 4:
const asyncWrapper = require("../utils/asyncWrapper");
const { createTodoValidator, updateTodoValidator } = require("../validators/todoValidator");
const validationMiddleware = require("../middleware/validationMiddleware");


// ===============================
//           GET ALL
// ===============================
router.get(
    "/",
    auth,
    asyncWrapper(todo.getAll)
);


// ===============================
//           CREATE
// ===============================
router.post(
    "/",
    auth,
    checkPermission("CREATE_TODO"),

    // --- Валидация тела запроса ---
    createTodoValidator,
    validationMiddleware,

    asyncWrapper(todo.create)
);


// ===============================
//           UPDATE
// ===============================
router.put(
    "/:id",
    auth,
    checkPermission("UPDATE_TODO"),

    updateTodoValidator,
    validationMiddleware,

    asyncWrapper(todo.update)
);


// ===============================
//           DELETE
// ===============================
router.delete(
    "/:id",
    auth,
    checkPermission("DELETE_TODO"),
    asyncWrapper(todo.delete)
);


module.exports = router;
