const { logger } = require("../logger/winston.logger");
const db = require("../models");

const fs = require("fs");

const User = db.User;

/**
 * Generates a unique username suggestion based on the provided username,
 * appending variations with random numbers and symbols until a unique name is found
 * in the database.
 *
 * @param {string} username The username to base suggestions on.
 * @returns {Promise<string|null>} A unique username suggestion, or null if none found.
 * @throws {Error} If an error occurs during database interaction.
 */
async function generateUniqueSuggestedNames(username) {
  const variations = ["_", "@", "", Math.floor(Math.random() * 100)];

  const suggestions = [];

  for (const variation of variations) {
    const suggestedName = username + variation;

    try {
      const existingUser = await User.findOne({
        where: { username: suggestedName },
      });
      if (!existingUser) {
        suggestions.push(suggestedName);
        if (suggestions.length === 3) {
          return suggestions; // Found 3 unique names, return them
        }
      }
    } catch (error) {
      logger.error(`Error checking username availability: ${error.message}`);
      throw error;
    }
  }

  // If all variations are taken, return null
  return null;
}

const removeLocalFile = (localPath) => {
  fs.unlink(localPath, (err) => {
    if (err) logger.log("Error while removing local files: ", err);
    else {
      logger.info("Removed local: ", localPath);
    }
  });
};

const getRandomNumber = (max) => {
  return Math.floor(Math.random() * max);
};

module.exports = {
  generateUniqueSuggestedNames,
  removeLocalFile,
  getRandomNumber,
};
