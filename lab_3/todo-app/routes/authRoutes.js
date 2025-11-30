const router = require("express").Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

// =============== API AUTH ROUTES =================

// регистрация
router.post("/register", authController.register);

// вход (получение JWT)
router.post("/login", authController.login);

// просмотр профиля (требуется JWT)
router.get("/profile", auth, authController.profile);

module.exports = router;
