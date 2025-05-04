"use strict";

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("users", "profile_picture", {
      type: Sequelize.STRING,
      defaultValue: "https://i.pravatar.cc/300?u=default",
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("Users", "profile_picture");
  },
};
