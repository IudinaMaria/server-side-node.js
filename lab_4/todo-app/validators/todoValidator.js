const { body } = require("express-validator");

exports.createTodoValidator = [
    body("title")
        .notEmpty()
        .withMessage("Title is required"),
];

exports.updateTodoValidator = [
    body("title")
        .optional()
        .isString()
        .withMessage("Title must be a string"),

    body("completed")
        .optional()
        .isBoolean()
        .withMessage("Completed must be boolean"),
];
