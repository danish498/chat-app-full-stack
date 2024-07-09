const db = require("../models");

const { faker } = require("@faker-js/faker");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiErrors");
const { ApiResponse } = require("../utils/ApiResponse");
const fs = require("fs");
const bcryptUtil = require("../utils/bcrypt.util");
const { removeLocalFile } = require("../helper/helper");

const User = db.User;

// Array of fake users
const users = new Array(200).fill("_").map(() => ({
  image: faker.image.avatar(),
  username: faker.internet.userName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
}));

/**
 * @description Seeding middleware for users api which other api services can use which are dependent on users
 *
 */

const seedUsers = asyncHandler(async (req, res, next) => {
  //   const userCount = await User.count();
  //   if (userCount >= USERS_COUNT) {
  // !    // Don't re-generate the users if we already have them in the database
  //     next();
  //     return;
  //   }

  await User.destroy({ where: {} }); // delete all the existing users from previous seedings
  //   await SocialProfile.deleteMany({}); // delete dependent model documents as well
  //   await EcomProfile.deleteMany({}); // delete dependent model documents as well
  //   await Cart.deleteMany({}); // delete dependent model documents as well

  //   removeLocalFile("./public/temp/seed-credentials.json"); // remove old credentials

  const credentials = [];

  // create Promise array
  const userCreationPromise = users.map(async (user) => {
    credentials.push({
      username: user.username.toLowerCase(),
      password: user.password,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      image: user.image,
    });
    await User.create({
      username: user.username.toLowerCase(),
      // password: await bcryptUtil.createHash(user.password),
      password: await bcryptUtil.createHash(user.password),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      image: user.image,
    });
  });

  // pass promises array to the Promise.all method
  await Promise.all(userCreationPromise);

  // Once users are created dump the credentials to the json file
  const json = JSON.stringify(credentials);

  fs.writeFileSync(
    "./public/temp/seed-credentials.json",
    json,
    "utf8",
    (err) => {
      console.log("Error while writing the credentials", err);
    }
  );

  // proceed with the request
  next();
});

/**
 * @description This api gives the saved credentials generated while seeding.
 */

const getGeneratedCredentials = asyncHandler(async (req, res) => {
  try {
    const json = fs.readFileSync("./public/temp/seed-credentials.json", "utf8");
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          JSON.parse(json),
          "Dummy credentials fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(404, "No credentials generated");
  }
});

module.exports = { getGeneratedCredentials, seedUsers };
