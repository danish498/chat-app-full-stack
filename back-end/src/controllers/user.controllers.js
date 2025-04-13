const db = require("../models");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiErrors");
const bcryptUtil = require("../utils/bcrypt.util");
const jwtUtil = require("../utils/jwt.utils");
const color = require("colors");
const { Op } = require("sequelize");
const { logger } = require("../logger/winston.logger");
const { generateUniqueSuggestedNames } = require("../helper/helper");

const User = db.User;

//@description     Create user object
//@route           POST /register
//@access         Not Protected

const registerUser = asyncHandler(async (req, res, next) => {
  const { email, password, first_name, last_name, username, image } = req.body;

  console.log('testtttt', email)



  console.log("check the email over here", color.america(email));

  const existingUser = await User.findOne({ where: { email: email } });
  if (existingUser) {
    logger.error("User with email or username already exists");
    throw new ApiError(409, "User with email or username already exists", []);
  }

  const hashedPassword = await bcryptUtil.createHash(password);

  const userData = {
    email: email,
    password: hashedPassword,
    username: username,
    first_name: first_name,
    last_name: last_name,
  };

  const newUser = await User.create(userData);

  if (newUser.dataValues.password) {
    delete newUser.dataValues.password;
  }

  newUser.dataValues.token = await jwtUtil.createToken(newUser.user_id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: newUser }, "Users registered successfully.")
    );
});

const getallUsers = asyncHandler(async (req, res) => {
  const { username, email } = req.query;

  console.log("check the username", username);

  let whereClause = {};

  if (username || email) {
    whereClause = {
      [Op.and]: [{ email: { [Op.like]: `%${email}%` } }],
    };
  }

  const allUsers = await User.findAll({
    attributes: { exclude: ["password"] },
    where: whereClause,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, allUsers, "Users retrieved successfully..."));
});

const checkUserNameAvailability = asyncHandler(async (req, res, next) => {
  const { username } = req.body;

  const existingUser = await User.findOne({
    where: { username: username },
  });
  if (existingUser) {
    const suggestedUser = await generateUniqueSuggestedNames(username);
    return res
      .status(200)
      .json(
        new ApiResponse(
          202,
          { suggestionUser: suggestedUser },
          "User with username already exists"
        )
      );
  }

  return res.status(200).json(new ApiResponse(200, "Users is available"));
});

const login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username: username } });

  if (!user) {
    logger.error("User with email or username does not exists");
    throw new ApiError(409, "User with email or username does not exists", []);
  }

  const isMatch = await bcryptUtil.compareHash(password, user.password);
  if (!isMatch) {
    logger.error("Incorrect password");
    throw new ApiError(409, "Incorrect password", []);
  }

  if (user.dataValues.password) {
    delete user.dataValues.password;
  }

  user.dataValues.token = await jwtUtil.createToken(user.user_id);

  return res
    .status(200)
    .json(new ApiResponse(200, { user: user }, "Login successful"));
});

module.exports = {
  registerUser,
  getallUsers,
  checkUserNameAvailability,
  login,
};
