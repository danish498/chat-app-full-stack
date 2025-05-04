const express = require("express");

const {
  registerUser,
  getallUsers,
  checkUserNameAvailability,
  login,
} = require("../controllers/user.controllers.js");
const {
  userRegisterValidator,
  userLoginValidator,
} = require("../validators/user.validators.js");
const { validate } = require("../validators/validators.js");
const { verifyJWT } = require("../middlewares/auth.middleware.js");

const router = express.Router();

router.route("/register").post(userRegisterValidator(), validate, registerUser);
router
  .route("/login")
  .post(userLoginValidator(), validate, login);
router.route("/getAllUsers").get(verifyJWT, getallUsers);
router.route("/check-username").get(checkUserNameAvailability);

module.exports = router;
