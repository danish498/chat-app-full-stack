const { body } = require("express-validator");

const todoSchema = () => {
  return [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Password is required"),
    // body("username")
    //   .trim()
    //   .notEmpty()
    //   .withMessage("Username is required")
    //   .isLowercase()
    //   .withMessage("Username must be lowercase")
    //   .isLength({ min: 3 })
    //   .withMessage("Username must be at lease 3 characters long"),
    // body("password").trim().notEmpty().withMessage("Password is required"),
  ];
};

module.exports = {
  todoSchema,
};
