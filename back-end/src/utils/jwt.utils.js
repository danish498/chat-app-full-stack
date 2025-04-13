const jwt = require("jsonwebtoken");

exports.verifyToken = (token) =>
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

exports.createToken = async (data) => {
  const expiresIn = 60 * 60 * 24 * 7;
  return await jwt.sign({ userId: data }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: expiresIn,
  });
};
