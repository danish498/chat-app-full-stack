const { asyncHandler } = require("../utils/asyncHandler.js");
const color = require("colors");
const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiErrors.js");
const jwtUtil = require("../utils/jwt.utils");

const db = require("../models/index.js");

const User = db.User;

const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");


  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    // Verify and decode the token
    const decoded = jwtUtil.verifyToken(token);

    console.log(color.bold(decoded.userId));

    // Verify user data consistency using Sequelize (optional)
    const user = await User.findByPk(decoded.userId); // Adapt using appropriate query methods
    // console.log(color.red("user", user));

    if (!user) {
      throw new ApiError(401, "Invalid user associated with token");
    }

    // Check for other data consistency checks if needed (e.g., user roles, permissions)

    // Attach user data to request, assuming subsequent usage
    req.user = user;

    // Allow protected route or action to proceed
    next();
  } catch (error) {
    console.error(color.red(error.message));

    // Handle JWT verification errors appropriately
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expired. Please log in again.");
    } else if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid token.");
    } else {
      // Handle other errors
      throw new ApiError(500, "Internal server error.");
    }
  }
});

const getLoggedInUserOrIgnore = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );
    req.user = user;
    next();
  } catch (error) {
    // Fail silently with req.user being falsy
    next();
  }
});

module.exports = {
  verifyJWT,
  getLoggedInUserOrIgnore,
};
