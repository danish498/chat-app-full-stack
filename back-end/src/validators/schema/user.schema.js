const Joi = require("joi");

// Schema for user registration
const userSchema = Joi.object({
  email: Joi.string().email(),
  password: Joi.string().min(6).required(),
});

module.exports = {
  userSchema,
};
