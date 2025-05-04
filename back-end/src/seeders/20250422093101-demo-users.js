"use strict";

const { faker } = require("@faker-js/faker");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = [];

    for (let i = 0; i < 2; i++) {
      users.push({
        username: faker.internet.userName(),
        email: faker.internet.email(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        password: faker.internet.password(),
        profile_picture: faker.image.avatar(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await queryInterface.bulkInsert("users", users, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", null, {});
  },
};
